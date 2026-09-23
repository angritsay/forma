/**
 * The vertical feed's arithmetic: how far the picture follows a finger, and when letting go means
 * "the next movement" rather than "never mind".
 *
 * The player used to change movement on `touchend`, all at once, once a finger had travelled 64px:
 * nothing moved while the thumb did, then the clip, the name and the number were replaced in one
 * frame and the new picture faded up from black. The owner: «переходы между упражнениями очень
 * резкие». A feed of short video — the model she asked for — does it the other way round: the
 * picture is under the finger the whole time, the next one is already there below it, and letting
 * go only finishes a movement that has already begun.
 *
 * Pure and DOM-free so the thresholds can be tested; `FlipCard` measures the finger and
 * `PlayerScreen` moves the slides.
 */

/** How long the snap takes, in ms. Matches the `transform` transition in global.css. */
export const FEED_MS = 280;
/** Travel (px) before a touch picks an axis: less than this is a tap that wandered. */
export const FEED_SLOP_PX = 10;
/** Past this share of the screen, letting go at any speed turns the page. */
export const FEED_COMMIT_RATIO = 0.22;
/** A flick this fast (px/ms) turns the page even when it was short… */
export const FEED_FLICK_VELOCITY = 0.45;
/** …as long as it went at least this far — so a twitch at speed is still a twitch. */
export const FEED_FLICK_MIN_PX = 32;

export type FeedMove = 'next' | 'prev';

export interface FeedAllowed {
  /** Up is allowed: there is a step after this one, and this step does not hold the swipe. */
  next: boolean;
  /** Down is allowed: there is a step before this one, and this step does not hold the swipe. */
  prev: boolean;
}

/**
 * Directions a step holds shut while it runs. A running AMRAP holds both: the old swipe up ended it
 * on the spot, and a thumb brushing the screen mid-burpee is not somebody deciding they are done.
 */
export interface SwipeHold {
  next: boolean;
  prev: boolean;
}

/**
 * Resistance on a direction that leads nowhere — the top of the session, or a running AMRAP that
 * only its own button may end.
 *
 * The picture still moves, a little and less the further it is pulled, and comes back on release.
 * That is how a person learns the page will not turn without being told so in words: a picture
 * that did not move at all would read as the app not listening.
 */
export function rubberBand(dy: number, height: number): number {
  if (height <= 0 || dy === 0) return 0;
  const d = Math.abs(dy);
  const damped = (1 - 1 / ((d * 0.55) / height + 1)) * height * 0.5;
  return Math.sign(dy) * damped;
}

/** Where the picture sits while a finger has it: 1:1 where the page can turn, damped where not. */
export function feedOffset(dy: number, height: number, allowed: FeedAllowed): number {
  if (dy < 0) return allowed.next ? Math.max(dy, -height) : rubberBand(dy, height);
  if (dy > 0) return allowed.prev ? Math.min(dy, height) : rubberBand(dy, height);
  return 0;
}

/**
 * What letting go means. `dy` is the finger's travel (negative is up), `velocity` its speed at the
 * moment it lifted in px/ms (same sign), `height` the height of the feed.
 *
 * Up is the next movement and down the one before, as in every feed. Either needs the page to be
 * allowed to turn that way, and then either enough of the screen covered or a quick enough flick —
 * never a flick against the drag, which is somebody changing their mind.
 */
export function feedDecision(
  dy: number,
  velocity: number,
  height: number,
  allowed: FeedAllowed,
): FeedMove | null {
  if (height <= 0 || dy === 0) return null;
  const far = Math.abs(dy) >= height * FEED_COMMIT_RATIO;
  const flick =
    Math.abs(dy) >= FEED_FLICK_MIN_PX &&
    Math.abs(velocity) >= FEED_FLICK_VELOCITY &&
    Math.sign(velocity) === Math.sign(dy);
  // A slow drag that is being pulled back the other way is somebody changing their mind.
  const reversing = Math.sign(velocity) === -Math.sign(dy) && Math.abs(velocity) > 0.1;
  if (!(flick || (far && !reversing))) return null;
  if (dy < 0) return allowed.next ? 'next' : null;
  return allowed.prev ? 'prev' : null;
}

/** Speed (px/ms) over the last stretch of a gesture, from timestamped samples of its position. */
export function releaseVelocity(samples: readonly { y: number; t: number }[], windowMs = 100) {
  const last = samples[samples.length - 1];
  if (!last) return 0;
  let first = last;
  for (let i = samples.length - 1; i >= 0; i--) {
    const s = samples[i];
    if (!s || last.t - s.t > windowMs) break;
    first = s;
  }
  const dt = last.t - first.t;
  return dt > 0 ? (last.y - first.y) / dt : 0;
}
