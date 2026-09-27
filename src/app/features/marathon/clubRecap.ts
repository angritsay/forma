/**
 * When the week's recap is on the club screen, and which week it recaps.
 *
 * The Sunday moment of the loop is closure — the owner's brief wants a reason to come back on
 * Monday, and a week that simply rolls over gives none. So the recap has two windows:
 *
 *   - **Sunday, once today's task is done.** The week is complete for this member; the card
 *     closes it while the last proof is still warm. Before the task is done the card would be a
 *     summary of an unfinished thing, above the thing that would finish it.
 *   - **Monday and Tuesday, until the first proof of the new week.** Whoever did not open the app
 *     on Sunday evening still gets to see how it ended — and the moment they deliver something
 *     new, last week is last week and the card goes.
 *
 * The week recapped is the club's own count (`my_marathons.week`), not the calendar's: on Sunday
 * it is the running week, on Monday and Tuesday the one before it. A first week has nothing
 * before it, so there is no recap on its first days.
 *
 * `weekday` is JavaScript's (`Date#getDay()`, Sunday = 0). Pure, tested.
 */
export interface RecapInput {
  /** `Date#getDay()` in the member's own zone. */
  weekday: number;
  /** The club's running week. */
  week: number;
  /** Today's task is delivered and not struck out. */
  todayDone: boolean;
  /** Any proof at all in the running week (`marathon_my_points`, rows of this week). */
  proofThisWeek: boolean;
}

/** The week to recap, or null when the card is not on screen. */
export function recapWeek({ weekday, week, todayDone, proofThisWeek }: RecapInput): number | null {
  if (weekday === 0) return todayDone ? week : null;
  if ((weekday === 1 || weekday === 2) && !proofThisWeek && week > 1) return week - 1;
  return null;
}
