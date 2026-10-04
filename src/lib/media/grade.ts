/**
 * Colour grade for the admin «Студия»: one set of parameters, one function that turns them into a
 * 3D LUT, and the `.cube` text ffmpeg reads.
 *
 * The same module serves both ends, which is the point of it:
 *
 *  - the admin's WebGL2 preview uploads `gradeToLut(params)` as a 3D texture and samples it per
 *    pixel ({@link LUT_TEXTURE}, {@link LUT_GLSL});
 *  - the render worker (`scripts/media/render-clips.mjs`, through the scripts' TS loader) writes
 *    `lutToCube(gradeToLut(params))` to a file and hands it to ffmpeg's `lut3d` filter.
 *
 * So what she sees on the phone is what lands in the exercise library, up to video compression.
 *
 * ## The math
 *
 * Every step works on one channel value `v` in 0…1 (the decoded, gamma-encoded picture — what a
 * `<video>` frame and ffmpeg's RGB both are), in this order:
 *
 *  1. **exposure** (stops, −3…3): to linear light (sRGB curve), × 2^exposure, back to sRGB.
 *  2. **blacks / whites** (−1…1): levels. Input black `b = −0.25·blacks`, input white
 *     `w = 1 − 0.25·whites`, `v = (v − b) / (w − b)`. Positive blacks lift the shadows, positive
 *     whites brighten the highlights — the direction the Photos and Lightroom sliders go.
 *  3. **contrast** (−1…1): a straight line through mid grey, slope `2^(1.5·contrast)`.
 *  4. **brightness** (−1…1): a midtone gamma, `v^(2^−brightness)`: brighter or darker without
 *     clipping either end.
 *  5. **curves**: the master curve, then the channel's own (R, G or B). Each is a monotone cubic
 *     (Fritsch–Carlson) through its points; with no point at the left or right edge the curve also
 *     passes through (0,0) / (1,1). No points at all is the identity.
 *
 * Each result is clamped to 0…1 after every step. A step whose parameter is at its default is
 * skipped outright, so the default grade is the identity exactly, not to within rounding.
 *
 * Every step is per channel, so the LUT is separable: output R depends on input R only. It is
 * still a 3D LUT (what `lut3d` and a 3D texture take), which leaves room for a cross-channel step
 * such as saturation later without changing anything downstream. Separable also means trilinear
 * (the GPU) and tetrahedral interpolation give the same answer, so the preview's filtering and
 * ffmpeg's agree.
 *
 * Bump {@link GRADE_VERSION} whenever this math changes: clips store the version they were graded
 * with, and the worker refuses a version it does not know rather than render it differently.
 */

/** The version of the math above. Stored on each clip (`media_clips.grade_version`). */
export const GRADE_VERSION = 1;

/** A curve point: input → output, both 0…1. */
export type CurvePoint = readonly [x: number, y: number];

export interface GradeCurves {
  master: CurvePoint[];
  r: CurvePoint[];
  g: CurvePoint[];
  b: CurvePoint[];
}

export interface GradeParams {
  /** Stops of light, −3…3. */
  exposure: number;
  /** −1…1. */
  contrast: number;
  /** Midtones, −1…1. */
  brightness: number;
  /** Highlights' end of the levels, −1…1. */
  whites: number;
  /** Shadows' end of the levels, −1…1. */
  blacks: number;
  curves: GradeCurves;
}

export type GradeSlider = 'exposure' | 'contrast' | 'brightness' | 'whites' | 'blacks';

/** Slider ranges; the UI reads them from here so they cannot drift from the clamp. */
export const GRADE_LIMITS: Readonly<Record<GradeSlider, { min: number; max: number }>> = {
  exposure: { min: -3, max: 3 },
  contrast: { min: -1, max: 1 },
  brightness: { min: -1, max: 1 },
  whites: { min: -1, max: 1 },
  blacks: { min: -1, max: 1 },
};

export const GRADE_SLIDERS: readonly GradeSlider[] = [
  'exposure',
  'contrast',
  'brightness',
  'whites',
  'blacks',
];

export const CURVE_CHANNELS = ['master', 'r', 'g', 'b'] as const;
export type CurveChannel = (typeof CURVE_CHANNELS)[number];

/** More points than this on one curve is a broken editor, not a grade. */
export const MAX_CURVE_POINTS = 16;

