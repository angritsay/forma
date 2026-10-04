/**
 * Time inside a studio clip, for the grade editor's player.
 *
 * A clip is not cut exactly: the device stream-copies the long video from the keyframe before the
 * mark (S2), so the uploaded piece starts `rawOffsetS` seconds early. The worker trims that pad off
 * with an exact `-ss`. The preview must show the same span, so it plays the raw piece from
 * `rawOffsetS` to `rawOffsetS + (endS − startS)` and loops there — the pad is never graded on
 * screen as if it were part of the clip.
 */

export interface ClipSpan {
  /** Where the clip starts and ends in the long source video, seconds. */
  startS: number;
  endS: number;
  /** Where `startS` sits inside the uploaded piece: the keyframe pad. */
  rawOffsetS: number;
}

/** A playback window inside the raw piece, seconds. `to > from` unless the piece is empty. */
export interface PlayWindow {
  from: number;
  to: number;
}

/** The clip's length, seconds; never negative. */
export function clipDuration(span: ClipSpan): number {
  const d = span.endS - span.startS;
  return Number.isFinite(d) && d > 0 ? d : 0;
}

/**
 * The part of the raw piece that is the clip. `rawDuration` (from the video's metadata, when known)
 * caps the end: a piece that came out a little short plays to its end, not past it.
 */
export function previewWindow(span: ClipSpan, rawDuration?: number | null): PlayWindow {
  const from = Number.isFinite(span.rawOffsetS) && span.rawOffsetS > 0 ? span.rawOffsetS : 0;
  let to = from + clipDuration(span);
  if (rawDuration !== undefined && rawDuration !== null && Number.isFinite(rawDuration)) {
    to = Math.min(to, Math.max(0, rawDuration));
  }
  if (to <= from) {
    // The pad is longer than the piece claims to be: play what there is from the top.
    const end =
      rawDuration !== undefined && rawDuration !== null && rawDuration > 0 ? rawDuration : to;
    return { from: 0, to: Math.max(0, end) };
  }
  return { from, to };
}

/** Half a frame at 60 fps: closer than this to the end counts as the end. */
const END_SLACK = 1 / 120;

/**
 * Where the player should be: `t` itself while it is inside the window, the window's start when it
 * has run off the end (the loop) or sits in the pad before it (a fresh load, a seek to 0).
 */
export function wrapTime(t: number, win: PlayWindow): number {
  if (!Number.isFinite(t)) return win.from;
  if (t < win.from - END_SLACK || t >= win.to - END_SLACK) return win.from;
  return t;
}

/** True when `t` is outside the window and the player must seek. */
export function needsSeek(t: number, win: PlayWindow): boolean {
  return wrapTime(t, win) !== t;
}

/** A position inside the raw piece as a time in the long source video. */
export function sourceTime(rawT: number, span: ClipSpan): number {
  return span.startS + (rawT - (span.rawOffsetS > 0 ? span.rawOffsetS : 0));
}

/** Seconds into the clip (0 at its start) for a position inside the raw piece. */
export function clipTime(rawT: number, win: PlayWindow): number {
  return Math.min(Math.max(0, rawT - win.from), Math.max(0, win.to - win.from));
}

/** `m:ss.d`, or `h:mm:ss` from an hour up. Negative and broken input read as zero. */
export function formatClock(seconds: number, tenths = true): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  if (s >= 3600) {
    const total = Math.floor(s);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  // Round once, at the precision shown, so 59.96 reads as 1:00.0 and never as 0:60.0.
  const unit = tenths ? 10 : 1;
  const ticks = Math.round(s * unit);
  const m = Math.floor(ticks / (60 * unit));
  const rest = ticks - m * 60 * unit;
  const sec = Math.floor(rest / unit);
  const frac = rest - sec * unit;
  return `${m}:${String(sec).padStart(2, '0')}${tenths ? `.${frac}` : ''}`;
}

/** `0:12.0–0:31.5`: where the clip was cut from the long video. */
export function formatSpan(span: Pick<ClipSpan, 'startS' | 'endS'>): string {
  return `${formatClock(span.startS)}–${formatClock(span.endS)}`;
}
