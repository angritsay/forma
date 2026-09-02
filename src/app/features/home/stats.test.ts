import { describe, expect, it } from 'vitest';
import type { DailyLogRow, WorkoutSessionRow } from '@/lib/api/types';
import { buildDayActivity, stepsWeek, totalPoints, weekStats } from './stats';

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

function log(localDate: string, steps: number, points = 0): DailyLogRow {
  return { userId: 'u', localDate, steps, points, note: null, updatedAt: `${localDate}T20:00:00Z` };
}

// 2026-09-02 is a Wednesday; the ISO week starts on 2026-08-31.
const TODAY = '2026-09-02';

describe('buildDayActivity', () => {
  it('merges sessions and logs per day, ignoring unfinished sessions', () => {
    const days = buildDayActivity(
      [session({ localDate: '2026-09-01' }), session({ localDate: '2026-09-02', completedAt: null })],
      { '2026-09-01': log('2026-09-01', 3000), '2026-08-30': log('2026-08-30', 8000) },
    );
    expect(days).toEqual([
      { date: '2026-08-30', workoutDone: false, steps: 8000 },
      { date: '2026-09-01', workoutDone: true, steps: 3000 },
    ]);
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
      {
        '2026-08-30': log('2026-08-30', 9000, 40),
        '2026-09-01': log('2026-09-01', 7000, 30),
        '2026-09-02': log('2026-09-02', 2000, 0),
      },
      TODAY,
    );
    expect(stats.from).toBe('2026-08-31');
    expect(stats.workouts).toBe(2);
    expect(stats.minutes).toBe(30);
    expect(stats.calories).toBe(200);
    expect(stats.workoutPoints).toBe(180);
    expect(stats.stepsPoints).toBe(30);
    expect(stats.points).toBe(210);
    expect(stats.steps).toBe(9000);
  });
});

describe('stepsWeek', () => {
  it('returns Monday..Sunday with today flagged and future days marked', () => {
    const week = stepsWeek({ '2026-09-01': log('2026-09-01', 5000) }, TODAY);
    expect(week.map((d) => d.date)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(week[1]?.steps).toBe(5000);
    expect(week[2]?.today).toBe(true);
    expect(week[3]?.future).toBe(true);
    expect(week[0]?.steps).toBe(0);
  });
});

describe('totalPoints', () => {
  it('adds completed session points and log points', () => {
    expect(
      totalPoints(
        [session({ localDate: '2026-09-01', points: 120 }), session({ localDate: '2026-09-02', completedAt: null })],
        { '2026-09-01': log('2026-09-01', 8000, 35) },
      ),
    ).toBe(155);
  });
});
