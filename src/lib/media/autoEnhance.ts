/**
 * «Авто-улучшение» for the admin «Студия»: a clip's colour corrected from its own frames — levels,
 * white balance, exposure, a mild S-curve and vibrance — by plain frame statistics, no model.
 *
 * Like `grade.ts`, one module serves both ends, so the preview and the render agree:
 *
 *  - the admin's preview reads about eight frames of the clip from its `<video>` into a 64-pixel
 *    canvas (`features/admin/studio/grade/autoSample.ts`), calls {@link computeAutoParams}, and
 *    draws through {@link studioLut};
 *  - the render worker (`scripts/media/render-clips.mjs`) gets the same frames from ffmpeg
 *    (`fps=8/len,scale=64:-2 -f rawvideo -pix_fmt rgb24`), calls the same function, and writes the
 *    same {@link studioLut} to the `.cube` it hands to `lut3d`. It also stores the result on the
 *    clip (`media_clips.auto_params`), so a render can be reproduced.
 *
 * The statistics are taken on the whole frame, before any crop: the framing is chosen later (the
 * «Превью» step) and must not change the colour.
 *
 * ## The pass, per pixel (values 0…1, gamma-encoded, as `grade.ts`)
 *
 *  1. **levels** — the luma's 0.5th and 99.5th percentiles become black and white, clamped so a
 *     dark or a bright scene is not stretched into a different one (black ≤ 0.1, white ≥ 0.8);
 *  2. **white balance** — grey world: each channel's mean (of the pixels that are neither clipped
 *     nor black) is pulled to the mean of the three, by at most ±8% a channel;
 *  3. **exposure** — a midtone gamma that brings the median luma into 0.40…0.52; a median already
 *     there is left alone, and the gamma stays within 0.7…1.4;
 *  4. **contrast** — a blend toward smoothstep (an S-curve through mid grey that keeps black and
 *     white), stronger the flatter the picture is (luma spread under 0.2), at most 0.3;
 *  5. **vibrance** — saturation +15%, less for colours already saturated, and much less for skin
 *     tones (red over green over blue in the warm hues), so faces do not turn orange.
 *
 * Steps 1–4 are per channel; step 5 mixes channels, so the composed LUT is a true 3D table. Both
 * ends sample it trilinearly (the GPU, and `lut3d=…:interp=trilinear`), so they still agree.
 *
 * The manual grade (`GradeParams`) is applied on top: what the admin sets by hand corrects the
 * automatic result, not the other way round.
 *
 * Bump {@link AUTO_VERSION} when this math changes; stored parameters say which version made them.
 */
import {
  channelFunctions,
  DEFAULT_LUT_SIZE,
  defaultGrade,
  gradeToLut,
  isIdentityGrade,
  type GradeParams,
} from './grade';

export const AUTO_VERSION = 1;

/** How many frames each end samples, and how wide each sample is. */
export const AUTO_SAMPLE_FRAMES = 8;
export const AUTO_SAMPLE_WIDTH = 64;

/** The limits the pass keeps to (and {@link parseAutoParams} clamps to). */
export const AUTO_LIMITS = {
  /** Highest black point and lowest white point of the levels. */
  maxBlack: 0.1,
  minWhite: 0.8,
  /** White balance gain per channel: 1 ± this. */
  wb: 0.08,
  gamma: { min: 0.7, max: 1.4 },
  /** The median luma left alone. */
  midBand: { min: 0.4, max: 0.52 },
  /** S-curve blend. */
  maxContrast: 0.3,
  /** Below this luma spread the picture counts as flat. */
  flatSpread: 0.2,
  vibrance: 0.15,
} as const;

export interface AutoParams {
  v: typeof AUTO_VERSION;
  /** Levels: input black and white, 0…1. */
  lo: number;
  hi: number;
  /** White balance gains, R, G, B. */
  gain: [number, number, number];
  /** Midtone gamma: `v ↦ v^gamma`. */
  gamma: number;
  /** S-curve blend, 0…{@link AUTO_LIMITS.maxContrast}. */
  contrast: number;
  /** Vibrance amount, 0…{@link AUTO_LIMITS.vibrance}. */
  vibrance: number;
}

/** A batch of pixels: packed RGB (3) or RGBA (4) bytes, as ffmpeg's rgb24 or a canvas gives. */
export interface PixelSample {
  data: ArrayLike<number>;
  channels: 3 | 4;
}

type RGB = [number, number, number];

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const clamp01 = (v: number): number => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const luma = (r: number, g: number, b: number): number => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** The pass that changes nothing. */
export function identityAuto(): AutoParams {
  return { v: AUTO_VERSION, lo: 0, hi: 1, gain: [1, 1, 1], gamma: 1, contrast: 0, vibrance: 0 };
}

