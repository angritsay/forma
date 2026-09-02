/**
 * Onboarding assessment: fitness index (0..100), training level and the initial course scale.
 * Reference tables and reasoning: docs/TRAINING_SCIENCE.md §2.
 */
import type { Level } from '@/content/schema';
import {
  ACTIVITY_SCORE,
  AGE_BAND_NORM_BANDS,
  EXPERIENCE_SCORE,
  FITNESS_WEIGHTS,
  KNEE_PUSHUP_FACTOR,
  LEVEL_TIER,
  NO_TEST_INDEX_CAP,
  PLANK_ANCHORS,
  PUSHUP_CATEGORY_SCORES,
  PUSHUP_NORMS,
  SCALE_INITIAL_MAX,
  SCALE_INITIAL_MIN,
  SQUAT_AGE_SHIFT_PER_BAND,
  SQUAT_ANCHORS,
  SQUAT_BAND_SHIFT,
} from './constants';
import type { AgeBand, FitnessAssessment, FitnessComponent, UserTrainingProfile } from './types';
import { clamp, num, piecewiseLinear, round2 } from './util';

const COMPONENTS: readonly FitnessComponent[] = [
  'pushups',
  'squats',
  'plank',
  'activity',
  'experience',
];
const SELF_TESTS: readonly FitnessComponent[] = ['pushups', 'squats', 'plank'];

/** [fair, good, very good, excellent] minimums for a Forma age band (mean of the norm bands). */
export function pushupAnchors(
  sex: 'male' | 'female',
  ageBand: AgeBand,
): [number, number, number, number] {
  const bands = AGE_BAND_NORM_BANDS[ageBand];
  const acc: [number, number, number, number] = [0, 0, 0, 0];
  for (const band of bands) {
    const row = PUSHUP_NORMS[sex][band];
    for (let i = 0; i < 4; i++) acc[i] = (acc[i] ?? 0) + (row[i] ?? 0);
  }
  return acc.map((v) => v / bands.length) as [number, number, number, number];
}

/** Score 0..100 for a push-up count against one sex table. */
function pushupScoreFor(sex: 'male' | 'female', ageBand: AgeBand, reps: number): number {
  const anchors = pushupAnchors(sex, ageBand);
  const points: (readonly [number, number])[] = [[0, 0]];
  anchors.forEach((minReps, i) => points.push([minReps, PUSHUP_CATEGORY_SCORES[i] ?? 100]));
  return piecewiseLinear(points, reps);
}

/**
 * Push-up component. Men are scored on full push-ups, women on modified (knee) push-ups, so a
 * result is converted to the table's modality with KNEE_PUSHUP_FACTOR (knee ≈ 0.6 × full).
 * Sex `na` averages the two tables.
 */
export function pushupScore(profile: UserTrainingProfile): number | undefined {
  const raw = profile.tests.pushups;
  if (raw === undefined || raw === null) return undefined;
  const reps = Math.max(0, num(raw));
  const onKnees = profile.tests.pushupsOnKnees === true;
  const fullEquivalent = onKnees ? reps * KNEE_PUSHUP_FACTOR : reps;
  const kneeEquivalent = onKnees ? reps : reps / KNEE_PUSHUP_FACTOR;
  const male = pushupScoreFor('male', profile.ageBand, fullEquivalent);
  const female = pushupScoreFor('female', profile.ageBand, kneeEquivalent);
  switch (profile.sex) {
    case 'male':
      return male;
    case 'female':
      return female;
    case 'na':
      return (male + female) / 2;
  }
}

/** Squats-in-60-s component: expert anchors shifted down 5% per age band above 25–34. */
export function squatScore(profile: UserTrainingProfile): number | undefined {
  const raw = profile.tests.squats60s;
  if (raw === undefined || raw === null) return undefined;
  const reps = Math.max(0, num(raw));
  const factor = 1 - SQUAT_AGE_SHIFT_PER_BAND * SQUAT_BAND_SHIFT[profile.ageBand];
  const anchors = SQUAT_ANCHORS.map(([r, s]) => [r * factor, s] as const);
  return piecewiseLinear(anchors, reps);
}

/** Plank component (seconds held). */
export function plankScore(profile: UserTrainingProfile): number | undefined {
  const raw = profile.tests.plankSec;
  if (raw === undefined || raw === null) return undefined;
  return piecewiseLinear(PLANK_ANCHORS, Math.max(0, num(raw)));
}

export function levelForIndex(index: number): Level {
  if (index >= LEVEL_TIER.level3From) return 3;
  if (index >= LEVEL_TIER.level2From) return 2;
  return 1;
}

/**
 * Weighted fitness index. Missing self-tests are excluded from the weighted mean (their
 * component value is imputed from the rest) and, when no self-test exists at all, the index is
 * capped at NO_TEST_INDEX_CAP because activity and experience are self-reported.
 */
export function computeFitnessIndex(profile: UserTrainingProfile): FitnessAssessment {
  const measured: Partial<Record<FitnessComponent, number>> = {
    pushups: pushupScore(profile),
    squats: squatScore(profile),
    plank: plankScore(profile),
    activity: ACTIVITY_SCORE[profile.activityLevel],
    experience: EXPERIENCE_SCORE[profile.experience],
  };

  let weighted = 0;
  let weightSum = 0;
  const missing: FitnessComponent[] = [];
  for (const c of COMPONENTS) {
    const v = measured[c];
    if (v === undefined) {
      missing.push(c);
      continue;
    }
    weighted += clamp(v, 0, 100) * FITNESS_WEIGHTS[c];
    weightSum += FITNESS_WEIGHTS[c];
  }
  const mean = weightSum > 0 ? weighted / weightSum : 0;
  const testedAny = SELF_TESTS.some((c) => !missing.includes(c));
  const index = Math.round(clamp(testedAny ? mean : Math.min(mean, NO_TEST_INDEX_CAP), 0, 100));

  const components = {} as Record<FitnessComponent, number>;
  for (const c of COMPONENTS) {
    const v = measured[c];
    components[c] = Math.round(clamp(v ?? mean, 0, 100));
  }

  return { index, level: levelForIndex(index), components, missing };
}

/** Initial course scale: 0.6 at index 0 → 1.3 at index 100, two decimals. */
export function initialScale(index: number): number {
  const i = clamp(num(index), 0, 100);
  return round2(SCALE_INITIAL_MIN + (SCALE_INITIAL_MAX - SCALE_INITIAL_MIN) * (i / 100));
}
