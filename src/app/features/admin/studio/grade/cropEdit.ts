/**
 * Editing a crop frame by hand: dragging it, pulling a corner, snapping it to an aspect.
 *
 * Everything works in the normalised space of `src/lib/media/crop.ts` (0…1 of the displayed
 * frame), so the overlay needs only its own box size to turn a finger's pixels into a delta, and
 * the result is already what the server stores. An aspect such as 9:16 is a ratio of *pixels*, so
 * the functions that keep one take the video's pixel size to convert it.
 */
import { clampCrop, MIN_CROP, type Crop } from '@/lib/media/crop';

export const FULL_FRAME: Readonly<Crop> = { x: 0, y: 0, w: 1, h: 1 };

export const CROP_ASPECTS = ['free', '9:16', '4:3', '1:1'] as const;
export type CropAspect = (typeof CROP_ASPECTS)[number];

/** Width ÷ height in pixels; null — free. */
export function aspectRatio(aspect: CropAspect): number | null {
  switch (aspect) {
    case '9:16':
      return 9 / 16;
    case '4:3':
      return 4 / 3;
    case '1:1':
      return 1;
    default:
      return null;
  }
}

/** A pixel aspect as a ratio of normalised sides (`w / h` in 0…1 units) for a given video. */
export function normalisedRatio(pixelRatio: number, videoW: number, videoH: number): number {
  if (!(videoW > 0) || !(videoH > 0) || !(pixelRatio > 0)) return 1;
  return (pixelRatio * videoH) / videoW;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The crop as it is drawn: null (whole frame) becomes the full rectangle. */
export function cropOrFull(c: Crop | null | undefined): Crop {
  return c ? { ...c } : { ...FULL_FRAME };
}

/** The crop as it is stored: clamped, and null when it is the whole frame. */
export function normaliseCrop(c: Crop | null | undefined): Crop | null {
  return c ? clampCrop(c) : null;
}

/**
 * The largest frame of a pixel aspect that fits the picture, centred on the current crop's centre
 * (and pushed back inside the picture when that centre is near an edge).
 */
export function fitAspect(
  current: Crop | null,
  pixelRatio: number | null,
  videoW: number,
  videoH: number,
): Crop | null {
  if (pixelRatio === null) return normaliseCrop(current);
  const r = normalisedRatio(pixelRatio, videoW, videoH);
  let w = 1;
  let h = 1 / r;
  if (h > 1) {
    h = 1;
    w = r;
  }
  const c = cropOrFull(current);
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  const x = clamp(cx - w / 2, 0, 1 - w);
  const y = clamp(cy - h / 2, 0, 1 - h);
  return normaliseCrop({ x, y, w, h });
}

/** The crop moved by a normalised delta, kept inside the picture. */
export function moveCrop(c: Crop, dx: number, dy: number): Crop {
  return {
    x: clamp(c.x + dx, 0, 1 - c.w),
    y: clamp(c.y + dy, 0, 1 - c.h),
    w: c.w,
    h: c.h,
  };
}

export type CropHandle = 'nw' | 'ne' | 'sw' | 'se';

/**
 * The crop with one corner pulled by a normalised delta. The opposite corner stays put; the frame
 * never shrinks below {@link MIN_CROP} nor leaves the picture. With `ratio` (normalised `w / h`,
 * see {@link normalisedRatio}) the frame keeps that shape: the larger of the two pulls wins and
 * the other side follows.
 */
export function resizeCrop(
  c: Crop,
  handle: CropHandle,
  dx: number,
  dy: number,
  ratio: number | null = null,
): Crop {
  const west = handle === 'nw' || handle === 'sw';
  const north = handle === 'nw' || handle === 'ne';
  // The fixed corner, and how far the moving one may go in each direction.
  const ax = west ? c.x + c.w : c.x;
  const ay = north ? c.y + c.h : c.y;
  const maxW = west ? ax : 1 - ax;
  const maxH = north ? ay : 1 - ay;
  let w = clamp(c.w + (west ? -dx : dx), MIN_CROP, maxW);
  let h = clamp(c.h + (north ? -dy : dy), MIN_CROP, maxH);
  if (ratio !== null && ratio > 0) {
    // Follow the bigger relative pull, then fit both sides inside the room there is.
    const byW = Math.abs(dx) / Math.max(c.w, 1e-6) >= Math.abs(dy) / Math.max(c.h, 1e-6);
    if (byW) h = w / ratio;
    else w = h * ratio;
    const scale = Math.min(1, maxW / w, maxH / h);
    w *= scale;
    h *= scale;
    const grow = Math.max(1, MIN_CROP / w, MIN_CROP / h);
    if (grow > 1 && w * grow <= maxW + 1e-9 && h * grow <= maxH + 1e-9) {
      w *= grow;
      h *= grow;
    }
  }
  return {
    x: west ? ax - w : ax,
    y: north ? ay - h : ay,
    w,
    h,
  };
}

/** The crop's size in pixels on a given video, even on both sides as the worker renders it. */
export function cropPixels(c: Crop | null, videoW: number, videoH: number): [number, number] {
  const f = cropOrFull(c);
  const even = (v: number): number => Math.max(2, Math.floor(v / 2) * 2);
  return [even(videoW * f.w), even(videoH * f.h)];
}

/** The aspect preset a crop already matches on this video, or `free`. */
export function matchAspect(c: Crop | null, videoW: number, videoH: number): CropAspect {
  if (!c || !(videoW > 0) || !(videoH > 0)) return 'free';
  const px = (c.w * videoW) / (c.h * videoH);
  for (const a of CROP_ASPECTS) {
    const r = aspectRatio(a);
    if (r !== null && Math.abs(px - r) / r < 0.01) return a;
  }
  return 'free';
}
