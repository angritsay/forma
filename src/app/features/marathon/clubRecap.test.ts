import { describe, expect, it } from 'vitest';
import { recapWeek } from './clubRecap';

describe('recapWeek', () => {
  it('closes the running week on Sunday once the task is done', () => {
    expect(recapWeek({ weekday: 0, week: 2, todayDone: true, proofThisWeek: true })).toBe(2);
    expect(recapWeek({ weekday: 0, week: 2, todayDone: false, proofThisWeek: true })).toBeNull();
  });

  it('shows last week on Monday and Tuesday until the first new proof', () => {
    expect(recapWeek({ weekday: 1, week: 3, todayDone: false, proofThisWeek: false })).toBe(2);
    expect(recapWeek({ weekday: 2, week: 3, todayDone: false, proofThisWeek: false })).toBe(2);
    expect(recapWeek({ weekday: 1, week: 3, todayDone: true, proofThisWeek: true })).toBeNull();
    // Tuesday after a Monday proof: the new week has begun.
    expect(recapWeek({ weekday: 2, week: 3, todayDone: false, proofThisWeek: true })).toBeNull();
  });

  it('has nothing to recap in a first week, or midweek', () => {
    expect(recapWeek({ weekday: 1, week: 1, todayDone: false, proofThisWeek: false })).toBeNull();
    for (const weekday of [3, 4, 5, 6]) {
      expect(recapWeek({ weekday, week: 2, todayDone: true, proofThisWeek: false })).toBeNull();
    }
  });
});
