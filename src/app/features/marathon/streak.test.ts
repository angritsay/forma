/**
 * The streak's three rules, guarded — because all three are the owner's and none of them is what a
 * naive «count the days» would do.
 */
import { describe, expect, it } from 'vitest';
import { clubStreak, clubStreakDoneToday } from './streak';

describe('clubStreak', () => {
  it('counts the days that run back from today', () => {
    expect(clubStreak(['2026-09-21', '2026-09-20', '2026-09-19'], '2026-09-21')).toBe(3);
  });

  /*
   * Rule 2. The day is not lost until it is over, so a streak reaching yesterday is alive. Without
   * this the counter would drop to zero every morning and come back at lunchtime — reporting the
   * time of day rather than the habit.
   */
  it('stays alive when today has not been done yet', () => {
    expect(clubStreak(['2026-09-20', '2026-09-19', '2026-09-18'], '2026-09-21')).toBe(3);
  });

  it('ends at the first gap', () => {
    // The 18th is there, the 19th is not: the run is the 20th and the 21st.
    expect(clubStreak(['2026-09-21', '2026-09-20', '2026-09-18'], '2026-09-21')).toBe(2);
  });

  it('is zero once two days have gone by', () => {
    expect(clubStreak(['2026-09-19', '2026-09-18'], '2026-09-21')).toBe(0);
  });

  it('is zero with nothing to count', () => {
    expect(clubStreak([], '2026-09-21')).toBe(0);
  });

  /*
   * Rule 1, and the one the owner named outright: «воскресенье и конец недели не ругают серию».
   * The club runs in weekly rounds and each round is its own row, so a streak counted inside a
   * round would reset every Sunday. 2026-09-20 is a Sunday; the run crosses it.
   */
  it('runs through a Sunday and the end of a round', () => {
    const days = [
      '2026-09-22',
      '2026-09-21',
      '2026-09-20', // Sunday — the round ends
      '2026-09-19',
      '2026-09-18',
    ];
    expect(clubStreak(days, '2026-09-22')).toBe(5);
  });

  it('crosses a month and a year without noticing', () => {
    expect(clubStreak(['2027-01-01', '2026-12-31', '2026-12-30'], '2027-01-01')).toBe(3);
  });

  it('does not care about order or repeats', () => {
    const days = ['2026-09-19', '2026-09-21', '2026-09-20', '2026-09-20'];
    expect(clubStreak(days, '2026-09-21')).toBe(3);
  });

  /* A date past today cannot extend a streak — it would be a promise rather than a count. */
  it('ignores a day in the future', () => {
    expect(clubStreak(['2026-09-22', '2026-09-21', '2026-09-20'], '2026-09-21')).toBe(2);
  });

  it('ignores anything that is not a date', () => {
    expect(clubStreak(['', 'вчера', '2026-9-21', '2026-09-21'], '2026-09-21')).toBe(1);
    expect(clubStreak(['2026-09-21'], 'today')).toBe(0);
  });

  /*
   * A leap day is a day like any other. February 2028 has 29 of them, and the arithmetic here is
   * done on UTC noon precisely so that neither a leap day nor a daylight-saving shift moves it.
   */
  it('counts across a leap day', () => {
    expect(clubStreak(['2028-03-01', '2028-02-29', '2028-02-28'], '2028-03-01')).toBe(3);
  });
});

describe('clubStreakDoneToday', () => {
  it('separates «3 дня подряд, и сегодня сделано» from «3 дня подряд, сегодня ещё нет»', () => {
    const done = ['2026-09-21', '2026-09-20'];
    expect(clubStreakDoneToday(done, '2026-09-21')).toBe(true);
    expect(clubStreakDoneToday(['2026-09-20'], '2026-09-21')).toBe(false);
    expect(clubStreakDoneToday([], '2026-09-21')).toBe(false);
  });
});
