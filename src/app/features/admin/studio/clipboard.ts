/**
 * «Скопировать настройки» / «Вставить в выбранные»: one clip's colour, carried to many.
 *
 * The studio had two clipboards — the cutter's crop clipboard (`forma.studio.clipboard`, halves
 * merged copy by copy) and the grader's (`forma.studioClipboard`, both halves at once) — that
 * neither saw the other: a copy in one was never there to paste in the other. There is one now,
 * and it carries colour only: the grade and the auto-enhance switch. Framing is per clip, set on
 * the «Превью» step against the card and the player, and is never pasted.
 *
 * The clipboard is the app's own, not the system's: a grade is JSON the person never reads, and
 * the system clipboard in a Telegram WebView asks for a permission on every paste. It lives in a
 * small store (`clipboardStore.ts`) and in `localStorage`, so a copy survives switching clips,
 * reloading the Mini App and coming back the next evening to grade the rest of the shoot. A copy
 * left under the old key or in an old shape is read once and moved here.
 *
 * «No grade» is a setting too (the clip as filmed): pasting it is how a batch is put back.
 */
import type { MediaPaste } from '@/lib/api/mediaStudio';
import { clampGrade, isIdentityGrade, type GradeParams } from '@/lib/media/grade';

export const CLIPBOARD_KEY = 'forma.studio.clipboard';
/** The grader's old key; the old cutter's was {@link CLIPBOARD_KEY} itself, in another shape. */
export const LEGACY_CLIPBOARD_KEY = 'forma.studioClipboard';
const FORMAT = 2;

export interface StudioClipboard {
  /** Null — no grade. Always clamped. */
  grade: GradeParams | null;
  /** The auto-enhance switch of the clip it was copied from. */
  autoEnhance: boolean;
  /** The clip it was copied from, to mark it in the list. */
  fromClipId: string | null;
  /** The exercise name of that clip, for «Скопировано из …». */
  fromLabel: string | null;
  copiedAt: string;
}

/** A clip's colour: the part of it the clipboard carries. */
export interface ClipColour {
  grade: GradeParams | null;
  autoEnhance: boolean;
}

const normGrade = (g: unknown): GradeParams | null => {
  if (g === null || g === undefined) return null;
  const c = clampGrade(g);
  return isIdentityGrade(c) ? null : c;
};

const text = (x: unknown): string | null => (typeof x === 'string' && x !== '' ? x : null);

export function makeClipboard(
  colour: ClipColour,
  from: { id?: string | null; label?: string | null } = {},
  now: Date = new Date(),
): StudioClipboard {
  return {
    grade: normGrade(colour.grade),
    autoEnhance: colour.autoEnhance,
    fromClipId: from.id ?? null,
    fromLabel: from.label ?? null,
    copiedAt: now.toISOString(),
  };
}

export function serializeClipboard(cb: StudioClipboard): string {
  return JSON.stringify({ v: FORMAT, ...cb });
}

/**
 * The clipboard back from storage, in this format or either old one:
 *
 *  - v2 (this): the grade, the auto switch, where it came from;
 *  - v1 (the old grader's, `{ v: 1, grade, crop, … }`): the grade, with the auto pass on (it did
 *    not exist yet); the crop is dropped;
 *  - unversioned (the old cutter's, `{ grade?, crop? }`): only a copied grade counts — a crop
 *    alone is no colour, and reads as empty.
 *
 * Anything else (hand-edited, cut short, a newer format) reads as empty rather than as a broken
 * grade: the values go through the same clamps the server applies.
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
  const from = {
    fromClipId: text(o.fromClipId),
    fromLabel: text(o.fromLabel),
    copiedAt: text(o.copiedAt) ?? new Date(0).toISOString(),
  };
  if (o.v === FORMAT) {
    return { grade: normGrade(o.grade), autoEnhance: o.autoEnhance !== false, ...from };
  }
  if (o.v === 1 || (o.v === undefined && 'grade' in o)) {
    return { grade: normGrade(o.grade), autoEnhance: true, ...from };
  }
  return null;
}

/** What `pasteMediaSettings` takes: the grade and the switch, never a crop. */
export function pastePayload(cb: StudioClipboard): MediaPaste {
  return { grade: cb.grade, autoEnhance: cb.autoEnhance };
}

/** Whether a paste would change this clip's colour (to say «уже такие» instead of nothing). */
export function pasteChanges(current: ClipColour, cb: StudioClipboard): boolean {
  return (
    JSON.stringify(normGrade(current.grade)) !== JSON.stringify(cb.grade) ||
    current.autoEnhance !== cb.autoEnhance
  );
}

/** The stored clipboard: under the one key first, then under the old grader's. */
export function readStoredClipboard(storage: {
  getItem: (key: string) => string | null;
}): StudioClipboard | null {
  return (
    parseClipboard(storage.getItem(CLIPBOARD_KEY)) ??
    parseClipboard(storage.getItem(LEGACY_CLIPBOARD_KEY))
  );
}
