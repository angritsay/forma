/**
 * The cutter's work on one long video, kept in localStorage so a reload — the Mini App closed by a
 * swipe, the phone that ran out of memory mid-upload — does not lose the marks.
 *
 * The browser cannot reopen a picked file by itself, so the draft is keyed by what identifies the
 * file when she picks it again: its name, size and modification time. Picking the same video
 * brings back the same source id, the same segments and the same clip ids, so the uploads resume
 * on the same objects and register the same clips.
 *
 * Pure parsing and keying; the screen does the reading and writing.
 */
import { clampCrop } from '@/lib/media/crop';
import { newSegment, sortSegments, type Segment } from './timeline';

export const DRAFT_PREFIX = 'forma.studio.cut.';

/** Drafts older than this are dropped when read: the TUS uploads behind them have expired. */
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface CutDraft {
  sourceId: string;
  title: string;
  segments: Segment[];
  savedAt: number;
}

export interface FileIdentity {
  name: string;
  size: number;
  lastModified: number;
}

/** The storage key of a file's draft. */
export function draftKey(f: FileIdentity): string {
  return `${DRAFT_PREFIX}${f.size}.${f.lastModified}.${encodeURIComponent(f.name).slice(0, 80)}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A segment as it is safe to restore. Work in flight is not: a piece that was being cut or
 * uploaded when the page went away goes back to «not uploaded» (its upload resumes from the
 * stored TUS URL); a registered one stays done.
 */
function restoreSegment(v: unknown): Segment | null {
  if (typeof v !== 'object' || v === null) return null;
  const r = v as Record<string, unknown>;
  if (typeof r.id !== 'string' || !UUID_RE.test(r.id)) return null;
  const start = typeof r.startS === 'number' ? r.startS : NaN;
  const end = typeof r.endS === 'number' ? r.endS : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return null;
  const seg = newSegment(r.id, start, end);
  seg.exerciseId = typeof r.exerciseId === 'string' && r.exerciseId ? r.exerciseId : null;
  seg.exerciseName = typeof r.exerciseName === 'string' && r.exerciseName ? r.exerciseName : null;
  seg.crop = clampCrop(r.crop);
  seg.upload = r.upload === 'done' ? 'done' : 'idle';
  seg.progress = seg.upload === 'done' ? 1 : 0;
  return seg;
}

/** A stored draft, or null when there is none, it is unreadable, or it is too old. */
export function parseDraft(text: string | null, now: number): CutDraft | null {
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.sourceId !== 'string' || !UUID_RE.test(r.sourceId)) return null;
  const savedAt = typeof r.savedAt === 'number' ? r.savedAt : 0;
  if (now - savedAt > DRAFT_MAX_AGE_MS) return null;
  const segments = Array.isArray(r.segments)
    ? r.segments.map(restoreSegment).filter((s): s is Segment => s !== null)
    : [];
  return {
    sourceId: r.sourceId,
    title: typeof r.title === 'string' ? r.title.slice(0, 200) : '',
    segments: sortSegments(segments),
    savedAt,
  };
}

/** The text to store. Only what {@link parseDraft} reads back. */
export function serializeDraft(d: CutDraft): string {
  return JSON.stringify({
    sourceId: d.sourceId,
    title: d.title,
    savedAt: d.savedAt,
    segments: d.segments.map((s) => ({
      id: s.id,
      startS: s.startS,
      endS: s.endS,
      exerciseId: s.exerciseId,
      exerciseName: s.exerciseName,
      crop: s.crop,
      upload: s.upload === 'done' ? 'done' : 'idle',
    })),
  });
}

/** The source's default title: the file name without its extension. */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[A-Za-z0-9]{1,5}$/, '').trim();
  return (base || name).slice(0, 200);
}

/** The extension the piece is stored with. The cutter always writes MP4. */
export const PIECE_EXT = 'mp4';