export const DEFAULT_LUT_SIZE = 33;
const MIN_LUT_SIZE = 2;
const MAX_LUT_SIZE = 65;

/** Points closer than this on x are one point (the later one wins). */
const SAME_X = 1e-4;

export function defaultGrade(): GradeParams {
  return {
    exposure: 0,
    contrast: 0,
    brightness: 0,
    whites: 0,
    blacks: 0,
    curves: { master: [], r: [], g: [], b: [] },
  };
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const clamp01 = (v: number): number => (v <= 0 ? 0 : v >= 1 ? 1 : v);

function slider(value: unknown, key: GradeSlider): number {
  const n = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(n)) return 0;
  const { min, max } = GRADE_LIMITS[key];
  return clamp(n, min, max);
}

/**
 * A curve from anything: points that are not two finite numbers are dropped, coordinates clamped
 * to 0…1, sorted by x, near-duplicates on x merged (the later one wins) and the list capped.
 */
export function clampCurve(value: unknown): CurvePoint[] {
  if (!Array.isArray(value)) return [];
  const points: CurvePoint[] = [];
  for (const p of value) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const [x, y] = p as unknown[];
    if (typeof x !== 'number' || typeof y !== 'number') continue;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    points.push([clamp01(x), clamp01(y)]);
  }
  // Stable sort keeps input order among equal x, so "the later one wins" below means what it says.
  points.sort((a, b) => a[0] - b[0]);
  const out: CurvePoint[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && p[0] - last[0] < SAME_X) out[out.length - 1] = p;
    else out.push(p);
  }
  if (out.length <= MAX_CURVE_POINTS) return out;
  // Keep both ends and an even spread between them.
  const step = (out.length - 1) / (MAX_CURVE_POINTS - 1);
  return Array.from({ length: MAX_CURVE_POINTS }, (_, i) => out[Math.round(i * step)]!);
}

/**
 * Grade parameters from anything — a clip's jsonb, a pasted clipboard, a half-written form.
 * Missing or broken fields read as their default; numbers are clamped to {@link GRADE_LIMITS}.
 */
export function clampGrade(value: unknown): GradeParams {
  const v =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const c =
    typeof v.curves === 'object' && v.curves !== null && !Array.isArray(v.curves)
      ? (v.curves as Record<string, unknown>)
      : {};
  return {
    exposure: slider(v.exposure, 'exposure'),
    contrast: slider(v.contrast, 'contrast'),
    brightness: slider(v.brightness, 'brightness'),
    whites: slider(v.whites, 'whites'),
    blacks: slider(v.blacks, 'blacks'),
    curves: {
      master: clampCurve(c.master),
      r: clampCurve(c.r),
      g: clampCurve(c.g),
      b: clampCurve(c.b),
    },
  };
}

/** A curve that maps every input to itself (no points, or only points on the diagonal). */
function isIdentityCurve(points: readonly CurvePoint[]): boolean {
  return points.every(([x, y]) => Math.abs(x - y) < 1e-9);
}

/** True when the grade changes nothing: the worker then skips `lut3d` altogether. */
export function isIdentityGrade(params: GradeParams): boolean {
  return (
    GRADE_SLIDERS.every((k) => params[k] === 0) &&
    CURVE_CHANNELS.every((ch) => isIdentityCurve(params.curves[ch]))
  );
}

// --- curves ----------------------------------------------------------------------------------

type CurveFn = (x: number) => number;

const identity: CurveFn = (x) => x;

/**
 * Monotone cubic interpolation (Fritsch–Carlson) through the points, flat beyond the first and
 * last. Monotone means: rising points give a curve that never dips between them, which is what a
 * curves editor promises and what a plain spline breaks.
 */
