/**
 * Crop frame of a studio clip: a rectangle in the *displayed* picture (after the phone's rotation
 * flag is applied, which is also how a browser shows it and how ffmpeg filters it), normalised to
 * 0…1 so it survives any resolution. Null means the whole frame.
 *
 * Shared by the admin's crop overlay and the render worker, which turns it into an ffmpeg `crop`.
 */

export interface Crop {
  /** Left edge, 0…1 of the width. */
  x: number;
  /** Top edge, 0…1 of the height. */
  y: number;
  /** Width, 0…1. */
  w: number;
  /** Height, 0…1. */
  h: number;
}

/** A crop smaller than this on either side is a mis-tap, not a framing. */
export const MIN_CROP = 0.05;

const clamp01 = (v: number): number => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const finite = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/**
 * A crop from anything (a clip's jsonb, the clipboard). Null when the value is not a crop at all
 * or covers the whole frame; otherwise kept inside the frame and at least {@link MIN_CROP} a side.
 */
export function clampCrop(value: unknown): Crop | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const x0 = finite(v.x);
  const y0 = finite(v.y);
  const w0 = finite(v.w);
  const h0 = finite(v.h);
  if (x0 === null || y0 === null || w0 === null || h0 === null) return null;
  const w = Math.max(MIN_CROP, clamp01(w0));
  const h = Math.max(MIN_CROP, clamp01(h0));
  const x = Math.min(clamp01(x0), 1 - w);
  const y = Math.min(clamp01(y0), 1 - h);
  const crop = { x, y, w, h };
  return isFullFrame(crop) ? null : crop;
}

export function isFullFrame(c: Crop): boolean {
  const e = 1e-6;
  return c.x < e && c.y < e && c.w > 1 - e && c.h > 1 - e;
}

/**
 * The crop as an ffmpeg filter, sized from the input (`iw`/`ih`) so the worker never needs to
 * probe it. Width and height are rounded down to even pixels: H.264 in 4:2:0 needs both.
 */
export function ffmpegCrop(c: Crop): string {
  const n = (v: number): string => v.toFixed(6);
  return (
    `crop=w='trunc(iw*${n(c.w)}/2)*2':h='trunc(ih*${n(c.h)}/2)*2'` +
    `:x='trunc(iw*${n(c.x)})':y='trunc(ih*${n(c.y)})'`
  );
}
