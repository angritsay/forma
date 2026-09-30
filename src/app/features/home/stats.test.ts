import { describe, expect, it } from 'vitest';
import type { WorkoutSessionRow } from '@/lib/api/types';
import { buildDayActivity, totalPoints } from './stats';

function session(partial: Partial<WorkoutSessionRow> & { localDate: string }): WorkoutSessionRow {
  return {
    id: `s-${partial.localDate}`,
    userId: 'u',
    courseId: 'start',
    nodeId: 'n',
    workoutId: 'w',
    difficulty: 'normal',
    scale: 1,
    prescribed: null,
    results: null,
    rpe: 5,
    feeling: 'ok',
    completion: 1,
    points: 100,
    durationSec: 1200,
    calories: 150,
    startedAt: `${partial.localDate}T10:00:00.000Z`,
    completedAt: `${partial.localDate}T10:20:00.000Z`,
    ...partial,
  };
}

describe('buildDayActivity', () => {
  it('keeps one day per finished session and ignores unfinished ones', () => {
    const days = buildDayActivity([
      session({ localDate: '2026-09-01' }),
      session({ localDate: '2026-09-02', completedAt: null }),
    ]);
    expect(days).toEqual([{ date: '2026-09-01', workoutDone: true }]);
  });
});

describe('totalPoints', () => {
  it('adds the points of completed sessions only', () => {
    expect(
      totalPoints([
        session({ localDate: '2026-09-01', points: 120 }),
        session({ localDate: '2026-09-02', completedAt: null }),
      ]),
    ).toBe(120);
  });
});
