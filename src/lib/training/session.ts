/**
 * After a session: completion, points, duration, calories; scale adaptation (autoregulation);
 * and the pre-workout difficulty recommendation. Rules: docs/TRAINING_SCIENCE.md §7.
 */
import { hoursSince } from '@/lib/util/dates';
import { ADAPTATION, FORTIME_PACE_FACTOR, RECOMMENDATION, SCALE_MAX, SCALE_MIN } from './constants';
import { estimateCalories, registryLookup } from './estimate';
import { ADAPT_REASON, RECOMMEND_REASON, SAFETY_NOTE } from './messages';
import { buildPlayerSteps } from './player';
import type {
  CourseState,
  ExerciseResult,
  PlayerStep,
  PrescribedWorkout,
  Recommendation,
  RecommendationContext,
  ScaleAdjustment,
  SessionFeedback,
  SessionSummary,
  SummarizeOptions,
  UserTrainingProfile,
} from './types';
import { clamp, num, round2, sum } from './util';

/* ---------------------------------------------------------------------------------------------
 * Completion
 * ------------------------------------------------------------------------------------------- */

/** Estimated seconds of a work-type step: its weight in the completion ratio. */
export function stepWeightSec(step: PlayerStep): number {
  switch (step.kind) {
    case 'work':
      return step.mode === 'timer'
        ? num(step.durationSec, step.item.estimatedSec)
        : step.item.estimatedSec;
    case 'amrap':
      return step.durationSec;
    case 'fortime': {
      const est = step.rounds * sum(step.items.map((it) => it.estimatedSec)) * FORTIME_PACE_FACTOR;
      return Math.min(step.capSec > 0 ? step.capSec : est, est);
    }
    case 'block_intro':
    case 'explain':
    case 'rest':
    case 'done':
      return 0;
  }
}

/**
 * Completion share (0..1) of one work-type step given its result.
 * Timer-mode work steps expect `achieved` in seconds; reps-mode in reps. Marking a step
 * `completed` without `achieved` counts as fully done.
 */
export function stepCompletion(step: PlayerStep, result: ExerciseResult | undefined): number {
  if (!result || result.skipped) return 0;
  switch (step.kind) {
    case 'work': {
      if (result.achieved === undefined) return result.completed ? 1 : 0;
      const denom = step.mode === 'timer' ? num(step.durationSec, step.target) : step.target;
      if (denom <= 0) return result.completed ? 1 : 0;
      return clamp(num(result.achieved) / denom, 0, 1);
    }
    case 'amrap': {
      if (result.rounds === undefined) return result.completed ? 1 : 0;
      const repsPerRound = sum(step.items.map((it) => it.target));
      const partial = repsPerRound > 0 ? num(result.extraReps) / repsPerRound : 0;
      const expected = Math.max(1, step.expectedRounds);
      return clamp((num(result.rounds) + partial) / expected, 0, 1);
    }
    case 'fortime': {
      if (result.completed) return 1;
      if (result.timeSec === undefined || step.capSec <= 0) return 0;
      return clamp(num(result.timeSec) / step.capSec, 0, 1) * 0.5;
    }
    case 'block_intro':
    case 'explain':
    case 'rest':
    case 'done':
      return 0;
  }
}

/** Completion of the whole session, weighted by each work step's estimated seconds. */
export function computeCompletion(
  steps: readonly PlayerStep[],
  results: readonly ExerciseResult[],
): number {
  const byIndex = new Map<number, ExerciseResult>();
  for (const r of results) byIndex.set(r.stepIndex, r);
  let weighted = 0;
  let total = 0;
  steps.forEach((step, i) => {
    const w = stepWeightSec(step);
    if (w <= 0) return;
    total += w;
    weighted += w * stepCompletion(step, byIndex.get(i));
  });
  if (total <= 0) return 0;
  return round2(clamp(weighted / total, 0, 1));
}

/* ---------------------------------------------------------------------------------------------
 * Summary
 * ------------------------------------------------------------------------------------------- */

export function summarizeSession(
  p: PrescribedWorkout,
  results: ExerciseResult[],
  feedback: SessionFeedback,
  opts: SummarizeOptions,
): SessionSummary {
  const steps = opts.steps ?? buildPlayerSteps(p);
  const completion = computeCompletion(steps, results);
  const points =
    completion >= ADAPTATION.fullCompletion ? p.points : Math.round(p.points * completion);

  let durationSec: number;
  if (opts.startedAt) {
    const real = Math.round(hoursSince(opts.startedAt, opts.completedAt) * 3600);
    durationSec =
      Number.isFinite(real) && real > 0 ? real : Math.round(p.estimatedSec * completion);
  } else {
    durationSec = Math.round(p.estimatedSec * completion);
  }

  const lookup = opts.exerciseLookup ?? registryLookup;
  const calories = Math.round(estimateCalories(p, opts.weightKg, lookup) * completion);

  const summary: SessionSummary = {
    courseId: opts.courseId,
    nodeId: opts.nodeId,
    workoutId: p.workoutId,
    choice: p.choice,
    scale: p.scale,
    completion,
    rpe: clamp(Math.round(num(feedback.rpe, 5)), 1, 10),
    feeling: feedback.feeling,
    points,
    durationSec,
    calories,
    completedAt: opts.completedAt,
  };
  if (opts.sessionId) summary.sessionId = opts.sessionId;
  return summary;
}

