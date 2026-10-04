/**
 * Numbers the studio screens share. Kept apart from the components so the pure modules and their
 * tests import them without React.
 */

/** The exercise editor's id rule, `[a-z0-9_]{2,60}` (`EXERCISE_ID_RE`). */
export const EXERCISE_ID_MIN = 2;
export const EXERCISE_ID_MAX = 60;

/** The width of a segment's thumbnail, px. */
export const THUMB_WIDTH = 160;