export function curveFunction(points: readonly CurvePoint[]): CurveFn {
  if (isIdentityCurve(points)) return identity;
  const pts: CurvePoint[] = [...points];
  if (pts[0]![0] > 0) pts.unshift([0, 0]);
  if (pts[pts.length - 1]![0] < 1) pts.push([1, 1]);
  const n = pts.length;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);

  // Secant slopes, then tangents: zero at a local extremum, the mean elsewhere, then limited so
  // the cubic cannot overshoot (alpha² + beta² ≤ 9).
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1]! - ys[i]!) / (xs[i + 1]! - xs[i]!));
  const m: number[] = new Array<number>(n).fill(0);
  m[0] = d[0]!;
  m[n - 1] = d[n - 2]!;
  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1]! * d[i]! <= 0 ? 0 : (d[i - 1]! + d[i]!) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i]! / d[i]!;
    const b = m[i + 1]! / d[i]!;
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i]!;
      m[i + 1] = t * b * d[i]!;
    }
  }

  return (x) => {
    if (x <= xs[0]!) return ys[0]!;
    if (x >= xs[n - 1]!) return ys[n - 1]!;
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]!) i++;
    const h = xs[i + 1]! - xs[i]!;
    const t = (x - xs[i]!) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i]! +
      (t3 - 2 * t2 + t) * h * m[i]! +
      (-2 * t3 + 3 * t2) * ys[i + 1]! +
      (t3 - t2) * h * m[i + 1]!
    );
  };
}

// --- the per-channel function -------------------------------------------------------------------

const srgbToLinear = (v: number): number =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const linearToSrgb = (v: number): number =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;

/** The three channel functions of a grade (see the math in the header). Inputs and outputs 0…1. */
export function channelFunctions(params: GradeParams): [CurveFn, CurveFn, CurveFn] {
  const p = clampGrade(params);
  const steps: CurveFn[] = [];
  if (p.exposure !== 0) {
    const gain = Math.pow(2, p.exposure);
    steps.push((v) => clamp01(linearToSrgb(clamp01(srgbToLinear(v) * gain))));
  }
  if (p.blacks !== 0 || p.whites !== 0) {
    const lo = -0.25 * p.blacks;
    const hi = 1 - 0.25 * p.whites;
    steps.push((v) => clamp01((v - lo) / (hi - lo)));
  }
  if (p.contrast !== 0) {
    const k = Math.pow(2, 1.5 * p.contrast);
    steps.push((v) => clamp01(0.5 + (v - 0.5) * k));
  }
  if (p.brightness !== 0) {
    const g = Math.pow(2, -p.brightness);
    steps.push((v) => clamp01(Math.pow(v, g)));
  }
  if (!isIdentityCurve(p.curves.master)) {
    const f = curveFunction(p.curves.master);
    steps.push((v) => clamp01(f(v)));
  }
  const shared: CurveFn = (v) => {
    let out = v;
    for (const s of steps) out = s(out);
    return out;
  };
  const channel = (points: CurvePoint[]): CurveFn => {
    if (isIdentityCurve(points)) return shared;
    const f = curveFunction(points);
    return (v) => clamp01(f(shared(v)));
  };
  return [channel(p.curves.r), channel(p.curves.g), channel(p.curves.b)];
}

/** One pixel through the grade, exactly (no LUT). Values 0…1. */
export function applyGrade(
  params: GradeParams,
  rgb: readonly [number, number, number],
): [number, number, number] {
  const [fr, fg, fb] = channelFunctions(params);
  return [fr(rgb[0]), fg(rgb[1]), fb(rgb[2])];
}

// --- the LUT ---------------------------------------------------------------------------------

/**
 * The grade as a 3D LUT: `size³` RGB triples, 0…1, **red fastest, then green, then blue** — the
 * `.cube` order and the order `texImage3D` reads (width = R, height = G, depth = B). Entry
 * `(r, g, b)` is at `3 · (r + size · (g + size · b))`.
 */
export function gradeToLut(params: GradeParams, size = DEFAULT_LUT_SIZE): Float32Array {
  const n = Math.round(clamp(size, MIN_LUT_SIZE, MAX_LUT_SIZE));
  const [fr, fg, fb] = channelFunctions(params);
  const rs = new Float64Array(n);
  const gs = new Float64Array(n);
  const bs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    rs[i] = fr(x);
    gs[i] = fg(x);
    bs[i] = fb(x);
  }
  const lut = new Float32Array(n * n * n * 3);
  let o = 0;
  for (let b = 0; b < n; b++) {
    for (let g = 0; g < n; g++) {
      for (let r = 0; r < n; r++) {
        lut[o++] = rs[r]!;
        lut[o++] = gs[g]!;
        lut[o++] = bs[b]!;
      }
    }
  }
  return lut;
}

/** Edge length of a LUT made by {@link gradeToLut}; throws on a buffer of any other shape. */
export function lutSize(lut: Float32Array): number {
  const n = Math.round(Math.cbrt(lut.length / 3));
  if (n < MIN_LUT_SIZE || n * n * n * 3 !== lut.length) throw new Error('lut_shape');
  return n;
}

