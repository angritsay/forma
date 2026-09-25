/**
 * The front of the player's card as class strings, kept out of the components so a test can hold
 * the desktop layout still (`layout.test.ts`).
 *
 * The owner, training from a laptop: «чтобы кнопки не скакали в процессе выполнения, так же как и
 * таймер и количество выполнений, и видео чтоб не в углу было». From `md` the card is therefore a
 * fixed grid that no step can reshape:
 *
 *   - the **clip** has the whole area left of the column and under the header, centred in it;
 *   - the **column** on the right (`w-95`, 380px) has a slot for each thing, top to bottom — the
 *     clock (`h-44` whether the step has a clock or not), the movement, and at the foot the one
 *     button and the quiet row under it.
 *
 * On a phone none of this applies: every desktop rule here is behind `md:`.
 */

/** The clock's slot at the top of the column, from `md`. The panel's content starts below it. */
export const MD_CLOCK_SLOT = 'md:h-44';

/**
 * The stage the clip and its still are drawn in (ArtFeed). See the comment there for the phone.
 */
export const PLAYER_STAGE =
  'absolute inset-x-0 top-[var(--player-top-h,0px)] bottom-[max(0px,calc(var(--player-glass-h,0px)-120px))] flex items-center overflow-hidden md:top-[calc(var(--safe-top)+56px)] md:right-95 md:bottom-0 md:justify-center md:p-6';

/**
 * The band the running step's clock is portalled into (PlayerTimerBand). From `md` it is the top
 * slot of the right-hand column, a fixed height, content at its top, and above the column's glass
 * so the blur does not land on the digits. `.player-band` drops its own pane there (global.css).
 */
export const PLAYER_BAND = `glass-bar-top glass-sheer player-band pointer-events-none absolute inset-x-0 top-[calc(var(--safe-top)+56px)] z-20 px-6 pt-2 pb-4 text-paper empty:hidden md:left-auto md:right-0 md:w-95 md:z-[35] md:overflow-hidden md:px-8 md:pt-4 md:pb-0 ${MD_CLOCK_SLOT}`;

/**
 * The panel's scrolling column (PlayerFooter). From `md` its content starts at the same height on
 * every step — under the header and the clock's slot, whether or not this step has a clock —
 * instead of being centred, which moved everything each time a step was a line taller or shorter.
 */
export const PLAYER_PANEL =
  'relative mx-auto max-h-dvh w-full max-w-[560px] overflow-y-auto overscroll-contain px-6 pt-6 pb-[calc(var(--safe-bottom)+16px+var(--demo-inset,0px))] md:flex md:h-full md:max-h-none md:flex-col md:justify-start md:px-8 md:pt-[calc(var(--safe-top)+56px+11rem)]';

/** The panel's outer box: a band across the foot on a phone, the right-hand column from `md`. */
export const PLAYER_COLUMN =
  'absolute inset-x-0 bottom-0 z-30 md:inset-y-0 md:right-0 md:left-auto md:w-95';

/**
 * The header's row. From `md` it spans the clip's area rather than a 560px strip in the middle of
 * the screen: back in the clip's corner, pause at its right edge, the progress line centred over
 * the video.
 */
export const PLAYER_HEADER_ROW =
  'relative mx-auto w-full max-w-[560px] px-3 pt-[var(--safe-top)] md:mr-95 md:ml-0 md:max-w-none md:w-auto';

/**
 * A step's own box inside the panel, from `md`: it fills the column so its button can sit at the
 * foot (`md:mt-auto` on the button) — the same place on every step.
 */
export const PLAYER_STEP_FILL = 'md:flex md:min-h-0 md:flex-1 md:flex-col';
