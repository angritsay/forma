import { describe, expect, it } from 'vitest';
import type { WorkoutSessionRow } from '@/lib/api/types';
import { buildDayActivity, totalPoints, weekStats } from './stats';

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

// 2026-09-02 is a Wednesday; the ISO week starts on 2026-08-31.
const TODAY = '2026-09-02';

describe('buildDayActivity', () => {
  it('keeps one day per finished session and ignores unfinished ones', () => {
    const days = buildDayActivity([
      session({ localDate: '2026-09-01' }),
      session({ localDate: '2026-09-02', completedAt: null }),
    ]);
    expect(days).toEqual([{ date: '2026-09-01', workoutDone: true }]);
  });
});

describe('weekStats', () => {
  it('sums the current ISO week only', () => {
    const stats = weekStats(
      [
        session({ localDate: '2026-08-30', points: 999 }), // last week
        session({ localDate: '2026-08-31' }),
        session({ localDate: '2026-09-02', durationSec: 600, calories: 50, points: 80 }),
        session({ localDate: '2026-09-02', completedAt: null, id: 'open' }),
      ],
      TODAY,
    );
    expect(stats.from).toBe('2026-08-31');
    expect(stats.workouts).toBe(2);
    expect(stats.minutes).toBe(30);
    expect(stats.calories).toBe(200);
    expect(stats.points).toBe(180);
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
