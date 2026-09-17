import { describe, expect, it } from 'vitest';
import type { UserTrainingProfile } from '@/lib/training/types';
import { ASSESSMENT_MOVES } from '@content/site/assessment';
import {
  answersComplete,
  answersToTests,
  ASSESSMENT_AFTER_WORKOUTS,
  assessmentBenchmarks,
  assessmentTaken,
  emptyAnswers,
  parseIntField,
  shouldOfferAssessment,
  withAssessment,
  type AssessmentAnswers,
} from './model';

const PROFILE: UserTrainingProfile = {
  ageBand: '25-34',
  sex: 'female',
  activityLevel: 'light',
  experience: 'beginner',
  tests: {},
  limitations: [],
  equipment: ['none'],
};

function answered(): AssessmentAnswers {
  const counts: Record<string, number> = {};
  ASSESSMENT_MOVES.forEach((m, i) => (counts[m.exerciseId] = 10 + i));
  return { counts, onKnees: true };
}

/*
 * The rule the owner stated — «Мы тестирование через пару тренировок будем спрашивать» — is the
 * one thing in this feature that is not obvious from reading the screen, and it is the thing a
 * later change to the home screen is most likely to get subtly wrong. So it is pinned here rather
 * than left to a walkthrough.
 */
describe('shouldOfferAssessment', () => {
  const base = { completedWorkouts: ASSESSMENT_AFTER_WORKOUTS, taken: false, dismissed: false };

  it('waits for the second completed workout', () => {
    expect(shouldOfferAssessment({ ...base, completedWorkouts: 0 })).toBe(false);
    expect(shouldOfferAssessment({ ...base, completedWorkouts: 1 })).toBe(false);
    expect(shouldOfferAssessment(base)).toBe(true);
    expect(shouldOfferAssessment({ ...base, completedWorkouts: 40 })).toBe(true);
  });

  it('never asks twice: not once taken, not once waved away', () => {
    expect(shouldOfferAssessment({ ...base, taken: true })).toBe(false);
    expect(shouldOfferAssessment({ ...base, dismissed: true })).toBe(false);
  });

  it('is not fooled by a missing total', () => {
    expect(shouldOfferAssessment({ ...base, completedWorkouts: Number.NaN })).toBe(false);
  });
});

describe('assessmentTaken', () => {
  it('reads the counts rather than a flag of its own', () => {
    expect(assessmentTaken(null)).toBe(false);
    expect(assessmentTaken(PROFILE)).toBe(false);
    expect(assessmentTaken({ ...PROFILE, tests: { pushups: 12 } })).toBe(true);
    expect(assessmentTaken({ ...PROFILE, tests: { squats60s: 30 } })).toBe(true);
    // A plank alone is not the assessment: it is the one movement a benchmark node also records.
    expect(assessmentTaken({ ...PROFILE, tests: { plankSec: 60 } })).toBe(false);
  });
});

describe('answers', () => {
  it('is complete only when every movement has a number', () => {
    expect(answersComplete(emptyAnswers())).toBe(false);
    expect(answersComplete(answered())).toBe(true);
    const partial = answered();
    delete partial.counts[ASSESSMENT_MOVES[0]!.exerciseId];
    expect(answersComplete(partial)).toBe(false);
  });

  it('splits the counts into engine self-tests and personal records', () => {
    const tests = answersToTests(answered());
    const records = assessmentBenchmarks(answered());
    // Every movement lands in exactly one of the two (the content test guards `maps` xor `key`).
    const mapped = ASSESSMENT_MOVES.filter((m) => m.maps).length;
    expect(Object.keys(records).length + mapped).toBe(ASSESSMENT_MOVES.length);
    expect(tests.pushupsOnKnees).toBe(true);
    expect(tests.pushups).toBeGreaterThan(0);
  });

  it('merges into a profile without mutating it', () => {
    const next = withAssessment(PROFILE, answered());
    expect(next.tests.pushups).toBeGreaterThan(0);
    expect(PROFILE.tests).toEqual({});
    expect(assessmentTaken(next)).toBe(true);
  });
});

describe('parseIntField', () => {
  it('clamps, floors and rejects what is not a count', () => {
    expect(parseIntField('', 100)).toBeUndefined();
    expect(parseIntField('  ', 100)).toBeUndefined();
    expect(parseIntField('abc', 100)).toBeUndefined();
    expect(parseIntField('-3', 100)).toBeUndefined();
    expect(parseIntField('12.7', 100)).toBe(12);
    expect(parseIntField('999', 100)).toBe(100);
  });
});
