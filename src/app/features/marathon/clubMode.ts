/**
 * Solo or duo — which of the two clubs a screen is about.
 *
 * The tab and its full board must agree: the board opened from the duo tab has to show the duo
 * club's table, not whichever round `my_marathons()` happened to list first. Both read the mode
 * from `?mode=duo` and pick the round here.
 */
export type ClubMode = 'solo' | 'duo';

export function clubModeOf(param: string | null): ClubMode {
  return param === 'duo' ? 'duo' : 'solo';
}

export interface ClubChoice<T> {
  soloClub: T | null;
  duoClub: T | null;
  /** Any running round — a closed cohort the coach runs by hand is not a club. */
  marathon: T | null;
}

/**
 * The round for a mode. Duo only when a duo club exists (before 0033 there is none and the screen
 * is exactly the solo one); otherwise the solo club, then any round.
 */
export function clubFor<T>(state: ClubChoice<T>, mode: ClubMode): T | null {
  if (mode === 'duo' && state.duoClub) return state.duoClub;
  return state.soloClub ?? state.marathon;
}

/** Board route for a mode, so the «всё» link carries the tab it was opened from. */
export function boardPath(mode: ClubMode): string {
  return mode === 'duo' ? '/marathon/board?mode=duo' : '/marathon/board';
}