export function isIdentityAuto(p: AutoParams): boolean {
  return (
    p.lo === 0 &&
    p.hi === 1 &&
    p.gain.every((g) => g === 1) &&
    p.gamma === 1 &&
    p.contrast === 0 &&
    p.vibrance === 0
  );
}

/**
 * Stored parameters back from anything (a clip's jsonb). Not an object, or another version: null.
 * Every number is clamped to {@link AUTO_LIMITS}, so a hand-edited row cannot push the render
 * further than the pass itself would.
 */
export function parseAutoParams(value: unknown): AutoParams | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  if (o.v !== AUTO_VERSION) return null;
  const n = (x: unknown, fallback: number): number =>
    typeof x === 'number' && Number.isFinite(x) ? x : fallback;
  const gain = Array.isArray(o.gain) ? o.gain : [];
  const L = AUTO_LIMITS;
  return {
    v: AUTO_VERSION,
    lo: clamp(n(o.lo, 0), 0, L.maxBlack),
    hi: clamp(n(o.hi, 1), L.minWhite, 1),
    gain: [0, 1, 2].map((i) => clamp(n(gain[i], 1), 1 - L.wb, 1 + L.wb)) as RGB,
    gamma: clamp(n(o.gamma, 1), L.gamma.min, L.gamma.max),
    contrast: clamp(n(o.contrast, 0), 0, L.maxContrast),
    vibrance: clamp(n(o.vibrance, 0), 0, L.vibrance),
  };
}

// --- the per-pixel steps -----------------------------------------------------------------------

const levels = (p: AutoParams, v: number): number => clamp01((v - p.lo) / (p.hi - p.lo));
const sCurve = (k: number, v: number): number => v + k * (v * v * (3 - 2 * v) - v);

/** Skin: warm (red over green over blue) and not far from orange in hue. */
function skinWeight(r: number, g: number, b: number): number {
  if (!(r > g && g > b)) return 0;
  // Hue in degrees for r ≥ g ≥ b: 60 · (g − b) / (r − b). Skin sits around 10–40°.
  const hue = (60 * (g - b)) / (r - b);
  return hue <= 50 ? 1 : 0;
}

function vibrance(amount: number, [r, g, b]: RGB): RGB {
  if (amount === 0) return [r, g, b];
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (sat === 0) return [r, g, b];
  const k = amount * (1 - sat) * (1 - 0.6 * skinWeight(r, g, b));
  const y = luma(r, g, b);
  return [
    clamp01(y + (r - y) * (1 + k)),
    clamp01(y + (g - y) * (1 + k)),
    clamp01(y + (b - y) * (1 + k)),
  ];
}

/** One pixel through the automatic pass. */
export function applyAuto(p: AutoParams, rgb: readonly [number, number, number]): RGB {
  const out: RGB = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let v = levels(p, rgb[c]!);
    v = clamp01(v * p.gain[c]!);
    if (p.gamma !== 1) v = Math.pow(v, p.gamma);
    if (p.contrast !== 0) v = clamp01(sCurve(p.contrast, v));
    out[c] = v;
  }
  return vibrance(p.vibrance, out);
}

// --- the statistics ----------------------------------------------------------------------------

const BINS = 1024;

/** The value below which `q` (0…1) of a histogram's weight lies. */
function percentile(hist: Uint32Array, total: number, q: number): number {
  const target = q * total;
  let seen = 0;
  for (let i = 0; i < hist.length; i++) {
    seen += hist[i]!;
    if (seen >= target) return (i + 0.5) / hist.length;
  }
  return 1;
}

function lumaHistogram(px: Float32Array): Uint32Array {
  const hist = new Uint32Array(BINS);
  for (let i = 0; i < px.length; i += 3) {
    const y = luma(px[i]!, px[i + 1]!, px[i + 2]!);
    hist[Math.min(BINS - 1, Math.floor(y * BINS))]!++;
  }
  return hist;
}

/** Every sample's pixels as one RGB float buffer, 0…1. */
function pixels(samples: readonly PixelSample[]): Float32Array {
  let count = 0;
  for (const s of samples) count += Math.floor(s.data.length / s.channels);
  const out = new Float32Array(count * 3);
  let o = 0;
  for (const s of samples) {
    const n = Math.floor(s.data.length / s.channels) * s.channels;
    for (let i = 0; i < n; i += s.channels) {
      out[o++] = s.data[i]! / 255;
      out[o++] = s.data[i + 1]! / 255;
      out[o++] = s.data[i + 2]! / 255;
    }
  }
  return out;
}

const round4 = (v: number): number => Math.round(v * 10000) / 10000;

