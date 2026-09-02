import { describe, expect, it } from 'vitest';
import {
  asFitnessLevel,
  asLocale,
  benchmarkFromDb,
  completeSessionToDb,
  courseStateFromDb,
  courseStatePatchToDb,
  dailyLogFromDb,
  entitlementFromDb,
  groupBenchmarks,
  leaderboardRowFromDb,
  parseStorageRef,
  profileFromDb,
  profilePatchToDb,
  purchaseFromDb,
  sessionFromDb,
  startSessionToDb,
  toNumber,
  totalsFromDb,
  type DbProfile,
  type DbWorkoutSession,
} from './mappers';
import type { PrescribedWorkout } from '@/lib/training/types';

const profileRow: DbProfile = {
  id: '11111111-2222-3333-4444-555555555555',
  email: 'Ann@Example.com',
  display_name: 'Ann',
  avatar_seed: 'a1b2c3d4',
  locale: 'en',
  training_profile: { ageBand: '25-34', sex: 'female' },
  fitness_index: '42',
  fitness_level: 2,
  onboarded_at: '2026-09-01T10:00:00+00:00',
  created_at: '2026-08-30T10:00:00+00:00',
  updated_at: '2026-09-01T10:00:00+00:00',
};

describe('primitives', () => {
  it('toNumber accepts numbers and numeric strings, rejects garbage', () => {
    expect(toNumber(3)).toBe(3);
    expect(toNumber('1.25')).toBe(1.25);
    expect(toNumber('')).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber('abc')).toBeNull();
  });

  it('asLocale / asFitnessLevel normalize unknown values', () => {
    expect(asLocale('en')).toBe('en');
    expect(asLocale('de')).toBe('ru');
    expect(asLocale(null)).toBe('ru');
    expect(asFitnessLevel('3')).toBe(3);
    expect(asFitnessLevel(4)).toBeNull();
    expect(asFitnessLevel(null)).toBeNull();
  });
});

describe('profiles', () => {
  it('maps a row to camelCase and narrows enums', () => {
    const p = profileFromDb(profileRow);
    expect(p).toMatchObject({
      id: profileRow.id,
      email: 'Ann@Example.com',
      displayName: 'Ann',
      avatarSeed: 'a1b2c3d4',
      locale: 'en',
      fitnessIndex: 42,
      fitnessLevel: 2,
      onboardedAt: profileRow.onboarded_at,
    });
    expect(p.trainingProfile).toEqual({ ageBand: '25-34', sex: 'female' });
  });

  it('falls back safely on bad enum / json values', () => {
    const p = profileFromDb({
      ...profileRow,
      locale: 'xx',
      fitness_level: 9,
      training_profile: 'not-an-object',
      display_name: null,
    });
    expect(p.locale).toBe('ru');
    expect(p.fitnessLevel).toBeNull();
    expect(p.trainingProfile).toBeNull();
    expect(p.displayName).toBeNull();
  });

  it('profilePatchToDb keeps null (clear) and drops undefined (untouched)', () => {
    expect(profilePatchToDb({ displayName: null, locale: 'en' })).toEqual({
      display_name: null,
      locale: 'en',
    });
    expect(profilePatchToDb({})).toEqual({});
    expect(profilePatchToDb({ fitnessIndex: 55, fitnessLevel: 2, onboardedAt: 'x' })).toEqual({
      fitness_index: 55,
      fitness_level: 2,
      onboarded_at: 'x',
    });
    // never leaks id / email
    expect(Object.keys(profilePatchToDb({ avatarSeed: 's' }))).toEqual(['avatar_seed']);
  });
});

describe('purchases / entitlements', () => {
  it('maps entitlement and purchase rows', () => {
    expect(entitlementFromDb({ course_id: 'start', activated_at: null })).toEqual({
      courseId: 'start',
      activatedAt: null,
    });
    const p = purchaseFromDb({
      id: 'p1',
      email: 'a@b.co',
      course_id: 'start',
      status: 'weird',
      source: null,
      locale: 'ru',
      note: null,
      created_at: 'c',
      activated_at: null,
      updated_at: 'u',
    });
    expect(p.status).toBe('pending');
    expect(p.courseId).toBe('start');
  });
});

describe('course state', () => {
  it('parses numeric strings and null arrays', () => {
    const s = courseStateFromDb({
      user_id: 'u',
      course_id: 'start',
      scale: '1.05',
      current_node_index: '3',
      completed_node_ids: null,
      updated_at: 't',
    });
    expect(s).toEqual({
      userId: 'u',
      courseId: 'start',
      scale: 1.05,
      currentNodeIndex: 3,
      completedNodeIds: [],
      updatedAt: 't',
    });
  });

  it('patch → db keeps only provided keys', () => {
    expect(courseStatePatchToDb({ completedNodeIds: ['n1'] })).toEqual({
      completed_node_ids: ['n1'],
    });
    expect(courseStatePatchToDb({ scale: 1.1, currentNodeIndex: 2 })).toEqual({
      scale: 1.1,
      current_node_index: 2,
    });
  });
});

