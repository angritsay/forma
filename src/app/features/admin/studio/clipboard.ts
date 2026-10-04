/**
 * The studio's clipboard: a copied grade and/or crop, waiting to be pasted onto other clips.
 *
 * It is plain JSON in localStorage, so a frame copied in the cutter is still there in the grader
 * (and after a reload). The two halves are independent: copying a crop keeps a grade copied
 * earlier, so «grade from this clip, frame from that one» is two copies and one paste.
 *
 * `toPaste` builds the `MediaPaste` the API takes from the halves that are both on the clipboard
 * and ticked — a half left out of the object is not touched on the server, a half set to null
 * clears it there.
 */
import type { MediaPaste } from '@/lib/api/mediaStudio';
import { clampCrop, type Crop } from '@/lib/media/crop';
import { clampGrade, type GradeParams } from '@/lib/media/grade';

export const CLIPBOARD_KEY = 'forma.studio.clipboard';

export interface StudioClipboard {
  /** Absent — nothing copied; null — «no grade» was copied (pasting it clears the grade). */
  grade?: GradeParams | null;
  /** Absent — nothing copied; null — the whole frame was copied. */
  crop?: Crop | null;
}

/** Lay a new copy over what is already on the clipboard, half by half. */
export function mergeClipboard(prev: StudioClipboard, next: StudioClipboard): StudioClipboard {
  const out: StudioClipboard = {};
  if ('grade' in next) out.grade = next.grade ?? null;
  else if ('grade' in prev) out.grade = prev.grade ?? null;
  if ('crop' in next) out.crop = next.crop ?? null;
  else if ('crop' in prev) out.crop = prev.crop ?? null;
  return out;
}

export function hasGrade(c: StudioClipboard): boolean {
  return 'grade' in c;
}

export function hasCrop(c: StudioClipboard): boolean {
  return 'crop' in c;
}

/** The paste for the ticked halves; null when nothing ticked is on the clipboard. */
export function toPaste(
  c: StudioClipboard,
  ticked: { grade: boolean; crop: boolean },
): MediaPaste | null {
  const out: MediaPaste = {};
  if (ticked.grade && hasGrade(c)) out.grade = c.grade ?? null;
  if (ticked.crop && hasCrop(c)) out.crop = c.crop ?? null;
  return Object.keys(out).length > 0 ? out : null;
}

/** The clipboard from its stored text; anything unreadable is an empty clipboard. */
export function parseClipboard(text: string | null): StudioClipboard {
  if (!text) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {};
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const v = raw as Record<string, unknown>;
  const out: StudioClipboard = {};
  if ('grade' in v) out.grade = v.grade === null ? null : clampGrade(v.grade);
  if ('crop' in v) out.crop = clampCrop(v.crop);
  return out;
}

export function readClipboard(): StudioClipboard {
  try {
    return parseClipboard(localStorage.getItem(CLIPBOARD_KEY));
  } catch {
    return {};
  }
}

/** Copy onto the clipboard (merged with what is there) and answer the result. */
export function writeClipboard(next: StudioClipboard): StudioClipboard {
  const merged = mergeClipboard(readClipboard(), next);
  try {
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(merged));
  } catch {
    // Storage full or blocked: the copy still holds for this screen.
  }
  return merged;
}
