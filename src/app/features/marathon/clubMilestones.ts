/**
 * The streak's milestones: the days a series is worth stopping to celebrate.
 *
 * A streak that only ever counts up is a number; a streak with landmarks is a game. The owner's
 * brief for the club's week — «регулярная подпитка дофамином» — is answered here with the
 * smallest possible mechanic: five fixed days, each celebrated once (`ClubCelebrate`, remembered
 * in `clubMemory`), the next one drawn as a ring in the streak's sheet so there is always a
 * nearer target than «forever».
 *
 * The numbers are the ones habit apps have converged on and members already expect: three days
 * is the first proof it was not an accident, a week is the club's own unit, then a fortnight, a
 * month, and a hundred. Nothing in between — a landmark every other day is no landmark.
 *
 * Pure: no dates here, only counts. `clubStreak()` in `streak.ts` decides what the count is.
 */

export const MILESTONES: readonly number[] = [3, 7, 14, 30, 100];

/** The first milestone above the current streak, or null once the last one is reached. */
export function nextMilestone(streak: number): number | null {
  return MILESTONES.find((m) => m > streak) ?? null;
}

/**
 * The milestone crossed between yesterday's count and today's — the one to celebrate now — or
 * null when none was. Only the highest is returned: a streak that jumped from 0 to 7 (a member
 * whose first week arrives before this feature did) celebrates the week, not both landmarks.
 */
export function reachedMilestone(prevStreak: number, streak: number): number | null {
  if (streak <= prevStreak) return null;
  const crossed = MILESTONES.filter((m) => m > prevStreak && m <= streak);
  return crossed.length > 0 ? (crossed[crossed.length - 1] ?? null) : null;
}

/** Milestones already behind this streak, in order — the filled beads in the sheet's row. */
export function reachedMilestones(streak: number): readonly number[] {
  return MILESTONES.filter((m) => m <= streak);
}