describe('sessions', () => {
  const prescribed: PrescribedWorkout = {
    workoutId: 'w1',
    choice: 'normal',
    scale: 1,
    effectiveScale: 1,
    deload: false,
    blocks: [],
    estimatedSec: 600,
    points: 100,
  };
  const row: DbWorkoutSession = {
    id: 's1',
    user_id: 'u',
    course_id: 'start',
    node_id: 'n1',
    workout_id: 'w1',
    difficulty: 'harder',
    scale: '1.10',
    prescribed,
    results: [{ stepIndex: 0, blockId: 'b', completed: true }],
    rpe: 7,
    feeling: 'ok',
    completion: '0.950',
    points: '125',
    duration_sec: 610,
    calories: 88,
    started_at: 'a',
    completed_at: 'b',
    local_date: '2026-09-02',
  };

  it('maps a completed session', () => {
    const s = sessionFromDb(row);
    expect(s.difficulty).toBe('harder');
    expect(s.scale).toBe(1.1);
    expect(s.completion).toBe(0.95);
    expect(s.points).toBe(125);
    expect(s.prescribed?.workoutId).toBe('w1');
    expect(s.results?.[0]?.completed).toBe(true);
    expect(s.feeling).toBe('ok');
    expect(s.localDate).toBe('2026-09-02');
  });

  it('maps an unfinished session with nulls', () => {
    const s = sessionFromDb({
      ...row,
      difficulty: 'bogus',
      results: null,
      rpe: null,
      feeling: null,
      completion: null,
      points: null,
      completed_at: null,
    });
    expect(s.difficulty).toBeNull();
    expect(s.results).toBeNull();
    expect(s.rpe).toBeNull();
    expect(s.points).toBe(0);
    expect(s.completedAt).toBeNull();
  });

  it('builds insert / update payloads in snake_case', () => {
    expect(
      startSessionToDb('u', {
        courseId: 'start',
        nodeId: 'n1',
        workoutId: 'w1',
        difficulty: 'easier',
        scale: 0.9,
        prescribed,
        localDate: '2026-09-02',
      }),
    ).toEqual({
      user_id: 'u',
      course_id: 'start',
      node_id: 'n1',
      workout_id: 'w1',
      difficulty: 'easier',
      scale: 0.9,
      prescribed,
      local_date: '2026-09-02',
    });
    expect(
      completeSessionToDb({
        results: [],
        rpe: 6,
        feeling: 'great',
        completion: 1,
        points: 100,
        durationSec: 600,
        calories: 80,
        completedAt: 'z',
      }),
    ).toEqual({
      results: [],
      rpe: 6,
      feeling: 'great',
      completion: 1,
      points: 100,
      duration_sec: 600,
      calories: 80,
      completed_at: 'z',
    });
  });
});

describe('daily logs / benchmarks', () => {
  it('maps a daily log', () => {
    expect(
      dailyLogFromDb({
        user_id: 'u',
        local_date: '2026-09-02',
        steps: '8200',
        points: 35,
        note: null,
        updated_at: 't',
      }),
    ).toEqual({
      userId: 'u',
      localDate: '2026-09-02',
      steps: 8200,
      points: 35,
      note: null,
      updatedAt: 't',
    });
  });

  it('groups benchmarks by key, most recent first', () => {
    const rows = [
      {
        id: '1',
        user_id: 'u',
        key: 'pushups',
        value: '20',
        unit: 'reps',
        recorded_at: '2026-08-01',
      },
      { id: '2', user_id: 'u', key: 'plank', value: 60, unit: 'sec', recorded_at: '2026-08-15' },
      { id: '3', user_id: 'u', key: 'pushups', value: 25, unit: 'reps', recorded_at: '2026-09-01' },
    ].map(benchmarkFromDb);
    const series = groupBenchmarks(rows);
    expect(series.map((s) => s.key)).toEqual(['pushups', 'plank']);
    const pushups = series[0];
    expect(pushups?.latest.value).toBe(25);
    expect(pushups?.history.map((h) => h.id)).toEqual(['3', '1']);
    expect(groupBenchmarks([])).toEqual([]);
  });
});

describe('leaderboard / totals', () => {
  it('maps a leaderboard row with fallbacks', () => {
    expect(
      leaderboardRowFromDb({
        user_id: 'abcdef12-0000',
        display_name: null,
        avatar_seed: null,
        points: '340',
        rank: '2',
        is_me: null,
      }),
    ).toEqual({
      userId: 'abcdef12-0000',
      displayName: 'Athlete abcd',
      avatarSeed: 'abcdef12',
      points: 340,
      rank: 2,
      isMe: false,
    });
  });

  it('maps totals', () => {
    expect(totalsFromDb({ points: '1200', workouts: 14, minutes: '410' })).toEqual({
      points: 1200,
      workouts: 14,
      minutes: 410,
    });
  });
});

describe('parseStorageRef', () => {
  it('parses storage refs and rejects others', () => {
    expect(parseStorageRef('storage:videos/start/air_squat.ru.mp4')).toEqual({
      bucket: 'videos',
      path: 'start/air_squat.ru.mp4',
    });
    expect(parseStorageRef('storage:videos//shared/x.mp4')).toEqual({
      bucket: 'videos',
      path: 'shared/x.mp4',
    });
    expect(parseStorageRef('https://cdn.example.com/a.mp4')).toBeNull();
    expect(parseStorageRef('storage:videos/')).toBeNull();
    expect(parseStorageRef('/local/path.mp4')).toBeNull();
  });
});
