/**
 * The grade preview's WebGL2 renderer: one video frame in, the same frame through the grade's 3D
 * LUT out.
 *
 * The LUT is `gradeToLut(params)` uploaded as {@link LUT_TEXTURE} says (RGB16F from a Float32Array,
 * LINEAR, CLAMP_TO_EDGE) and looked up with {@link LUT_GLSL}, so the GPU samples exactly the table
 * the worker writes to `.cube` for ffmpeg. Each frame of the `<video>` is uploaded as a 2D texture
 * and drawn into a full-canvas quad; `u_crop` picks the part of the frame shown and `u_bypass`
 * skips the LUT for the before/after hold.
 *
 * No React here: the component owns the canvas, the video and the loop, and calls in.
 */
import { LUT_GLSL, lutSize } from '@/lib/media/grade';

const VERTEX = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  // y down, like the crop and like the rows of an uploaded video frame.
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D u_frame;
uniform vec4 u_crop;
uniform bool u_bypass;
in vec2 v_uv;
out vec4 outColor;
${LUT_GLSL}
void main() {
  vec3 c = texture(u_frame, u_crop.xy + v_uv * u_crop.zw).rgb;
  outColor = vec4(u_bypass ? c : gradeLookup(c), 1.0);
}
`;

export type DrawResult = 'drawn' | 'not_ready' | 'tainted';

export interface DrawOptions {
  /** x, y, w, h of the frame to show, 0…1, y down. */
  crop: readonly [number, number, number, number];
  /** Show the picture as filmed. */
  bypass: boolean;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export class GradeRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly frame: WebGLTexture;
  private readonly lut: WebGLTexture;
  private readonly buffer: WebGLBuffer;
  private readonly vao: WebGLVertexArrayObject;
  private readonly loc: {
    frame: WebGLUniformLocation | null;
    lut: WebGLUniformLocation | null;
    lutSize: WebGLUniformLocation | null;
    crop: WebGLUniformLocation | null;
    bypass: WebGLUniformLocation | null;
  };
  private size = 0;
  private hasFrame = false;

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) throw new Error('webgl_shader');
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('webgl_link');
    this.program = program;

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    const frame = gl.createTexture();
    const lut = gl.createTexture();
    if (!buffer || !vao || !frame || !lut) throw new Error('webgl_alloc');
    this.buffer = buffer;
    this.vao = vao;
    this.frame = frame;
    this.lut = lut;

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    gl.bindTexture(gl.TEXTURE_2D, frame);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_3D, lut);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    this.loc = {
      frame: gl.getUniformLocation(program, 'u_frame'),
      lut: gl.getUniformLocation(program, 'u_lut'),
      lutSize: gl.getUniformLocation(program, 'u_lutSize'),
      crop: gl.getUniformLocation(program, 'u_crop'),
      bypass: gl.getUniformLocation(program, 'u_bypass'),
    };
  }

  /** A renderer on this canvas, or null when the browser has no WebGL2 (or it failed to start). */
  static create(canvas: HTMLCanvasElement): GradeRenderer | null {
    try {
      const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
      });
      return gl ? new GradeRenderer(gl) : null;
    } catch {
      return null;
    }
  }

  /** Upload a LUT from `gradeToLut`. */
  setLut(lut: Float32Array): void {
    const gl = this.gl;
    const n = lutSize(lut);
    gl.bindTexture(gl.TEXTURE_3D, this.lut);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB16F, n, n, n, 0, gl.RGB, gl.FLOAT, lut);
    this.size = n;
  }

  /**
   * Draw the video's current frame. `upload: false` redraws the last uploaded frame (a slider
   * moved while paused), which is also all there is to do before the video has a frame.
   */
  draw(video: HTMLVideoElement | null, options: DrawOptions, upload = true): DrawResult {
    const gl = this.gl;
    if (this.size === 0) return 'not_ready';
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.frame);
    if (upload && video && video.readyState >= 2 && video.videoWidth > 0) {
      try {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        this.hasFrame = true;
      } catch {
        // A cross-origin video without CORS headers taints the canvas: the upload throws.
        return 'tainted';
      }
    }
    if (!this.hasFrame) return 'not_ready';

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.useProgram(this.program);
    gl.uniform1i(this.loc.frame, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this.lut);
    gl.uniform1i(this.loc.lut, 1);
    gl.uniform1f(this.loc.lutSize, this.size);
    gl.uniform4f(this.loc.crop, options.crop[0], options.crop[1], options.crop[2], options.crop[3]);
    gl.uniform1i(this.loc.bypass, options.bypass ? 1 : 0);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    return 'drawn';
  }

  isContextLost(): boolean {
    return this.gl.isContextLost();
  }

  /**
   * Free everything, the context included. Each clip opened in the editor is a new canvas, and
   * a WebView keeps only a handful of live contexts (iOS: around sixteen) before it starts losing
   * the oldest — which can be the one on screen. Losing ours on purpose keeps the count at one.
   */
  dispose(): void {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    gl.deleteTexture(this.frame);
    gl.deleteTexture(this.lut);
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