/**
 * The LUT as Adobe/Resolve `.cube` text, which ffmpeg's `lut3d=file=…` reads. Six decimals: a
 * 16-bit step is 1.5e-5, so nothing a 10-bit source can show is rounded away.
 */
export function lutToCube(lut: Float32Array, title = 'forma grade'): string {
  const n = lutSize(lut);
  const lines = [
    `TITLE "${title.replace(/["\n\r]/g, '')}"`,
    `LUT_3D_SIZE ${n}`,
    'DOMAIN_MIN 0.0 0.0 0.0',
    'DOMAIN_MAX 1.0 1.0 1.0',
  ];
  for (let i = 0; i < lut.length; i += 3) {
    lines.push(`${lut[i]!.toFixed(6)} ${lut[i + 1]!.toFixed(6)} ${lut[i + 2]!.toFixed(6)}`);
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Trilinear sampling of a LUT at one colour — what the GPU does with the 3D texture, and what the
 * render check compares ffmpeg's output against.
 */
export function sampleLut(
  lut: Float32Array,
  rgb: readonly [number, number, number],
): [number, number, number] {
  const n = lutSize(lut);
  const idx = (c: number): [number, number, number] => {
    const x = clamp01(c) * (n - 1);
    const i0 = Math.min(n - 2, Math.floor(x));
    return [i0, i0 + 1, x - i0];
  };
  const [r0, r1, fr] = idx(rgb[0]);
  const [g0, g1, fg] = idx(rgb[1]);
  const [b0, b1, fb] = idx(rgb[2]);
  const at = (r: number, g: number, b: number, ch: number): number =>
    lut[3 * (r + n * (g + n * b)) + ch]!;
  const out: [number, number, number] = [0, 0, 0];
  for (let ch = 0; ch < 3; ch++) {
    const c00 = at(r0, g0, b0, ch) * (1 - fr) + at(r1, g0, b0, ch) * fr;
    const c10 = at(r0, g1, b0, ch) * (1 - fr) + at(r1, g1, b0, ch) * fr;
    const c01 = at(r0, g0, b1, ch) * (1 - fr) + at(r1, g0, b1, ch) * fr;
    const c11 = at(r0, g1, b1, ch) * (1 - fr) + at(r1, g1, b1, ch) * fr;
    const c0 = c00 * (1 - fg) + c10 * fg;
    const c1 = c01 * (1 - fg) + c11 * fg;
    out[ch] = c0 * (1 - fb) + c1 * fb;
  }
  return out;
}

// --- for the WebGL2 preview ------------------------------------------------------------------

/**
 * How the preview uploads {@link gradeToLut}'s buffer, so it samples exactly what ffmpeg applies:
 *
 * ```ts
 * gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB16F, size, size, size, 0, gl.RGB, gl.FLOAT, lut);
 * // LINEAR min/mag filter, CLAMP_TO_EDGE on S, T and R
 * ```
 *
 * RGB16F rather than RGB32F: float32 textures are only filterable with an extension many phones
 * lack, half floats are filterable in core WebGL2, and a Float32Array uploads into one directly.
 * The texel centres sit half a texel in from each edge, so a colour `c` in 0…1 is looked up at
 * `c · (size − 1) / size + 0.5 / size` — {@link LUT_GLSL} does exactly that.
 */
export const LUT_TEXTURE = {
  target: 'TEXTURE_3D',
  internalFormat: 'RGB16F',
  format: 'RGB',
  type: 'FLOAT',
  filter: 'LINEAR',
  wrap: 'CLAMP_TO_EDGE',
  /** Width = R, height = G, depth = B: red varies fastest in the buffer. */
  order: 'rgb',
} as const;

/** The texture coordinate for colour channel value `c` in a LUT of edge `size`. */
export function lutTexCoord(c: number, size: number): number {
  return (clamp01(c) * (size - 1)) / size + 0.5 / size;
}

/** GLSL ES 3.00 lookup the preview's fragment shader includes. */
export const LUT_GLSL = `uniform mediump sampler3D u_lut;
uniform float u_lutSize;
vec3 gradeLookup(vec3 c) {
  vec3 uvw = clamp(c, 0.0, 1.0) * ((u_lutSize - 1.0) / u_lutSize) + 0.5 / u_lutSize;
  return texture(u_lut, uvw).rgb;
}
`;
