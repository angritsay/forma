/**
 * Sizes for the grade preview: how big the canvas is drawn, and which part of the video frame it
 * samples.
 *
 * The canvas shows either the whole frame (while the crop is being edited, so the frame around
 * the crop is visible) or only the crop (everywhere else, so the picture is what the exercise will
 * get). Both are the same shader with a different `u_crop`; these functions keep the box's aspect
 * equal to what is sampled, so nothing is stretched.
 */
import type { Crop } from '@/lib/media/crop';

export interface Size {
  w: number;
  h: number;
}

/** The `u_crop` uniform: x, y, w, h of the sampled part, 0…1, y down. */
export function cropUniform(crop: Crop | null, apply: boolean): [number, number, number, number] {
  if (!apply || !crop) return [0, 0, 1, 1];
  return [crop.x, crop.y, crop.w, crop.h];
}

/** The pixel size of what is shown: the frame, or the crop of it. */
export function shownPixels(video: Size, crop: Crop | null, apply: boolean): Size {
  const [, , cw, ch] = cropUniform(crop, apply);
  return { w: Math.max(1, video.w * cw), h: Math.max(1, video.h * ch) };
}

/**
 * The largest box of the content's aspect that fits `room` (CSS pixels). A tall phone clip in a
 * short landscape room comes out narrow rather than cut.
 */
export function fitInside(content: Size, room: Size): Size {
  if (!(content.w > 0) || !(content.h > 0) || !(room.w > 0) || !(room.h > 0)) {
    return { w: Math.max(0, room.w), h: Math.max(0, room.h) };
  }
  const scale = Math.min(room.w / content.w, room.h / content.h);
  return { w: Math.floor(content.w * scale), h: Math.floor(content.h * scale) };
}

/**
 * The canvas backing store for a box: device pixels, but never more than the video has (drawing
 * a 720p clip into a 3× phone canvas is work with nothing to show for it) and never more than
 * `maxSide` on a side (a 4K piece on a desktop screen).
 */
export function backingSize(box: Size, dpr: number, source: Size, maxSide = 2048): Size {
  const ratio = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  let w = box.w * ratio;
  let h = box.h * ratio;
  const limit = Math.min(1, source.w > 0 ? source.w / w : 1, source.h > 0 ? source.h / h : 1);
  w *= limit;
  h *= limit;
  const cap = Math.min(1, maxSide / Math.max(w, h, 1));
  return { w: Math.max(1, Math.round(w * cap)), h: Math.max(1, Math.round(h * cap)) };
}
