/**
 * Time and segment math of the cutter («Нарезка»): where the playhead may go, how a frame step and
 * a second step move it, and how the «Начало» / «Конец» marks turn into a list of segments.
 *
 * Segments never overlap: a range that is cut is cut once. A start inside a cut range is refused
 * («Этот кусок уже вырезан»); an end that would run into the next cut range stops at its start,
 * and is refused when that leaves less than {@link MIN_SEGMENT_SECONDS}. Moving the edges of a
 * selected segment keeps to the same rule, so the list stays a set of separate spans.
 *
 * Pure, so the rules are tested without a `<video>`: the screen only feeds it the playhead and the
 * duration and renders what comes back.
 */
import { MAX_CLIP_SECONDS } from '@/lib/api/mediaStudio';
import type { Crop } from '@/lib/media/crop';

/** A piece shorter than this is a double tap, not an exercise. */
export const MIN_SEGMENT_SECONDS = 0.5;

/** The frame rate assumed when the file does not say (phones film at 30 more often than not). */
export const FALLBACK_FPS = 30;

/** Upload progress of one segment, as the cutter shows it. */
export type SegmentUploadState =
  'idle' | 'cutting' | 'uploading' | 'registering' | 'done' | 'error';

export interface Segment {
  /** The clip id picked on the device: the raw path and the clip row both carry it. */
  id: string;
  startS: number;
  endS: number;
  exerciseId: string | null;
  exerciseName: string | null;
  crop: Crop | null;
  upload: SegmentUploadState;
  /** 0…1 while cutting or uploading. */
  progress: number;
  /** A key of {@link UploadErrorKind} when `upload` is `error`. */
  error: string | null;
}

const round3 = (v: number): number => Math.round(v * 1000) / 1000;

/** The playhead kept inside the video. A duration that is not known yet leaves only the floor. */
export function clampTime(t: number, durationS: number | null): number {
  if (!Number.isFinite(t) || t < 0) return 0;
  if (durationS !== null && Number.isFinite(durationS) && durationS > 0 && t > durationS) {
    return durationS;
  }
  return t;
}

/** A usable frame rate: the file's own when it is believable, otherwise {@link FALLBACK_FPS}. */
export function safeFps(fps: number | null | undefined): number {
  return typeof fps === 'number' && Number.isFinite(fps) && fps >= 5 && fps <= 240
    ? fps
    : FALLBACK_FPS;
}

/**
 * One frame forward or back. Lands on the middle of the next frame rather than its edge, so a
 * browser that rounds `currentTime` down does not show the same frame twice.
 */
export function stepFrame(
  t: number,
  fps: number | null | undefined,
  dir: 1 | -1,
  durationS: number | null,
): number {
  const f = safeFps(fps);
  const index = Math.floor(t * f + 1e-6);
  const next = index + dir;
  return clampTime(round3((next + 0.5) / f), durationS);
}

/** Whole seconds forward or back. */
export function stepSeconds(t: number, seconds: number, durationS: number | null): number {
  return clampTime(round3(t + seconds), durationS);
}

