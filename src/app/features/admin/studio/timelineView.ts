/**
 * The geometry of the cutter's timeline (`Timeline.tsx`): how far it zooms, where a time lands on
 * the strip, which ticks the ruler draws, how a pinch turns into a zoom step, and the queue that
 * keeps seeking in step with a finger.
 *
 * The timeline is CapCut's: the playhead stands still in the middle of the strip and the strip
 * moves under it. So a time's place on screen is always relative to the playhead's time — at
 * `now` it is the centre, a second later it is `pxPerSecond` to the right.
 *
 * Pure, so it is tested without a DOM: the component measures the strip, keeps the pointers and
 * feeds the numbers in here.
 */
import { clampTime } from './timeline';

/** The widest zoom: the strip never shows less than this many seconds (about a frame per 3px). */
export const MIN_VISIBLE_SECONDS = 2;

/** The zoom never goes past ×128, whatever the duration. */
export const MAX_ZOOM_CAP = 128;

/**
 * The deepest zoom for a video: the largest power of two that still leaves
 * {@link MIN_VISIBLE_SECONDS} across the strip, at most {@link MAX_ZOOM_CAP}, at least ×1.
 */
export function maxZoom(durationS: number | null): number {
  if (!durationS || !Number.isFinite(durationS) || durationS <= MIN_VISIBLE_SECONDS) return 1;
  let z = 1;
  while (z * 2 <= MAX_ZOOM_CAP && durationS / (z * 2) >= MIN_VISIBLE_SECONDS) z *= 2;
  return z;
}

/** The steps the «−» / «+» buttons walk: ×1, ×2, ×4 … up to `max`. */
export function zoomLevels(max: number): number[] {
  const out: number[] = [];
  for (let z = 1; z <= max; z *= 2) out.push(z);
  return out;
}

/** A zoom kept on a step: the nearest power of two, inside ×1…`max`. */
export function clampZoom(z: number, max: number): number {
  if (!Number.isFinite(z) || z <= 1) return 1;
  const step = 2 ** Math.round(Math.log2(z));
  return Math.min(Math.max(1, step), Math.max(1, max));
}

/** One step in or out from `z` (`dir` +1 is closer). */
export function stepZoom(z: number, dir: 1 | -1, max: number): number {
  return clampZoom(dir > 0 ? z * 2 : z / 2, max);
}

/**
 * A pinch: the zoom it started at times how far the fingers spread (`scale` = distance now ÷
 * distance at the start), snapped to a step. A pinch that has not moved keeps the start.
 */
export function pinchZoom(startZoom: number, scale: number, max: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return clampZoom(startZoom, max);
  return clampZoom(startZoom * scale, max);
}

/** At ×1 the whole video spans the strip; each step doubles that. */
export function pxPerSecond(widthPx: number, durationS: number | null, zoom: number): number {
  if (!durationS || durationS <= 0 || widthPx <= 0) return 0;
  return (widthPx * zoom) / durationS;
}

/** Where on the strip time 0 is drawn: the playhead's time sits in the middle. */
export function stripOffset(widthPx: number, nowS: number, pps: number): number {
  return widthPx / 2 - nowS * pps;
}

/** The time under `x` (px from the strip's left edge), kept inside the video. */
export function timeAtX(
  x: number,
  widthPx: number,
  nowS: number,
  pps: number,
  durationS: number | null,
): number {
  if (pps <= 0) return clampTime(nowS, durationS);
  return clampTime(nowS + (x - widthPx / 2) / pps, durationS);
}

/**
 * A drag: the finger moved `dx` px since it went down at `startS`. The strip follows the finger,
 * so moving it right goes back in time.
 */
export function dragTime(
  startS: number,
  dx: number,
  pps: number,
  durationS: number | null,
): number {
  if (pps <= 0) return clampTime(startS, durationS);
  return clampTime(startS - dx / pps, durationS);
}

/** The span of time the strip shows around `nowS`. */
export function visibleSpan(
  widthPx: number,
  nowS: number,
  pps: number,
): { from: number; to: number } {
  if (pps <= 0) return { from: 0, to: 0 };
  const half = widthPx / 2 / pps;
  return { from: nowS - half, to: nowS + half };
}

/**
 * The span the strip draws: the screen the playhead is in (`drawCell`, whole screens from 0) and
 * one and a half either side. It changes only when the playhead crosses into the next screen, so
 * a drag re-renders the ticks and frames a few times a second at most, not on every move — and
 * the moving layer stays a few screens wide however deep the zoom.
 */
export function drawCell(nowS: number, spanS: number): number {
  return spanS > 0 ? Math.floor(nowS / spanS) : 0;
}

export function drawWindow(cell: number, spanS: number): { from: number; to: number } {
  if (!(spanS > 0)) return { from: 0, to: 0 };
  return { from: (cell - 1.5) * spanS, to: (cell + 2.5) * spanS };
}

/** The tick steps, seconds; frame steps join them when the frame rate is known. */
const STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600];
/** Labels go only on these. */
const LABEL_STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600];

/** Minor ticks at least this far apart, labels at least this far apart. */
export const MIN_TICK_PX = 8;
export const MIN_LABEL_PX = 56;

const isMultiple = (a: number, b: number): boolean => {
  const r = a / b;
  return Math.abs(r - Math.round(r)) < 1e-6;
};

