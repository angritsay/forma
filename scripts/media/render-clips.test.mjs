/**
 * The render worker end to end on this machine, with no Supabase: a synthetic video (ffmpeg's
 * testsrc2) goes through `renderPiece` — the same function the worker runs — with no grade and
 * with a strong one, and a decoded output frame is compared with the same input frame put through
 * the LUT in JavaScript (`gradeToLut` + trilinear `sampleLut`, what the admin's WebGL preview
 * does). What is left is video compression, which the no-grade run measures.
 *
 * Skipped when there is no ffmpeg to run (no ffmpeg-static and none on PATH).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as auto from '@/lib/media/autoEnhance';
import * as grade from '@/lib/media/grade';
import * as crop from '@/lib/media/crop';
import {
  AUTO_DENOISE,
  AUTO_SHARPEN,
  clipFilters,
  clipArgs,
  findFfmpeg,
  loopArgs,
  renderPiece,
  sampleArgs,
  shortError,
  stillArgs,
  stillAt,
  stillClipArgs,
  STILL_CLIP_FPS,
  STILL_CLIP_SECONDS,
  uploadPlan,
} from './render-clips.mjs';

const ffmpeg = findFfmpeg();
const hasFfmpeg = (() => {
  try {
    execFileSync(ffmpeg, ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const W = 320;
const H = 240;
const FPS = 25;

/** One frame (by index) of a video as packed RGB bytes, plus its size. */
function frame(file, index) {
  const buf = execFileSync(
    ffmpeg,
    [
      '-v',
      'error',
      '-i',
      file,
      '-vf',
      `select=eq(n\\,${index})`,
      '-frames:v',
      '1',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-',
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return buf;
}

function size(file) {
  try {
    execFileSync(ffmpeg, ['-i', file], { stdio: 'pipe' });
  } catch (err) {
    const m = /, (\d{2,5})x(\d{2,5})[ ,]/.exec(String(err.stderr));
    if (m) return [Number(m[1]), Number(m[2])];
  }
  return [0, 0];
}

/** Mean absolute difference, in 0…1, between two RGB buffers. */
function mad(a, b) {
  expect(a.length).toBe(b.length);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length / 255;
}

/** An RGB buffer through the LUT, as the GPU (and ffmpeg's lut3d) interpolate it. */
function throughLut(buf, lut) {
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i += 3) {
    const [r, g, b] = grade.sampleLut(lut, [buf[i] / 255, buf[i + 1] / 255, buf[i + 2] / 255]);
    out[i] = Math.round(r * 255);
    out[i + 1] = Math.round(g * 255);
    out[i + 2] = Math.round(b * 255);
  }
  return out;
}

const STRONG = {
  exposure: 0.8,
  contrast: 0.5,
  brightness: -0.3,
  whites: 0.4,
  blacks: -0.3,
  curves: {
    master: [
      [0.3, 0.25],
      [0.7, 0.8],
    ],
    r: [[0.5, 0.6]],
    g: [],
    b: [[0.5, 0.4]],
  },
};

// The piece starts 0.4 s before the mark (the keyframe pad); the clip is two seconds of it.
const OFFSET_FRAMES = 10;
const job = (over) => ({
  raw_offset_s: OFFSET_FRAMES / FPS,
  start_s: 10,
  end_s: 12,
  crop: null,
  grade: null,
  grade_version: 1,
  ...over,
});

describe.skipIf(!hasFfmpeg)('render-clips --local on a synthetic video', () => {
  let dir;
  let input;
  const mods = { grade, crop, auto };

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'render-clips-test-'));
    input = join(dir, 'in.mp4');
    execFileSync(ffmpeg, [
      '-v',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      `testsrc2=size=${W}x${H}:rate=${FPS}:duration=4`,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '12',
      '-pix_fmt',
      'yuv420p',
      '-colorspace',
      'bt709',
      '-color_primaries',
      'bt709',
      '-color_trc',
      'bt709',
      input,
    ]);
  });

  afterAll(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('identity grade: the frame comes out as it went in, up to compression', async () => {
    const out = mkdtempSync(join(dir, 'id-'));
    const files = await renderPiece({ ffmpeg, input, job: job(), dir: out, mods });
    expect(files.cube).toBeNull();
    expect(size(files.clip)).toEqual([W, H]);
    // Output frame 25 is input frame 35: the trim is exact, not at a keyframe.
    const d = mad(frame(files.clip, 25), frame(input, 25 + OFFSET_FRAMES));
    expect(d).toBeLessThan(0.02);
    // The wrong frame differs more: testsrc2 moves, so this is what proves the alignment.
    expect(mad(frame(files.clip, 25), frame(input, 25 + OFFSET_FRAMES + 5))).toBeGreaterThan(d);
    expect(size(files.still)).toEqual([W, H]);
    expect(size(files.loop)[0]).toBe(480);
  }, 60_000);

  it('strong grade: the output frame matches the JS LUT applied to the input frame', async () => {
    const out = mkdtempSync(join(dir, 'strong-'));
    const files = await renderPiece({ ffmpeg, input, job: job({ grade: STRONG }), dir: out, mods });
    expect(readFileSync(files.cube, 'utf8')).toContain('LUT_3D_SIZE 33');
    const src = frame(input, 25 + OFFSET_FRAMES);
    const got = frame(files.clip, 25);
    const want = throughLut(src, grade.gradeToLut(grade.clampGrade(STRONG)));
    const graded = mad(got, want);
    const ungraded = mad(got, src);
    expect(graded).toBeLessThan(0.025);
    // The grade really happened, and is many times the residual.
    expect(ungraded).toBeGreaterThan(3 * graded);
  }, 60_000);

  it('crop: the frame is cut to even pixels inside the picture', async () => {
    const out = mkdtempSync(join(dir, 'crop-'));
    const files = await renderPiece({
      ffmpeg,
      input,
      job: job({ crop: { x: 0.1, y: 0.2, w: 0.5, h: 0.55 } }),
      dir: out,
      mods,
    });
    // 320·0.5 = 160; 240·0.55 = 132.
    expect(size(files.clip)).toEqual([160, 132]);
  }, 60_000);

  it('auto pass: computes its values from the clip and grades through them', async () => {
    const out = mkdtempSync(join(dir, 'auto-'));
    const files = await renderPiece({
      ffmpeg,
      input,
      job: job({ auto_enhance: true }),
      dir: out,
      mods,
    });
    expect(files.autoParams).toMatchObject({ v: auto.AUTO_VERSION });
    expect(auto.parseAutoParams(files.autoParams)).toEqual(files.autoParams);
    expect(readFileSync(files.cube, 'utf8')).toContain('LUT_3D_SIZE 33');
    expect(size(files.clip)).toEqual([W, H]);
  }, 60_000);

  it('still: one frame held for three seconds', async () => {
    const out = mkdtempSync(join(dir, 'still-'));
    const files = await renderPiece({
      ffmpeg,
      input,
      job: job({ play_mode: 'still', still_at_s: 1 }),
      dir: out,
      mods,
    });
    expect(files.autoParams).toBeNull();
    expect(size(files.clip)).toEqual([W, H]);
    // Every frame is the chosen one: input frame 25 (1 s at 25 fps) after the pad.
    const first = frame(files.clip, 0);
    expect(mad(frame(files.clip, STILL_CLIP_SECONDS * STILL_CLIP_FPS - 1), first)).toBeLessThan(
      0.01,
    );
    expect(mad(first, frame(input, 25 + OFFSET_FRAMES))).toBeLessThan(0.02);
  }, 60_000);

  it('refuses a grade made by newer math', async () => {
    const out = mkdtempSync(join(dir, 'ver-'));
    await expect(
      renderPiece({ ffmpeg, input, job: job({ grade_version: 99 }), dir: out, mods }),
    ).rejects.toMatchObject({ message: 'grade_version', final: true });
  });
});