/** `m:ss.d` (or `h:mm:ss.d` past an hour), the way the cutter's readout and list show a time. */
export function formatTimecode(t: number): string {
  const v = Math.max(0, Number.isFinite(t) ? t : 0);
  const tenths = Math.floor(v * 10 + 1e-6);
  const d = tenths % 10;
  const total = Math.floor(tenths / 10);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}.${d}` : `${m}:${ss}.${d}`;
}

/** A segment's length in seconds, one decimal. */
export function segmentSeconds(s: Pick<Segment, 'startS' | 'endS'>): number {
  return Math.round((s.endS - s.startS) * 10) / 10;
}

/** Why a span cannot become a clip, or null when it can. */
export type SpanProblem = 'too_short' | 'too_long' | 'reversed';

export function spanProblem(startS: number, endS: number): SpanProblem | null {
  if (!(endS > startS)) return 'reversed';
  if (endS - startS < MIN_SEGMENT_SECONDS) return 'too_short';
  if (endS - startS > MAX_CLIP_SECONDS) return 'too_long';
  return null;
}

export function newSegment(id: string, startS: number, endS: number): Segment {
  return {
    id,
    startS: round3(startS),
    endS: round3(endS),
    exerciseId: null,
    exerciseName: null,
    crop: null,
    upload: 'idle',
    progress: 0,
    error: null,
  };
}

/**
 * Clips already uploaded to a source, as locked segments, for the ones the list does not have yet:
 * cutting more of a video whose draft is gone must still see what is cut.
 */
export function withUploaded(
  list: readonly Segment[],
  uploaded: readonly {
    id: string;
    startS: number;
    endS: number;
    exerciseId: string | null;
    exerciseName: string | null;
  }[],
): Segment[] {
  const have = new Set(list.map((s) => s.id));
  const extra = uploaded
    .filter((c) => !have.has(c.id))
    .map((c) => ({
      ...newSegment(c.id, c.startS, c.endS),
      exerciseId: c.exerciseId,
      exerciseName: c.exerciseName,
      upload: 'done' as const,
      progress: 1,
    }));
  return extra.length === 0 ? [...list] : sortSegments([...list, ...extra]);
}

/** Segments in the order they were filmed. */
export function sortSegments(list: readonly Segment[]): Segment[] {
  return [...list].sort((a, b) => a.startS - b.startS || a.endS - b.endS);
}

/** An uploaded segment is on the server: its timing is fixed from then on. */
export function isLocked(s: Segment): boolean {
  return s.upload !== 'idle' && s.upload !== 'error';
}

export interface MarkState {
  segments: Segment[];
  /** «Начало» pressed with no segment selected: the start of the next one. */
  pendingIn: number | null;
  /** The segment the marks edit; null — the marks make a new one. */
  selectedId: string | null;
}

/**
 * What can be wrong with a mark: the span itself, a locked segment, an end with no start, a start
 * inside a range already cut (`inside_cut`), or an end that the next cut range leaves too little
 * room for (`overlap`).
 */
export type MarkProblem = SpanProblem | 'locked' | 'no_in' | 'inside_cut' | 'overlap';

export type MarkResult = { state: MarkState; problem: MarkProblem | null };

/** The cut segment `t` falls inside (its end excluded), leaving out `exceptId`. */
export function cutAt(
  list: readonly Segment[],
  t: number,
  exceptId: string | null = null,
): Segment | null {
  return list.find((s) => s.id !== exceptId && t >= s.startS && t < s.endS) ?? null;
}

/**
 * The free room around `[from, to]` among the other segments: from the end of the last one
 * before it to the start of the first one after it (0 and ∞ when there is none).
 */
export function freeRoom(
  list: readonly Segment[],
  from: number,
  to: number,
  exceptId: string | null = null,
): { lo: number; hi: number } {
  let lo = 0;
  let hi = Number.POSITIVE_INFINITY;
  for (const s of list) {
    if (s.id === exceptId) continue;
    if (s.endS <= from + 1e-9) lo = Math.max(lo, s.endS);
    else if (s.startS >= to - 1e-9) hi = Math.min(hi, s.startS);
  }
  return { lo, hi };
}

/**
 * An end at `t` for a span starting at `from`, stopped at the next cut range (`hi`). Answers the
 * end, or the problem: the span's own, or `overlap` when stopping left it too short.
 */
function endBefore(
  from: number,
  t: number,
  hi: number,
): { end: number; problem: MarkProblem | null } {
  const clamped = t > hi;
  const end = clamped ? hi : t;
  const problem = spanProblem(from, end);
  if (problem === 'too_short' || (problem === 'reversed' && clamped)) {
    return { end, problem: clamped ? 'overlap' : problem };
  }
  return { end, problem };
}

/**
 * «Начало» at `t`. With a segment selected it moves that segment's start (when the span stays
 * valid, and not into another cut range: a start before the previous segment's end stops there);
 * otherwise it remembers `t` as the start of the next segment — unless `t` is already cut.
 */
export function markIn(state: MarkState, t: number): MarkResult {
  const sel = state.segments.find((s) => s.id === state.selectedId);
  if (!sel) {
    if (cutAt(state.segments, t)) return { state, problem: 'inside_cut' };
    return { state: { ...state, pendingIn: round3(t) }, problem: null };
  }
  if (isLocked(sel)) return { state, problem: 'locked' };
  if (cutAt(state.segments, t, sel.id)) return { state, problem: 'inside_cut' };
  const { lo } = freeRoom(state.segments, sel.startS, sel.endS, sel.id);
  const start = Math.max(t, lo);
  const problem = spanProblem(start, sel.endS);
  if (problem) return { state, problem: problem === 'too_short' && t < lo ? 'overlap' : problem };
  return {
    state: {
      ...state,
      segments: sortSegments(
        state.segments.map((s) =>
          s.id === sel.id ? { ...s, startS: round3(start), upload: 'idle', error: null } : s,
        ),
      ),
    },
    problem: null,
  };
}

/**
 * «Конец» at `t`. With a segment selected it moves that segment's end; otherwise it closes the
 * pending start into a new segment (id from `makeId`), which is then selected. Either way an end
 * that runs into the next cut range stops at its start.
 */
export function markOut(state: MarkState, t: number, makeId: () => string): MarkResult {
  const sel = state.segments.find((s) => s.id === state.selectedId);
  if (sel) {
    if (isLocked(sel)) return { state, problem: 'locked' };
    const { hi } = freeRoom(state.segments, sel.startS, sel.endS, sel.id);
    const { end, problem } = endBefore(sel.startS, t, hi);
    if (problem) return { state, problem };
    return {
      state: {
        ...state,
        segments: sortSegments(
          state.segments.map((s) =>
            s.id === sel.id ? { ...s, endS: round3(end), upload: 'idle', error: null } : s,
          ),
        ),
      },
      problem: null,
    };
  }
  if (state.pendingIn === null) return { state, problem: 'no_in' };
  // The start was free when it was marked; a draft restored from an older version may not be.
  if (cutAt(state.segments, state.pendingIn)) return { state, problem: 'inside_cut' };
  const { hi } = freeRoom(state.segments, state.pendingIn, state.pendingIn);
  const { end, problem } = endBefore(state.pendingIn, t, hi);
  if (problem) return { state, problem };
  const seg = newSegment(makeId(), state.pendingIn, end);
  return {
    state: {
      segments: sortSegments([...state.segments, seg]),
      pendingIn: null,
      selectedId: seg.id,
    },
    problem: null,
  };
}

/** The segment under the playhead, for highlighting it on the scrubber and in the list. */
export function segmentAt(list: readonly Segment[], t: number): Segment | null {
  return list.find((s) => t >= s.startS && t < s.endS) ?? null;
}

/** Segments waiting to be uploaded, in order. */
export function pendingUploads(list: readonly Segment[]): Segment[] {
  return sortSegments(list).filter((s) => s.upload !== 'done');
}
