/**
 * «Копировать настройки» / «Вставить»: one clip's colour and frame, carried to many.
 *
 * The clipboard is the app's own, not the system's: a grade is JSON the person never reads, and
 * the system clipboard in a Telegram WebView asks for a permission on every paste. It lives in a
 * small store (`clipboardStore.ts`) and in `localStorage`, so a copy survives switching clips,
 * reloading the Mini App and coming back the next evening to grade the rest of the shoot.
 *
 * Both halves are always copied, and either may be «nothing»: no grade (the clip as filmed) and
 * the whole frame are settings too, and pasting them is how a batch is put back. Which halves a
 * paste carries is the person's choice in the paste dialog.
 */
import { clampCrop, type Crop } from '@/lib/media/crop';
import { clampGrade, isIdentityGrade, type GradeParams } from '@/lib/media/grade';
import type { MediaPaste } from '@/lib/api/mediaStudio';

export const CLIPBOARD_KEY = 'forma.studioClipboard';
const FORMAT = 1;

export interface StudioClipboard {
  /** Null — no grade. Always clamped. */
  grade: GradeParams | null;
  /** Null — the whole frame. */
  crop: Crop | null;
  /** The clip it was copied from, to mark it in the grid. */
  fromClipId: string | null;
  /** The exercise name of that clip, for «Скопировано из …». */
  fromLabel: string | null;
  copiedAt: string;
}

export interface PasteChoice {
  colour: boolean;
  crop: boolean;
}

const normGrade = (g: unknown): GradeParams | null => {
  if (g === null || g === undefined) return null;
  const c = clampGrade(g);
  return isIdentityGrade(c) ? null : c;
};

export function makeClipboard(
  grade: GradeParams | null,
  crop: Crop | null,
  from: { id?: string | null; label?: string | null } = {},
  now: Date = new Date(),
): StudioClipboard {
  return {
    grade: normGrade(grade),
    crop: crop ? clampCrop(crop) : null,
    fromClipId: from.id ?? null,
    fromLabel: from.label ?? null,
    copiedAt: now.toISOString(),
  };
}

export function serializeClipboard(cb: StudioClipboard): string {
  return JSON.stringify({ v: FORMAT, ...cb });
}

/**
 * The clipboard back from storage. Anything that is not one (another format, hand-edited, cut
 * short) reads as empty rather than as a broken grade: the values go through the same clamps the
 * server applies.
 */
export function parseClipboard(raw: string | null | undefined): StudioClipboard | null {
  if (!raw) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  if (o.v !== FORMAT) return null;
  const text = (x: unknown): string | null => (typeof x === 'string' && x !== '' ? x : null);
  return {
    grade: normGrade(o.grade),
    crop: clampCrop(o.crop),
    fromClipId: text(o.fromClipId),
    fromLabel: text(o.fromLabel),
    copiedAt: text(o.copiedAt) ?? new Date(0).toISOString(),
  };
}

/** What `pasteMediaSettings` takes for this choice, or null when nothing is chosen. */
export function pastePayload(cb: StudioClipboard, choice: PasteChoice): MediaPaste | null {
  if (!choice.colour && !choice.crop) return null;
  const out: MediaPaste = {};
  if (choice.colour) out.grade = cb.grade;
  if (choice.crop) out.crop = cb.crop;
  return out;
}

export interface ClipSettings {
  grade: GradeParams | null;
  crop: Crop | null;
}

/**
 * The clipboard pasted onto one clip's settings in the editor (before saving): the chosen halves
 * replace, the others stay.
 */
export function mergePaste(
  current: ClipSettings,
  cb: StudioClipboard,
  choice: PasteChoice,
): ClipSettings {
  return {
    grade: choice.colour ? cb.grade : current.grade,
    crop: choice.crop ? cb.crop : current.crop,
  };
}

/** Whether a paste would change this clip at all (to say «уже такие» instead of saving nothing). */
export function pasteChanges(
  current: ClipSettings,
  cb: StudioClipboard,
  choice: PasteChoice,
): boolean {
  const next = mergePaste(current, cb, choice);
  return (
    JSON.stringify(normGrade(next.grade)) !== JSON.stringify(normGrade(current.grade)) ||
    JSON.stringify(next.crop ? clampCrop(next.crop) : null) !==
      JSON.stringify(current.crop ? clampCrop(current.crop) : null)
  );
}