/**
 * The ruler at a zoom: a minor tick every `minor` seconds and a labelled one every `major`. Goes
 * from minutes when the whole video shows, through 10 s and 1 s, down to single frames.
 */
export function rulerSteps(pps: number, fps: number | null): { minor: number; major: number } {
  if (!(pps > 0)) return { minor: 60, major: 300 };
  const frame = fps && fps >= 5 && fps <= 240 ? 1 / fps : null;
  const candidates = frame ? [frame, frame * 2, frame * 5, ...STEPS] : STEPS;
  const minor =
    candidates.find((s) => s * pps >= MIN_TICK_PX) ?? candidates[candidates.length - 1]!;
  const major =
    LABEL_STEPS.find((s) => s * pps >= MIN_LABEL_PX && s >= minor && isMultiple(s, minor)) ??
    LABEL_STEPS.find((s) => s * pps >= MIN_LABEL_PX) ??
    LABEL_STEPS[LABEL_STEPS.length - 1]!;
  return { minor, major };
}

export interface Tick {
  t: number;
  major: boolean;
}

/** The ticks between `from` and `to` (inside 0…duration), at most `limit` of them. */
export function rulerTicks(
  from: number,
  to: number,
  steps: { minor: number; major: number },
  durationS: number,
  limit = 600,
): Tick[] {
  const lo = Math.max(0, from);
  const hi = Math.min(durationS, to);
  if (!(hi >= lo) || !(steps.minor > 0)) return [];
  const out: Tick[] = [];
  const first = Math.max(0, Math.ceil(lo / steps.minor - 1e-9));
  for (let i = first; out.length < limit; i++) {
    const t = i * steps.minor;
    if (t > hi + 1e-9) break;
    out.push({ t, major: isMultiple(t, steps.major) });
  }
  return out;
}

/** A ruler label: `m:ss` on whole seconds, `m:ss.d` below a second. */
export function rulerLabel(t: number, major: number): string {
  const v = Math.max(0, t);
  if (major >= 1) {
    const total = Math.round(v);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }
  const tenths = Math.round(v * 10);
  const total = Math.floor(tenths / 10);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}.${tenths % 10}`;
}

/**
 * The order the filmstrip's frames are made in: the ends and the middle first, then the gaps
 * between, so a strip half done is evenly sparse rather than full on the left and empty on the
 * right.
 */
export function fillOrder(n: number): number[] {
  if (n <= 0) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  const add = (i: number) => {
    if (i >= 0 && i < n && !seen.has(i)) {
      seen.add(i);
      out.push(i);
    }
  };
  add(0);
  add(n - 1);
  for (let step = 2 ** Math.ceil(Math.log2(n)); step >= 1; step /= 2) {
    for (let i = step / 2; i < n; i += step) add(Math.floor(i));
  }
  for (let i = 0; i < n; i++) add(i);
  return out;
}

/**
 * The fling after a drag lets go: the speed (px/ms) left after `dtMs`, decaying the way iOS
 * scroll views do. Below {@link FLING_STOP} it stops.
 */
export const FLING_TAU_MS = 325;
export const FLING_START = 0.35;
export const FLING_STOP = 0.02;

export function flingVelocity(v: number, dtMs: number): number {
  const next = v * Math.exp(-Math.max(0, dtMs) / FLING_TAU_MS);
  return Math.abs(next) < FLING_STOP ? 0 : next;
}

/**
 * The finger's speed (px/ms) from its recent positions: the newest against the oldest no more
 * than `windowMs` before it. Zero when there is too little to tell.
 */
export function releaseVelocity(
  samples: readonly { x: number; at: number }[],
  windowMs = 100,
): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1]!;
  let first = last;
  for (let i = samples.length - 2; i >= 0; i--) {
    const s = samples[i]!;
    if (last.at - s.at > windowMs) break;
    first = s;
  }
  const dt = last.at - first.at;
  return dt > 0 ? (last.x - first.x) / dt : 0;
}

/**
 * Seeking that keeps up with a finger. A phone that is handed a new `currentTime` on every move
 * starts a seek, abandons it for the next, and shows nothing until the finger stops — on a long
 * HEVC file it can stall outright. So at most one seek is in flight; a target asked for meanwhile
 * waits, and only the latest one: when the seek in flight lands (`seeked`), the newest target
 * goes next and the ones in between are dropped.
 *
 * `fast` asks for the nearest keyframe (`fastSeek`), cheap while the finger is moving over a
 * zoomed-out strip; the target she lets go on is always exact.
 */
export interface SeekTarget {
  t: number;
  fast: boolean;
}

export interface SeekQueue {
  /** A seek is in flight. */
  busy: boolean;
  /** The newest target asked for while one was in flight. */
  next: SeekTarget | null;
}

export const IDLE_SEEK: SeekQueue = { busy: false, next: null };

/** Ask for `target`: answers the target to start now (or null — it waits) and the new queue. */
export function requestSeek(
  q: SeekQueue,
  target: SeekTarget,
): { queue: SeekQueue; start: SeekTarget | null } {
  if (q.busy) return { queue: { busy: true, next: target }, start: null };
  return { queue: { busy: true, next: null }, start: target };
}

/** The seek in flight landed: the waiting target starts, or the queue goes idle. */
export function seekSettled(q: SeekQueue): { queue: SeekQueue; start: SeekTarget | null } {
  if (q.next) return { queue: { busy: true, next: null }, start: q.next };
  return { queue: IDLE_SEEK, start: null };
}
