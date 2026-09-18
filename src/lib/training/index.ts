/**
 * Training engine public API. See docs/SPEC.md §7 and docs/TRAINING_SCIENCE.md.
 *
 * Implementation modules (owned by the engine area):
 *   constants.ts   — multipliers, thresholds, reference tables
 *   assessment.ts  — computeFitnessIndex, initialScale
 *   prescribe.ts   — prescribeWorkout (+ substitutions, load selection)
 *   estimate.ts    — estimateDuration, estimateCalories, estimatePoints
 *   player.ts      — buildPlayerSteps
 *   session.ts     — summarizeSession, adaptScale, recommendDifficulty
 *   consistency.ts — countTraining
 *   levels.ts      — levelForPoints, ACHIEVEMENTS, evaluateAchievements
 */
export * from './types';
export * from './constants';
export * from './assessment';
export * from './prescribe';
export * from './estimate';
export * from './player';
export * from './session';
export * from './consistency';
export * from './levels';
