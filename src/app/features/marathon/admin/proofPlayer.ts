/**
 * The arithmetic behind the proof player, kept out of the component so it can be tested.
 *
 * A proof is evidence, and the coach watches a stack of it in one sitting. That makes two numbers
 * matter — how fast the clip runs, and where the finger has landed on the bar — and both are the
 * kind of thing that goes wrong quietly: a rate the browser refuses, a seek past the end, a drag
 * that started inside the strip and finished somewhere off the side of the phone. None of that is
 * visible in a screenshot, so it lives here with tests rather than inline in JSX.
 */

/**
 * The speeds on the toggle.
 *
 * A ten-minute warm-up watched at 1× is ten minutes of a coach's evening per athlete, and the
 * question he is answering — «did this person actually do it» — survives being watched fast. 4× is
 * the top because it is where a rep is still a rep on screen: at 8× an ordinary phone clip is a
 * blur, and browsers stop playing audio well above 4× anyway. 1× stays because form is judged at
 * 1× when something looks wrong.
 */
export const REVIEW_SPEEDS = [1, 2, 4] as const;

export type ReviewSpeed = (typeof REVIEW_SPEEDS)[number];

/** How far an arrow key moves the clip, in seconds of video. */
export const NUDGE_SECONDS = 5;

/**
 * The next speed on the cycle, for a single button that steps 1× → 2× → 4× → 1×.
 *
 * Anything not on the list (a rate restored from an older session, a browser that clamped one)
 * comes back as the first speed rather than throwing: the toggle must always have somewhere to go.
 */
export function nextSpeed(current: number): ReviewSpeed {
  const i = REVIEW_SPEEDS.indexOf(current as ReviewSpeed);
  return REVIEW_SPEEDS[(i + 1) % REVIEW_SPEEDS.length]!;
}

/** Is this a speed the toggle knows? Guards a value coming back from storage. */
export function isReviewSpeed(value: unknown): value is ReviewSpeed {
  return REVIEW_SPEEDS.includes(value as ReviewSpeed);
}

/**
 * Where along the track the finger is, as 0..1.
 *
 * Clamped, because a drag keeps sending points after it has left the strip — the pointer is
 * captured on purpose, so a finger that slides off the edge of the phone still scrubs to the end
 * instead of dropping the gesture. A zero-width track (measured before layout) reads as 0.
 */
export function ratioAt(clientX: number, trackLeft: number, trackWidth: number): number {
  if (!(trackWidth > 0) || !Number.isFinite(clientX)) return 0;
  return clamp01((clientX - trackLeft) / trackWidth);
}

/**
 * The time to seek to for a position on the track.
 *
 * Duration is `NaN` until metadata arrives and `Infinity` for a stream, and assigning either to
 * `currentTime` throws; both come back as 0, which leaves the clip where it is.
 */
export function seekTarget(ratio: number, duration: number): number {
  if (!isPlayableDuration(duration)) return 0;
  return clamp01(ratio) * duration;
}

/** Arrow-key seeking: a step of `delta` seconds, kept inside the clip. */
export function nudge(current: number, duration: number, delta: number): number {
  if (!isPlayableDuration(duration)) return 0;
  const at = (Number.isFinite(current) ? current : 0) + delta;
  return Math.min(duration, Math.max(0, at));
}

/** How much of the clip has been watched, 0..1 — what the bar draws. */
export function playedRatio(current: number, duration: number): number {
  if (!isPlayableDuration(duration)) return 0;
  return clamp01((Number.isFinite(current) ? current : 0) / duration);
}

/**
 * A running clock, `mm:ss` — or `h:mm:ss` once a clip runs past the hour.
 *
 * Minutes are not padded in the hour form and are in the short one, which is how a stopwatch
 * reads: `09:41`, `1:02:30`. Anything the element cannot give us yet reads `--:--` rather than
 * `00:00`, so an unloaded clip never looks like an empty one.
 */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${String(m).padStart(2, '0')}:${ss}`;
}

/** A duration a seek can be computed against: known, positive, finite. */
export function isPlayableDuration(duration: number): boolean {
  return Number.isFinite(duration) && duration > 0;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}