describe('render-clips arguments', () => {
  it('trims exactly: -ss before the input, then the length', () => {
    const args = clipArgs({ input: 'in', output: 'out', offset: 0.4, seconds: 12.5, filters: 'f' });
    expect(args.slice(args.indexOf('-ss'), args.indexOf('-ss') + 6)).toEqual([
      '-ss',
      '0.400',
      '-i',
      'in',
      '-t',
      '12.500',
    ]);
    expect(args).toEqual(expect.arrayContaining(['-preset', 'slow', '-crf', '28', '-an']));
  });

  it('chains crop, grade, scale in that order and escapes the cube path', () => {
    expect(clipFilters({ cropFilter: 'crop=1', cubePath: "/t/a'b:c.cube" })).toBe(
      "crop=1,lut3d=file='/t/a'\\''b\\:c.cube':interp=trilinear," +
        "scale=w='min(1080,iw)':h=-2:out_color_matrix=bt709:out_range=tv,format=yuv420p",
    );
    expect(clipFilters({ cropFilter: null, cubePath: null })).not.toContain('lut3d');
  });

  it('adds the auto denoise before the look and the sharpen after the scale', () => {
    const chain = clipFilters({ cropFilter: 'crop=1', cubePath: '/t/a.cube', enhance: true });
    const order = ['crop=1', AUTO_DENOISE, 'lut3d=', 'scale=', AUTO_SHARPEN, 'format=yuv420p'].map(
      (f) => chain.indexOf(f),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(clipFilters({ cropFilter: null, cubePath: null })).not.toContain('hqdn3d');
  });

  it('samples eight small frames of the clip, whole, as raw RGB', () => {
    const args = sampleArgs({ input: 'in', offset: 0.4, seconds: 10, frames: 8, width: 64 });
    expect(args.slice(args.indexOf('-ss'), args.indexOf('-ss') + 6)).toEqual([
      '-ss',
      '0.400',
      '-t',
      '10.000',
      '-i',
      'in',
    ]);
    expect(args).toEqual(
      expect.arrayContaining(['fps=0.800000,scale=64:-2', '-frames:v', '8', 'rgb24', '-']),
    );
    expect(args.join(' ')).not.toContain('crop');
  });

  it('holds a still frame for three seconds through the same filters', () => {
    const args = stillClipArgs({ input: 'in', output: 'out', offset: 0.4, at: 2, filters: 'f' });
    expect(args[args.indexOf('-ss') + 1]).toBe('2.400');
    expect(args[args.indexOf('-vf') + 1]).toBe(
      'f,trim=end_frame=1,loop=loop=89:size=1:start=0,setpts=N/30/TB',
    );
    expect(args).toEqual(expect.arrayContaining(['-frames:v', '90', '-r', '30', '-an']));
  });

  it('takes the chosen still frame, inside the clip, or the 45% default', () => {
    expect(stillAt({ still_at_s: 2 }, 10)).toBe(2);
    expect(stillAt({ still_at_s: '2.5' }, 10)).toBe(2.5);
    expect(stillAt({ still_at_s: null }, 10)).toBe(4.5);
    expect(stillAt({}, 10)).toBe(4.5);
    expect(stillAt({ still_at_s: 12 }, 10)).toBeCloseTo(9.95, 5);
  });

  it('cuts the still at 45% and the loop like the site loops', () => {
    expect(stillArgs({ input: 'c', output: 's', seconds: 10 })).toContain('4.50');
    const loop = loopArgs({ input: 'c', output: 'l', seconds: 10 });
    expect(loop.slice(loop.indexOf('-ss'), loop.indexOf('-ss') + 2)).toEqual(['-ss', '1.0']);
    expect(loop).toEqual(expect.arrayContaining(['-t', '4', 'scale=480:-2', 'veryfast', '30']));
    // Too short to start at 1 s: the loop ends with the clip.
    const short = loopArgs({ input: 'c', output: 'l', seconds: 4.5 });
    expect(short[short.indexOf('-ss') + 1]).toBe('0.5');
  });

  it('uploads English only when the exercise has none', () => {
    expect(uploadPlan('air_squat', false).map((u) => `${u.bucket}/${u.path}`)).toEqual([
      'videos/shared/air_squat.ru.mp4',
      'images/exercises/air_squat.jpg',
      'images/loops/air_squat.mp4',
    ]);
    expect(uploadPlan('air_squat', true).map((u) => u.path)).toContain('shared/air_squat.en.mp4');
    expect(() => uploadPlan('../x', false)).toThrow('bad_exercise_id');
  });

  it('keeps errors short and free of paths', () => {
    expect(shortError(new Error('ffmpeg: /tmp/media-render-x/raw.mov: Invalid data'))).toBe(
      'ffmpeg: …: Invalid data',
    );
    expect(shortError({ code: 'raw_missing', message: 'raw_missing' })).toBe('raw_missing');
    expect(shortError('x'.repeat(500))).toHaveLength(200);
  });
});
