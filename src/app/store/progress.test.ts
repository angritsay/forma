import { describe, expect, it } from 'vitest';
import type { CourseStateRow, WorkoutSessionRow } from '@/lib/api/types';
import {
  engineCourseState,
  resolveActiveCourseId,
  selectStreak,
  sessionToSummary,
  startingScale,
} from './progress';

function stateRow(courseId: string, updatedAt: string): CourseStateRow {
  return {
    userId: 'u',
    courseId,
    scale: 1.1,
    currentNodeIndex: 3,
    completedNodeIds: ['a'],
    updatedAt,
  };
}

function session(partial: Partial<WorkoutSessionRow>): WorkoutSessionRow {
  return {
    id: 's1',
    userId: 'u',
    courseId: 'start',
    nodeId: 'n',
    workoutId: 'w',
    difficulty: 'harder',
    scale: 1.1,
    prescribed: null,
    results: null,
    rpe: 7,
    feeling: 'great',
    completion: 0.96,
    points: 125,
    durationSec: 1300,
    calories: 160,
    startedAt: '2026-09-01T10:00:00.000Z',
    completedAt: '2026-09-01T10:22:00.000Z',
    localDate: '2026-09-01',
    ...partial,
  };
}

describe('resolveActiveCourseId', () => {
  it('keeps the persisted preference when it is owned', () => {
    expect(resolveActiveCourseId('engine', {}, ['start', 'engine'])).toBe('engine');
  });
  it('ignores a preference the user does not own or that is not a course', () => {
    expect(resolveActiveCourseId('engine', {}, ['start'])).toBe('start');
    expect(resolveActiveCourseId('nope', {}, ['start'])).toBe('start');
  });
  it('prefers the most recently updated owned course, then catalogue order', () => {
    const states = {
      start: stateRow('start', '2026-08-01T00:00:00Z'),
      engine: stateRow('engine', '2026-09-01T00:00:00Z'),
    };
    expect(resolveActiveCourseId(null, states, ['start', 'engine'])).toBe('engine');
    expect(resolveActiveCourseId(null, {}, ['engine', 'start'])).toBe('start');
  });
  it('is null without owned courses', () => {
    expect(resolveActiveCourseId('start', {}, [])).toBeNull();
  });
});

describe('sessionToSummary / engineCourseState', () => {
  it('maps a completed row and skips unfinished ones', () => {
    const s = sessionToSummary(session({}));
    expect(s).toMatchObject({
      sessionId: 's1',
      choice: 'harder',
      scale: 1.1,
      completion: 0.96,
      rpe: 7,
      feeling: 'great',
      points: 125,
      completedAt: '2026-09-01T10:22:00.000Z',
    });
    expect(sessionToSummary(session({ completedAt: null }))).toBeNull();
  });
  it('builds the engine state for one course with ascending history', () => {
    const rows = [
      session({ id: 'b', completedAt: '2026-09-02T10:00:00.000Z', localDate: '2026-09-02' }),
      session({ id: 'a' }),
      session({ id: 'other', courseId: 'engine' }),
    ];
    const state = engineCourseState({ start: stateRow('start', 'x') }, rows, 'start', 0.8);
    expect(state.scale).toBe(1.1);
    expect(state.completedNodeIds).toEqual(['a']);
    expect(state.history.map((h) => h.sessionId)).toEqual(['a', 'b']);
    const fresh = engineCourseState({}, rows, 'kettlebell', 0.8);
    expect(fresh).toEqual({ scale: 0.8, history: [], completedNodeIds: [] });
  });
});

describe('selectStreak', () => {
  it('counts workout days and step-goal days', () => {
    const logs = {
      '2026-08-31': {
        userId: 'u',
        localDate: '2026-08-31',
        steps: 7500,
        points: 30,
        note: null,
        updatedAt: '',
      },
    };
    const streak = selectStreak([session({})], logs, '2026-09-02');
    expect(streak.current).toBe(2);
    expect(streak.atRisk).toBe(true);
  });
});

describe('startingScale', () => {
  it('maps the fitness index through initialScale and is conservative when unknown', () => {
    expect(startingScale(null)).toBe(0.6);
    expect(startingScale({ fitnessIndex: 100, trainingProfile: null } as never)).toBe(1.3);
  });
});
