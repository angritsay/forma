import { describe, expect, it } from 'vitest';
import { computeStreak, isActiveDay, stepsPoints } from './streak';
import type { DayActivity } from './types';

const day = (date: string, o: Partial<DayActivity> = {}): DayActivity => ({
  date,
  workoutDone: false,
  steps: 0,
  ...o,
});
const w = (date: string) => day(date, { workoutDone: true });

describe('isActiveDay', () => {
  it('counts a workout or reaching the steps goal', () => {
    expect(isActiveDay(w('2026-09-01'))).toBe(true);
    expect(isActiveDay(day('2026-09-01', { steps: 7000 }))).toBe(true);
    expect(isActiveDay(day('2026-09-01', { steps: 6999 }))).toBe(false);
    expect(isActiveDay(day('2026-09-01', { steps: 5000, stepsGoal: 5000 }))).toBe(true);
    expect(isActiveDay(day('2026-09-01', { steps: 9000, stepsGoal: 10000 }))).toBe(false);
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
      day('2026-09-02', { steps: 8000 }),
      w('2026-08-31'),
      day('2026-09-01', { steps: 100 }),
      w('2026-09-01'),
      day('2026-08-20', { steps: 7000 }),
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
    const days = [
      w('2026-09-03'),
      w('2026-09-02'),
      day('2026-09-01', { steps: 200 }),
      w('not-a-date'),
    ];
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

describe('stepsPoints', () => {
  it('is 0 below the goal, 30 at the goal, +5 per extra 1 000, capped at 60', () => {
    expect(stepsPoints(0)).toBe(0);
    expect(stepsPoints(6999)).toBe(0);
    expect(stepsPoints(7000)).toBe(30);
    expect(stepsPoints(7999)).toBe(30);
    expect(stepsPoints(8000)).toBe(35);
    expect(stepsPoints(12999)).toBe(55);
    expect(stepsPoints(13000)).toBe(60);
    expect(stepsPoints(30000)).toBe(60);
  });

  it('respects a custom goal and guards bad input', () => {
    expect(stepsPoints(9999, 10000)).toBe(0);
    expect(stepsPoints(10000, 10000)).toBe(30);
    expect(stepsPoints(11000, 10000)).toBe(35);
    expect(stepsPoints(-5)).toBe(0);
    expect(stepsPoints(Number.NaN)).toBe(0);
    expect(stepsPoints(7000, 0)).toBe(30);
  });
});
