/**
 * Time and segment math of the cutter («Нарезка»): where the playhead may go, how a frame step and
 * a second step move it, and how the «Начало» / «Конец» marks turn into a list of segments.
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

export type MarkResult = { state: MarkState; problem: SpanProblem | 'locked' | 'no_in' | null };

/**
 * «Начало» at `t`. With a segment selected it moves that segment's start (when the span stays
 * valid); otherwise it remembers `t` as the start of the next segment.
 */
export function markIn(state: MarkState, t: number): MarkResult {
  const sel = state.segments.find((s) => s.id === state.selectedId);
  if (!sel) return { state: { ...state, pendingIn: round3(t) }, problem: null };
  if (isLocked(sel)) return { state, problem: 'locked' };
  const problem = spanProblem(t, sel.endS);
  if (problem) return { state, problem };
  return {
    state: {
      ...state,
      segments: sortSegments(
        state.segments.map((s) =>
          s.id === sel.id ? { ...s, startS: round3(t), upload: 'idle', error: null } : s,
        ),
      ),
    },
    problem: null,
  };
}

/**
 * «Конец» at `t`. With a segment selected it moves that segment's end; otherwise it closes the
 * pending start into a new segment (id from `makeId`), which is then selected so its label and
 * frame are the next thing to set.
 */
export function markOut(state: MarkState, t: number, makeId: () => string): MarkResult {
  const sel = state.segments.find((s) => s.id === state.selectedId);
  if (sel) {
    if (isLocked(sel)) return { state, problem: 'locked' };
    const problem = spanProblem(sel.startS, t);
    if (problem) return { state, problem };
    return {
      state: {
        ...state,
        segments: sortSegments(
          state.segments.map((s) =>
            s.id === sel.id ? { ...s, endS: round3(t), upload: 'idle', error: null } : s,
          ),
        ),
      },
      problem: null,
    };
  }
  if (state.pendingIn === null) return { state, problem: 'no_in' };
  const problem = spanProblem(state.pendingIn, t);
  if (problem) return { state, problem };
  const seg = newSegment(makeId(), state.pendingIn, t);
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
