/**
 * Framing a clip for the player, on the «Превью» step: drag to move the picture, pinch or slide to
 * zoom — and whatever she does, the frame stays the player's portrait 9:16.
 *
 * The result is the clip's ordinary crop (`src/lib/media/crop.ts`, 0…1 of the displayed frame),
 * the rectangle the worker cuts with ffmpeg, so what she frames is exactly what is rendered. It is
 * held here as a zoom and a centre:
 *
 *  - zoom 1 is the largest 9:16 rectangle the picture has (a portrait phone clip: the whole frame,
 *    stored as null; a landscape one: a full-height strip), zoom 4 a quarter of it;
 *  - the centre is where that rectangle sits, kept so it never leaves the picture.
 *
 * Default: zoom 1, centred.
 */
import { MIN_CROP, type Crop } from '@/lib/media/crop';
import { normaliseCrop, normalisedRatio } from '../grade/cropEdit';

/** The player's frame, width ÷ height in pixels. */
export const PORTRAIT_RATIO = 9 / 16;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export interface Framing {
  zoom: number;
  /** Centre of the frame, 0…1 of the picture. */
  cx: number;
  cy: number;
}

export const DEFAULT_FRAMING: Readonly<Framing> = { zoom: 1, cx: 0.5, cy: 0.5 };

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The largest 9:16 rectangle of a picture, in normalised sides. */
export function portraitBase(videoW: number, videoH: number): { w: number; h: number } {
  const r = normalisedRatio(PORTRAIT_RATIO, videoW, videoH);
  return r <= 1 ? { w: r, h: 1 } : { w: 1, h: 1 / r };
}

/** The zoom kept within its range and within what {@link MIN_CROP} allows on this picture. */
function clampZoom(zoom: number, videoW: number, videoH: number): number {
  const base = portraitBase(videoW, videoH);
  const most = Math.min(MAX_ZOOM, base.w / MIN_CROP, base.h / MIN_CROP);
  return clamp(Number.isFinite(zoom) ? zoom : 1, MIN_ZOOM, Math.max(MIN_ZOOM, most));
}

/** The framing with its zoom in range and its centre where the whole frame stays in the picture. */
export function clampFraming(f: Framing, videoW: number, videoH: number): Framing {
  const zoom = clampZoom(f.zoom, videoW, videoH);
  const base = portraitBase(videoW, videoH);
  const w = base.w / zoom;
  const h = base.h / zoom;
  return {
    zoom,
    cx: clamp(Number.isFinite(f.cx) ? f.cx : 0.5, w / 2, 1 - w / 2),
    cy: clamp(Number.isFinite(f.cy) ? f.cy : 0.5, h / 2, 1 - h / 2),
  };
}

/** The crop a framing renders: 9:16 in pixels, inside the picture; null for the whole frame. */
export function cropFromFraming(f: Framing, videoW: number, videoH: number): Crop | null {
  if (!(videoW > 0) || !(videoH > 0)) return null;
  const c = clampFraming(f, videoW, videoH);
  const base = portraitBase(videoW, videoH);
  const w = base.w / c.zoom;
  const h = base.h / c.zoom;
  return normaliseCrop({ x: c.cx - w / 2, y: c.cy - h / 2, w, h });
}

/**
 * The framing of a stored crop: its centre, and the zoom whose 9:16 frame fits inside it — so a
 * crop of another shape (made before framing was locked) is narrowed to portrait, never widened.
 */
export function framingFromCrop(crop: Crop | null, videoW: number, videoH: number): Framing {
  if (!crop || !(videoW > 0) || !(videoH > 0)) return clampFraming(DEFAULT_FRAMING, videoW, videoH);
  const base = portraitBase(videoW, videoH);
  return clampFraming(
    {
      zoom: Math.max(base.w / crop.w, base.h / crop.h),
      cx: crop.x + crop.w / 2,
      cy: crop.y + crop.h / 2,
    },
    videoW,
    videoH,
  );
}

/**
 * The framing after a drag of `dx`, `dy` CSS pixels over a frame drawn `boxW` × `boxH`: the
 * picture follows the finger, so the frame moves the other way, by as much of itself as the drag
 * is of the box.
 */
export function panFraming(
  f: Framing,
  dx: number,
  dy: number,
  boxW: number,
  boxH: number,
  videoW: number,
  videoH: number,
): Framing {
  if (!(boxW > 0) || !(boxH > 0)) return f;
  const base = portraitBase(videoW, videoH);
  const w = base.w / f.zoom;
  const h = base.h / f.zoom;
  return clampFraming(
    { zoom: f.zoom, cx: f.cx - (dx / boxW) * w, cy: f.cy - (dy / boxH) * h },
    videoW,
    videoH,
  );
}

/** The framing at another zoom, about the same centre (moved back inside if need be). */
export function zoomFraming(f: Framing, zoom: number, videoW: number, videoH: number): Framing {
  return clampFraming({ ...f, zoom }, videoW, videoH);
}

/** Whether a crop is already the player's shape on this picture (within 1%). */
export function isPortraitCrop(crop: Crop | null, videoW: number, videoH: number): boolean {
  if (!(videoW > 0) || !(videoH > 0)) return false;
  const w = (crop?.w ?? 1) * videoW;
  const h = (crop?.h ?? 1) * videoH;
  return Math.abs(w / h - PORTRAIT_RATIO) / PORTRAIT_RATIO < 0.01;
}
