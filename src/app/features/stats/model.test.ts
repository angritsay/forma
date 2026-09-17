import { describe, expect, it } from 'vitest';
import { COURSES } from '@/content/registry';
import type {
  BenchmarkRow,
  BenchmarkSeries,
  CourseStateRow,
  WorkoutSessionRow,
} from '@/lib/api/types';
import {
  dayMonthLabel,
  dayOfMonthLabel,
  isCourseCompleted,
  personalRecords,
  pointsByWeek,
  recordImproved,
  recordLabel,
  streakCalendar,
  totalCalories,
  userStatsFromProgress,
  weekActiveDays,
  weekLoad,
} from './model';

const TODAY = '2026-09-03'; // Thursday; ISO week starts 2026-08-31

function session(localDate: string, extra: Partial<WorkoutSessionRow> = {}): WorkoutSessionRow {
  return {
    id: `s-${localDate}-${extra.id ?? '1'}`,
    userId: 'u1',
    courseId: 'start',
    nodeId: 'n1',
    workoutId: 'w1',
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
    startedAt: `${localDate}T10:00:00.000Z`,
    completedAt: `${localDate}T10:20:00.000Z`,
    localDate,
    ...extra,
  };
}

function bench(key: string, value: number, unit: string, recordedAt: string): BenchmarkRow {
  return { id: `${key}-${recordedAt}`, userId: 'u1', key, value, unit, recordedAt };
}

