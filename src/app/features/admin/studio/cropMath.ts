/**
 * The crop overlay's geometry: aspect presets, dragging the frame, dragging a corner and pinching.
 *
 * Everything is in the normalised units of `Crop` (0…1 of the displayed picture's width and
 * height), so a ratio such as 9:16 depends on the picture's own shape: on a 16:9 picture a 9:16
 * frame is `w / h = (9/16) / (16/9)` in normalised units. `frameAspect` is the picture's width
 * over its height after rotation, as the `<video>` shows it.
 */
import { clampCrop, MIN_CROP, type Crop } from '@/lib/media/crop';

export type AspectPreset = 'free' | '4:3' | '9:16';

export const ASPECT_PRESETS: readonly AspectPreset[] = ['free', '4:3', '9:16'];

/** Width over height of a preset, or null for a free frame. */
export function presetRatio(p: AspectPreset): number | null {
  if (p === '4:3') return 4 / 3;
  if (p === '9:16') return 9 / 16;
  return null;
}

const FULL: Crop = { x: 0, y: 0, w: 1, h: 1 };
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The crop as an editable box: null (the whole frame) becomes the full rectangle. */
export function boxOf(crop: Crop | null): Crop {
  return crop ? { ...crop } : { ...FULL };
}

/**
 * The normalised `w / h` a picture ratio needs on a picture of `frameAspect`. A ratio of the
 * picture's own shape is 1: a square box in normalised units.
 */
export function normalisedRatio(ratio: number, frameAspect: number): number {
  return ratio / frameAspect;
}

/**
 * The largest box of `ratio` that fits the picture, centred on `around` (the current box's centre
 * by default, so switching presets does not jump the framing across the picture).
 */
export function fitAspect(
  ratio: number,
  frameAspect: number,
  around: { cx: number; cy: number } = { cx: 0.5, cy: 0.5 },
): Crop {
  const r = normalisedRatio(ratio, frameAspect);
  let w = 1;
  let h = 1 / r;
  if (h > 1) {
    h = 1;
    w = r;
  }
  const x = clamp(around.cx - w / 2, 0, 1 - w);
  const y = clamp(around.cy - h / 2, 0, 1 - h);
  return { x, y, w, h };
}

/** Move the box by a delta, kept inside the picture. */
export function moveBox(box: Crop, dx: number, dy: number): Crop {
  return {
    ...box,
    x: clamp(box.x + dx, 0, 1 - box.w),
    y: clamp(box.y + dy, 0, 1 - box.h),
  };
}

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

/**
 * Drag one corner by a delta while the opposite corner stays put. With a ratio the height follows
 * the width; the box never leaves the picture and never gets smaller than {@link MIN_CROP}.
 */
export function dragCorner(
  box: Crop,
  corner: Corner,
  dx: number,
  dy: number,
  ratio: number | null,
  frameAspect: number,
): Crop {
  const west = corner === 'nw' || corner === 'sw';
  const north = corner === 'nw' || corner === 'ne';
  // The fixed corner.
  const fx = west ? box.x + box.w : box.x;
  const fy = north ? box.y + box.h : box.y;
  // Room from the fixed corner to the picture's edge on the dragged side.
  const roomW = west ? fx : 1 - fx;
  const roomH = north ? fy : 1 - fy;
  let w = clamp(box.w + (west ? -dx : dx), MIN_CROP, roomW);
  let h = clamp(box.h + (north ? -dy : dy), MIN_CROP, roomH);
  if (ratio !== null) {
    const r = normalisedRatio(ratio, frameAspect);
    // Follow whichever side moved more; then shrink both until it fits.
    if (Math.abs(dx) >= Math.abs(dy)) h = w / r;
    else w = h * r;
    if (h > roomH) {
      h = roomH;
      w = h * r;
    }
    if (w > roomW) {
      w = roomW;
      h = w / r;
    }
    if (w < MIN_CROP) {
      w = MIN_CROP;
      h = w / r;
    }
    if (h < MIN_CROP) {
      h = MIN_CROP;
      w = h * r;
    }
  }
  return { x: west ? fx - w : fx, y: north ? fy - h : fy, w, h };
}

/**
 * Pinch: scale the box about its centre by `factor`, keeping its shape, then keep it inside the
 * picture. A box that would outgrow the picture stops at the largest size that fits.
 */
export function scaleBox(box: Crop, factor: number): Crop {
  if (!Number.isFinite(factor) || factor <= 0) return box;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const maxF = Math.min(1 / box.w, 1 / box.h);
  const minF = Math.max(MIN_CROP / box.w, MIN_CROP / box.h);
  const f = clamp(factor, minF, maxF);
  const w = box.w * f;
  const h = box.h * f;
  return {
    w,
    h,
    x: clamp(cx - w / 2, 0, 1 - w),
    y: clamp(cy - h / 2, 0, 1 - h),
  };
}

/** The box as a crop to save: clamped, and null when it is the whole picture. */
export function cropOfBox(box: Crop): Crop | null {
  return clampCrop(box);
}

/** A crop's ratio in picture pixels (`w / h` of what the viewer sees), for a readout. */
export function pictureRatio(crop: Crop | null, frameAspect: number): number {
  const b = boxOf(crop);
  return (b.w / b.h) * frameAspect;
}
