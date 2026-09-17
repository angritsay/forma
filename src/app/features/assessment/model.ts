/**
 * The self-test, as a thing the app asks for *after* training rather than before it.
 *
 * The owner's instruction: «особенно оттуда убрать тестирование. Мы тестирование через пару
 * тренировок будем спрашивать». Two completed workouts is the "пара" — by then the athlete has
 * done the movements under the coach's own cues, which is the difference between an estimate and
 * a guess, and they have a reason to care what the answer changes.
 *
 * Everything in this file is pure: no React, no storage, no clock. The banner and the screen read
 * it, and so does the unit test.
 */
import { ASSESSMENT_MOVES } from '@content/site/assessment';
import type { SelfTests, UserTrainingProfile } from '@/lib/training/types';

/** Completed workouts before the app asks. «Через пару тренировок», counted literally. */
export const ASSESSMENT_AFTER_WORKOUTS = 2;

/** The largest hold worth accepting, in seconds — a little past where `PLANK_ANCHORS` read 100. */
export const HOLD_MAX = 600;
/** The largest rep count worth accepting. */
export const REPS_MAX = 500;

/** What the athlete answered: a number per movement, plus whether the push-ups were on the knees. */
export interface AssessmentAnswers {
  /** Keyed by `AssessmentMove.exerciseId`, not by the profile field the number ends up in. */
  counts: Record<string, number>;
  /** Push-ups were done on the knees (the index scores the two modalities differently). */
  onKnees: boolean;
}

export function emptyAnswers(): AssessmentAnswers {
  return { counts: {}, onKnees: false };
}

/** Every movement has a number against it. */
export function answersComplete(a: AssessmentAnswers): boolean {
  return ASSESSMENT_MOVES.every((m) => a.counts[m.exerciseId] !== undefined);
}

/**
 * The assessment has been taken: the profile carries the counts the fitness index reads from it.
 *
 * The absence of the numbers *is* the state — it needs no flag of its own, and it stays true
 * across devices and reinstalls. `null` (no training profile at all) counts as not taken.
 */
export function assessmentTaken(profile: UserTrainingProfile | null | undefined): boolean {
  if (!profile) return false;
  return profile.tests.pushups !== undefined || profile.tests.squats60s !== undefined;
}

export interface AssessmentOfferInput {
  /** Workouts the athlete has finished. */
  completedWorkouts: number;
  /** The assessment has already been taken (see `assessmentTaken`). */
  taken: boolean;
  /** The banner was dismissed on this device (see `dismissal.ts`). */
  dismissed: boolean;
}

/**
 * Whether to show the banner offering the assessment.
 *
 * Three conditions and no fourth: two workouts done, not already taken, not waved away. It is
 * deliberately not time-based — an athlete who trains twice in a week and one who takes a month
 * over it have both earned the same question.
 */
export function shouldOfferAssessment(input: AssessmentOfferInput): boolean {
  return (
    Number.isFinite(input.completedWorkouts) &&
    input.completedWorkouts >= ASSESSMENT_AFTER_WORKOUTS &&
    !input.taken &&
    !input.dismissed
  );
}

/**
 * The counts that are personal records rather than engine inputs, as `key → reps`.
 *
 * The screen writes these to `benchmarks`, which is what makes the assessment a baseline the same
 * five movements can be measured against again rather than a one-off form.
 */
export function assessmentBenchmarks(a: AssessmentAnswers): Record<string, number> {
  const out: Record<string, number> = {};
  for (const move of ASSESSMENT_MOVES) {
    const reps = a.counts[move.exerciseId];
    if (move.benchmarkKey && reps !== undefined) out[move.benchmarkKey] = reps;
  }
  return out;
}

/**
 * The answers as the engine's self-tests.
 *
 * Which movement feeds which field is `content/site/assessment.ts`'s business and is resolved
 * here and only here, so editing the list of movements cannot orphan an answer.
 */
export function answersToTests(a: AssessmentAnswers): SelfTests {
  const tests: SelfTests = {};
  for (const move of ASSESSMENT_MOVES) {
    const measured = a.counts[move.exerciseId];
    if (measured === undefined || !move.maps) continue;
    switch (move.maps) {
      case 'pushups':
        tests.pushups = measured;
        tests.pushupsOnKnees = a.onKnees;
        break;
      case 'squats60s':
        tests.squats60s = measured;
        break;
      case 'plankSec':
        tests.plankSec = measured;
        break;
    }
  }
  return tests;
}

/** The training profile with the assessment's numbers in it (the input is left untouched). */
export function withAssessment(
  profile: UserTrainingProfile,
  a: AssessmentAnswers,
): UserTrainingProfile {
  return { ...profile, tests: { ...profile.tests, ...answersToTests(a) } };
}

/** Parse a numeric text field into an integer within bounds, or undefined when empty/invalid. */
export function parseIntField(value: string, max: number): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.min(max, Math.floor(n));
}
