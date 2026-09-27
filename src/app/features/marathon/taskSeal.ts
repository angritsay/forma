/**
 * Is today's task still sealed?
 *
 * The morning half of the club's loop is curiosity — the owner's «желание зайти и узнать новое
 * задание». So the card the coach wrote is not simply on the page: on the first look of the day
 * it is dealt face down — «Задание дня», «+12», «Открыть» — and a tap turns it (`ClubCard`). The
 * open is remembered per task id in `clubMemory`, and a task id belongs to one day, so the seal is
 * once a day by construction.
 *
 * Three things break the seal without a tap, and each is a person the tease would be wrong for:
 *
 *   - **done** — the proof is in; there is nothing left to discover;
 *   - **closed** — the round is finished and the card says so; an envelope on a closed week is a
 *     promise the screen cannot keep;
 *   - **reduced motion** — the reveal is an animation, and somebody who asked for less motion is
 *     asking not to be made to tap through one.
 *
 * Pure, so the decision is tested rather than eyeballed.
 */
export interface SealInput {
  /** The member's proof is in and not struck out. */
  done: boolean;
  /** `clubMemory` has this task id as opened. */
  opened: boolean;
  /** The round is finished. */
  closed: boolean;
  reducedMotion: boolean;
}

export function isSealed({ done, opened, closed, reducedMotion }: SealInput): boolean {
  return !done && !opened && !closed && !reducedMotion;
}