describe('weekLoad', () => {
  it('returns Monday to Sunday with workouts and minutes per day', () => {
    const days = weekLoad(
      [
        session('2026-08-31'),
        session('2026-09-02', { id: 'a', durationSec: 600 }),
        session('2026-09-02', { id: 'b', durationSec: 700 }),
        session('2026-09-04'), // future relative to today: still counted if present
        session('2026-08-30'), // previous week
      ],
      TODAY,
    );
    expect(days.map((d) => d.date)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(days[0]).toMatchObject({ workouts: 1, minutes: 20, today: false, future: false });
    expect(days[2]).toMatchObject({ workouts: 2, minutes: 22 });
    expect(days[3]).toMatchObject({ workouts: 0, minutes: 0, today: true });
    expect(days[5]).toMatchObject({ future: true });
  });

  it('ignores unfinished sessions', () => {
    const days = weekLoad([session('2026-09-01', { completedAt: null })], TODAY);
    expect(days[1]?.workouts).toBe(0);
  });
});

describe('pointsByWeek', () => {
  it('buckets workout points into the last 8 ISO weeks, oldest first', () => {
    const weeks = pointsByWeek(
      [
        session('2026-09-01', { points: 120 }),
        session('2026-08-25', { points: 80 }),
        session('2026-07-13', { points: 999 }), // 8 weeks ago: outside the window
      ],
      TODAY,
    );
    expect(weeks).toHaveLength(8);
    expect(weeks[0]?.from).toBe('2026-07-13');
    expect(weeks[7]).toMatchObject({ from: '2026-08-31', to: '2026-09-06', current: true });
    expect(weeks[7]?.points).toBe(120);
    expect(weeks[6]?.points).toBe(80);
    expect(weeks[0]?.points).toBe(999);
    expect(weeks.filter((w) => w.current)).toHaveLength(1);
  });
});

describe('streakCalendar', () => {
  it('marks workout, empty and future days across 5 weeks', () => {
    const weeks = streakCalendar([session('2026-09-01')], TODAY);
    expect(weeks).toHaveLength(5);
    expect(weeks[0]?.from).toBe('2026-08-03');
    const current = weeks[4]!;
    expect(current.from).toBe('2026-08-31');
    expect(current.cells.map((c) => c.kind)).toEqual([
      'empty',
      'workout',
      'empty',
      'empty',
      'future',
      'future',
      'future',
    ]);
    expect(current.cells[3]?.today).toBe(true);
  });
});

describe('weekActiveDays', () => {
  it('marks a day active for a finished workout, by the streak’s rule', () => {
    const days = weekActiveDays([session('2026-09-01'), session('2026-08-30')], TODAY);
    expect(days.map((d) => d.date)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(days.map((d) => d.active)).toEqual([false, true, false, false, false, false, false]);
    expect(days[3]).toMatchObject({ today: true, future: false });
    expect(days[4]?.future).toBe(true);
  });
});

describe('personal records', () => {
  const exerciseId = COURSES[0]!.workouts[0]!.blocks[0]!.items[0]!.exerciseId;
  const course = COURSES[0]!;
  const workoutId = course.workouts[0]!.id;

  it('labels exercise keys and workout keys', () => {
    expect(recordLabel(exerciseId, 'en').kind).toBe('exercise');
    expect(recordLabel(workoutId, 'ru')).toMatchObject({
      kind: 'workout',
      name: course.workouts[0]!.name.ru,
      context: course.name.ru,
    });
    expect(recordLabel('some_unknown_key', 'en')).toEqual({
      kind: 'unknown',
      name: 'some unknown key',
    });
  });

  it('computes the delta against the first attempt and the direction of improvement', () => {
    const series: BenchmarkSeries[] = [
      {
        key: exerciseId,
        latest: bench(exerciseId, 25, 'reps', '2026-09-01T10:00:00Z'),
        history: [
          bench(exerciseId, 25, 'reps', '2026-09-01T10:00:00Z'),
          bench(exerciseId, 18, 'reps', '2026-08-01T10:00:00Z'),
        ],
      },
      {
        key: workoutId,
        latest: bench(workoutId, 300, 'seconds', '2026-09-02T10:00:00Z'),
        history: [
          bench(workoutId, 300, 'seconds', '2026-09-02T10:00:00Z'),
          bench(workoutId, 280, 'seconds', '2026-08-02T10:00:00Z'),
        ],
      },
      {
        key: 'plank',
        latest: bench('plank', 60, 'seconds', '2026-09-02T10:00:00Z'),
        history: [bench('plank', 60, 'seconds', '2026-09-02T10:00:00Z')],
      },
    ];
    const records = personalRecords(series, 'en');
    expect(records[0]).toMatchObject({ latest: 25, first: 18, delta: 7, attempts: 2 });
    expect(recordImproved(records[0]!)).toBe(true);
    expect(records[1]).toMatchObject({ delta: 20, lowerIsBetter: true });
    expect(recordImproved(records[1]!)).toBe(false);
    expect(records[2]).toMatchObject({ delta: 0, attempts: 1, lowerIsBetter: false });
    expect(recordImproved(records[2]!)).toBeNull();
  });
});

describe('userStatsFromProgress', () => {
  const course = COURSES[0]!;
  const scoredNodes = course.nodes.filter((n) => n.kind !== 'rest' && n.kind !== 'milestone');

  it('prefers server totals and derives streak, benchmarks and courses', () => {
    const state: CourseStateRow = {
      userId: 'u1',
      courseId: course.id,
      scale: 1,
      currentNodeIndex: course.nodes.length,
      completedNodeIds: scoredNodes.map((n) => n.id),
      updatedAt: '2026-09-01T00:00:00Z',
    };
    const stats = userStatsFromProgress({
      totals: { points: 4321, workouts: 40, minutes: 900 },
      sessions: [session('2026-09-03'), session('2026-09-02')],
      benchmarks: [
        {
          key: 'x',
          latest: bench('x', 1, 'reps', '2026-09-01T00:00:00Z'),
          history: [
            bench('x', 1, 'reps', '2026-09-01T00:00:00Z'),
            bench('x', 1, 'reps', '2026-08-01T00:00:00Z'),
          ],
        },
      ],
      courseStates: { [course.id]: state },
      todayIso: TODAY,
    });
    expect(stats).toEqual({
      workouts: 40,
      points: 4321,
      streakCurrent: 2,
      streakLongest: 2,
      benchmarksDone: 2,
      coursesCompleted: 1,
      totalMinutes: 900,
    });
    expect(isCourseCompleted({ ...state, completedNodeIds: [] })).toBe(false);
  });

  it('falls back to the loaded rows without totals', () => {
    const stats = userStatsFromProgress({
      totals: null,
      sessions: [session('2026-09-03', { points: 90, durationSec: 1500 })],
      benchmarks: [],
      courseStates: {},
      todayIso: TODAY,
    });
    expect(stats.workouts).toBe(1);
    expect(stats.points).toBe(90);
    expect(stats.totalMinutes).toBe(25);
    expect(totalCalories([session('2026-09-03'), session('2026-09-02', { calories: null })])).toBe(
      150,
    );
  });
});

describe('labels', () => {
  it('formats compact day/month per locale and the day of month', () => {
    expect(dayMonthLabel('ru', '2026-08-03')).toBe('03.08');
    expect(dayMonthLabel('en', '2026-08-03')).toBe('8/3');
    expect(dayOfMonthLabel('2026-08-03')).toBe('3');
    expect(dayOfMonthLabel('2026-08-27')).toBe('27');
  });
});
