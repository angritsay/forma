import { describe, expect, it } from 'vitest';
import type { DailyLogRow } from '@/lib/api/types';
import type { StreakInfo } from '@/lib/training/types';
import {
  addSteps,
  clampSteps,
  historyDays,
  MAX_STEPS,
  parseSteps,
  stepsToGoal,
  streakFeedback,
} from './model';

const TODAY = '2026-09-03';

function log(localDate: string, steps: number, points: number): DailyLogRow {
  return { userId: 'u1', localDate, steps, points, note: null, updatedAt: `${localDate}T20:00:00Z` };
}

function streak(partial: Partial<StreakInfo>): StreakInfo {
  return { current: 0, longest: 0, todayDone: false, atRisk: false, ...partial };
}

describe('parseSteps / clampSteps / addSteps', () => {
  it('parses digits with separators and rejects everything else', () => {
    expect(parseSteps('')).toBeNull();
    expect(parseSteps('   ')).toBeNull();
    expect(parseSteps('7000')).toBe(7000);
    expect(parseSteps('7 000')).toBe(7000);
    expect(parseSteps('12,345')).toBe(12345);
    expect(parseSteps('12.345')).toBe(12345);
    expect(parseSteps('abc')).toBeNull();
    expect(parseSteps('-5')).toBeNull();
    expect(parseSteps('999999')).toBe(MAX_STEPS);
  });

  it('clamps to 0..MAX_STEPS and floors', () => {
    expect(clampSteps(-1)).toBe(0);
    expect(clampSteps(12.9)).toBe(12);
    expect(clampSteps(Number.NaN)).toBe(0);
    expect(clampSteps(MAX_STEPS + 1)).toBe(MAX_STEPS);
    expect(addSteps(6000, 2500)).toBe(8500);
    expect(addSteps(MAX_STEPS - 10, 5000)).toBe(MAX_STEPS);
  });
});

describe('historyDays', () => {
  it('lists the previous 14 days newest first, marking logged ones', () => {
    const days = historyDays(
      { '2026-09-02': log('2026-09-02', 8000, 35), '2026-08-20': log('2026-08-20', 100, 0) },
      TODAY,
    );
    expect(days).toHaveLength(14);
    expect(days[0]).toEqual({ date: '2026-09-02', steps: 8000, points: 35, logged: true });
    expect(days[1]).toEqual({ date: '2026-09-01', steps: 0, points: 0, logged: false });
    expect(days[13]).toEqual({ date: '2026-08-20', steps: 100, points: 0, logged: true });
    expect(days.some((d) => d.date === TODAY)).toBe(false);
  });
});

describe('streakFeedback', () => {
  it('detects a kept streak, a new streak, a day below the goal and a plain update', () => {
    expect(
      streakFeedback(
        streak({ current: 3, atRisk: true }),
        streak({ current: 4, todayDone: true }),
      ),
    ).toBe('kept');
    expect(streakFeedback(streak({}), streak({ current: 1, todayDone: true }))).toBe('started');
    expect(streakFeedback(streak({ current: 3, atRisk: true }), streak({ current: 3 }))).toBe(
      'below_goal',
    );
    expect(
      streakFeedback(
        streak({ current: 4, todayDone: true }),
        streak({ current: 4, todayDone: true }),
      ),
    ).toBe('updated');
  });
});

describe('stepsToGoal', () => {
  it('counts the missing steps', () => {
    expect(stepsToGoal(0)).toBe(7000);
    expect(stepsToGoal(6500)).toBe(500);
    expect(stepsToGoal(9000)).toBe(0);
  });
});
