import { describe, expect, it } from 'vitest';
import { computeStreak, isActiveDay } from './streak';
import type { DayActivity } from './types';

const day = (date: string, o: Partial<DayActivity> = {}): DayActivity => ({
  date,
  workoutDone: false,
  ...o,
});
const w = (date: string) => day(date, { workoutDone: true });

describe('isActiveDay', () => {
  /*
   * There used to be a second way to make a day count — reaching the step goal — and four cases
   * here pinned it, including the fallback when a course set no goal of its own. Steps are gone,
   * and the rule is the shorter one now: a day is a day you trained.
   */
  it('counts a finished workout and nothing else', () => {
    expect(isActiveDay(w('2026-09-01'))).toBe(true);
    expect(isActiveDay(day('2026-09-01'))).toBe(false);
  });
});

describe('computeStreak', () => {
  it('returns zeros for no data', () => {
    expect(computeStreak([], '2026-09-02')).toEqual({
      current: 0,
      longest: 0,
      todayDone: false,
      atRisk: false,
    });
  });

  it('counts today when active', () => {
    const s = computeStreak([w('2026-08-31'), w('2026-09-01'), w('2026-09-02')], '2026-09-02');
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
    expect(s.todayDone).toBe(true);
    expect(s.atRisk).toBe(false);
    expect(s.lastActiveDate).toBe('2026-09-02');
  });

  it('keeps the streak from yesterday when today has nothing yet, flagged at risk', () => {
    const s = computeStreak([w('2026-08-31'), w('2026-09-01')], '2026-09-02');
    expect(s.current).toBe(2);
    expect(s.todayDone).toBe(false);
    expect(s.atRisk).toBe(true);
    expect(s.lastActiveDate).toBe('2026-09-01');
  });

  it('is 0 and not at risk after a gap', () => {
    const s = computeStreak([w('2026-08-30')], '2026-09-02');
    expect(s.current).toBe(0);
    expect(s.atRisk).toBe(false);
    expect(s.longest).toBe(1);
    expect(s.lastActiveDate).toBe('2026-08-30');
  });

  it('handles unsorted, sparse and duplicate input', () => {
    const days = [
      w('2026-09-02'),
      w('2026-08-31'),
      day('2026-09-01'),
      w('2026-09-01'),
      day('2026-08-20'),
      w('2026-08-31'),
    ];
    const s = computeStreak(days, '2026-09-02');
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });

  it('tracks the longest streak in history separately from the current one', () => {
    const days = [
      ...['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'].map(w),
      w('2026-09-01'),
      w('2026-09-02'),
    ];
    const s = computeStreak(days, '2026-09-02');
    expect(s.current).toBe(2);
    expect(s.longest).toBe(5);
  });

  it('ignores inactive rows, future dates and malformed dates', () => {
    const days = [w('2026-09-03'), w('2026-09-02'), day('2026-09-01'), w('not-a-date')];
    const s = computeStreak(days, '2026-09-02');
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
    expect(s.lastActiveDate).toBe('2026-09-02');
  });

  it('crosses month and year boundaries', () => {
    const s = computeStreak([w('2025-12-30'), w('2025-12-31'), w('2026-01-01')], '2026-01-01');
    expect(s.current).toBe(3);
  });
});