/**
 * The pass for a clip, from its sampled frames. Each step's statistics are taken after the steps
 * before it, the way the pixels will go through them. No pixels at all: the identity.
 *
 * Rounded to four decimals, so the same frames give the same stored values on any machine.
 */
export function computeAutoParams(samples: readonly PixelSample[]): AutoParams {
  const px = pixels(samples);
  const total = px.length / 3;
  const p = identityAuto();
  if (total === 0) return p;
  const L = AUTO_LIMITS;

  // 1. Levels.
  const hist0 = lumaHistogram(px);
  const lo = clamp(percentile(hist0, total, 0.005), 0, L.maxBlack);
  const hi = clamp(percentile(hist0, total, 0.995), L.minWhite, 1);
  // A picture that already spans the range keeps it exactly (no 1% stretch of nothing).
  p.lo = lo <= 1 / BINS ? 0 : round4(lo);
  p.hi = hi >= 1 - 1 / BINS ? 1 : round4(hi);

  // 2. Grey world, over the pixels that are neither black nor clipped once levelled.
  const sum: RGB = [0, 0, 0];
  let used = 0;
  for (let i = 0; i < px.length; i += 3) {
    const r = levels(p, px[i]!);
    const g = levels(p, px[i + 1]!);
    const b = levels(p, px[i + 2]!);
    const y = luma(r, g, b);
    if (y < 0.05 || y > 0.95) continue;
    sum[0] += r;
    sum[1] += g;
    sum[2] += b;
    used++;
  }
  if (used > 0) {
    const grey = (sum[0] + sum[1] + sum[2]) / 3;
    p.gain = sum.map((s) => {
      if (!(s > 0)) return 1;
      const k = round4(clamp(grey / s, 1 - L.wb, 1 + L.wb));
      return Math.abs(k - 1) < 1e-3 ? 1 : k;
    }) as RGB;
  }

  // 3. Exposure, then 4. contrast, from the picture as the earlier steps leave it.
  const after = new Float32Array(px.length);
  for (let i = 0; i < px.length; i += 3) {
    for (let c = 0; c < 3; c++) after[i + c] = clamp01(levels(p, px[i + c]!) * p.gain[c]!);
  }
  const median = percentile(lumaHistogram(after), total, 0.5);
  if (median < L.midBand.min || median > L.midBand.max) {
    const target = clamp(median, L.midBand.min, L.midBand.max);
    const m = clamp(median, 1e-3, 1 - 1e-3);
    p.gamma = round4(clamp(Math.log(target) / Math.log(m), L.gamma.min, L.gamma.max));
  }
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < after.length; i += 3) {
    let y = luma(after[i]!, after[i + 1]!, after[i + 2]!);
    if (p.gamma !== 1) y = Math.pow(y, p.gamma);
    s1 += y;
    s2 += y * y;
  }
  const mean = s1 / total;
  const spread = Math.sqrt(Math.max(0, s2 / total - mean * mean));
  if (spread < L.flatSpread) {
    p.contrast = round4(clamp(((L.flatSpread - spread) / L.flatSpread) * 0.5, 0, L.maxContrast));
  }

  // 5. Vibrance: a fixed, gentle amount; the per-pixel weights do the protecting.
  p.vibrance = L.vibrance;
  return p;
}

// --- the LUT -----------------------------------------------------------------------------------

/** True when neither the pass nor the grade changes anything: the worker skips `lut3d`. */
export function isIdentityLook(grade: GradeParams | null, auto: AutoParams | null): boolean {
  return (!grade || isIdentityGrade(grade)) && (!auto || isIdentityAuto(auto));
}

/**
 * The automatic pass, then the manual grade, as one LUT in `gradeToLut`'s layout (red fastest).
 * Without a pass it is `gradeToLut(grade)` exactly.
 */
export function studioLut(
  grade: GradeParams | null,
  auto: AutoParams | null,
  size = DEFAULT_LUT_SIZE,
): Float32Array {
  const g = grade ?? defaultGrade();
  if (!auto || isIdentityAuto(auto)) return gradeToLut(g, size);
  const n = Math.round(clamp(size, 2, 65));
  const [fr, fg, fb] = channelFunctions(g);
  const lut = new Float32Array(n * n * n * 3);
  let o = 0;
  for (let b = 0; b < n; b++) {
    for (let gi = 0; gi < n; gi++) {
      for (let r = 0; r < n; r++) {
        const [ar, ag, ab] = applyAuto(auto, [r / (n - 1), gi / (n - 1), b / (n - 1)]);
        lut[o++] = fr(ar);
        lut[o++] = fg(ag);
        lut[o++] = fb(ab);
      }
    }
  }
  return lut;
}