/* ---------------------------------------------------------------------------------------------
 * Adaptation
 * ------------------------------------------------------------------------------------------- */

/** Scale delta for a session before clamping (the SPEC §7 adaptation table). */
export function adaptationDelta(summary: Pick<SessionSummary, 'rpe' | 'completion' | 'feeling'>): {
  delta: number;
  reason: keyof typeof ADAPT_REASON;
} {
  const rpe = num(summary.rpe);
  const completion = num(summary.completion);
  if (summary.feeling === 'pain') return { delta: ADAPTATION.painDelta, reason: 'pain' };
  if (rpe >= ADAPTATION.hardRpe || completion < ADAPTATION.lowCompletion)
    return { delta: ADAPTATION.hardDelta, reason: 'down5' };
  if (completion >= ADAPTATION.fullCompletion && rpe <= ADAPTATION.easyRpe)
    return { delta: ADAPTATION.easyDelta, reason: 'up5' };
  if (
    rpe > ADAPTATION.easyRpe &&
    rpe <= ADAPTATION.moderateRpeMax &&
    completion >= ADAPTATION.goodCompletion
  )
    return { delta: ADAPTATION.moderateDelta, reason: 'up2' };
  return { delta: 0, reason: 'keep' };
}

export function adaptScale(state: CourseState, summary: SessionSummary): ScaleAdjustment {
  const current = clamp(num(state.scale, 1), SCALE_MIN, SCALE_MAX);
  const { delta: wanted, reason } = adaptationDelta(summary);
  const scale = round2(clamp(current + wanted, SCALE_MIN, SCALE_MAX));
  const delta = round2(scale - current);

  let text = ADAPT_REASON[reason];
  if (wanted > 0 && delta === 0) text = ADAPT_REASON.atMax;
  if (wanted < 0 && delta === 0 && summary.feeling !== 'pain') text = ADAPT_REASON.atMin;

  const out: ScaleAdjustment = { scale, delta, reason: text };
  if (summary.feeling === 'pain') out.safetyNote = SAFETY_NOTE;
  return out;
}

/* ---------------------------------------------------------------------------------------------
 * Recommendation
 * ------------------------------------------------------------------------------------------- */

function sortedHistory(state: CourseState): SessionSummary[] {
  return [...(state.history ?? [])].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function isEasyAndComplete(s: SessionSummary): boolean {
  return num(s.rpe) <= ADAPTATION.easyRpe && num(s.completion) >= ADAPTATION.fullCompletion;
}

export function recommendDifficulty(
  state: CourseState,
  profile: UserTrainingProfile,
  nowIso: string,
  context: RecommendationContext = {},
): Recommendation {
  if (profile.limitations?.includes('pregnancy'))
    return { choice: 'easier', reason: RECOMMEND_REASON.pregnancy };

  const history = sortedHistory(state);
  const last = history[history.length - 1];
  if (!last) return { choice: 'normal', reason: RECOMMEND_REASON.firstSession };

  const hours = hoursSince(last.completedAt, nowIso);
  const stepsYesterday = num(context.stepsYesterday);

  if (last.feeling === 'pain') return { choice: 'easier', reason: RECOMMEND_REASON.pain };
  if (num(last.rpe) >= ADAPTATION.hardRpe)
    return { choice: 'easier', reason: RECOMMEND_REASON.highRpe };
  if (num(last.completion) < ADAPTATION.lowCompletion)
    return { choice: 'easier', reason: RECOMMEND_REASON.lowCompletion };
  if (Number.isFinite(hours) && hours < RECOMMENDATION.easierMaxHours)
    return { choice: 'easier', reason: RECOMMEND_REASON.tooSoon };
  if (stepsYesterday >= RECOMMENDATION.heavyStepsYesterday)
    return { choice: 'easier', reason: RECOMMEND_REASON.heavySteps };

  const recent = history.slice(-RECOMMENDATION.easySessionsForHarder);
  if (
    recent.length >= RECOMMENDATION.easySessionsForHarder &&
    recent.every(isEasyAndComplete) &&
    Number.isFinite(hours) &&
    hours >= RECOMMENDATION.harderMinHours
  ) {
    return { choice: 'harder', reason: RECOMMEND_REASON.ready };
  }

  return { choice: 'normal', reason: RECOMMEND_REASON.normal };
}
