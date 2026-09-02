/**
 * Pure derivations for the summary screen: per-block completion, test and benchmark results,
 * the share text and the duration handed to the engine.
 */
import type { ExerciseUnit } from '@/content/schema';
import { COURSE_BY_ID } from '@/content/registry';
import { formatClock, type Locale } from '@/i18n/index';
import { stepCompletion, stepWeightSec } from '@/lib/training/session';
import type {
  ExerciseResult,
  PlayerStep,
  PrescribedWorkout,
  SessionSummary,
} from '@/lib/training/types';
import type { PlayerResult } from '@/app/store/activeWorkout';
import { blockTitle, exerciseName, findBlock, type Translate } from './model';

export interface BlockCompletion {
  blockId: string;
  title: string;
  /** 0..1 */
  completion: number;
  /** Every scored step of the block was skipped or left undone. */
  skipped: boolean;
}

/** Weighted completion per block (same weights as the engine's session completion). */
export function blockCompletions(
  prescribed: PrescribedWorkout,
  steps: readonly PlayerStep[],
  results: readonly ExerciseResult[],
  t: Translate,
  locale: Locale,
): BlockCompletion[] {
  const byIndex = new Map<number, ExerciseResult>();
  for (const r of results) byIndex.set(r.stepIndex, r);
  return prescribed.blocks.map((block) => {
    let total = 0;
    let weighted = 0;
    let scored = 0;
    let attempted = 0;
    steps.forEach((step, i) => {
      if (!('blockId' in step) || step.blockId !== block.blockId) return;
      const w = stepWeightSec(step);
      if (w <= 0) return;
      scored++;
      total += w;
      const r = byIndex.get(i);
      if (r && !r.skipped) attempted++;
      weighted += w * stepCompletion(step, r);
    });
    const completion = total > 0 ? Math.min(1, weighted / total) : 0;
    return {
      blockId: block.blockId,
      title: blockTitle(t, locale, block),
      completion,
      skipped: scored > 0 && attempted === 0,
    };
  });
}

export interface TestResultView {
  exerciseId: string;
  name: string;
  value: number;
  unit: ExerciseUnit;
}

/** Measurements recorded on test-block steps, in workout order. */
export function testResults(
  prescribed: PrescribedWorkout,
  steps: readonly PlayerStep[],
  results: readonly PlayerResult[],
  locale: Locale,
): TestResultView[] {
  const out: TestResultView[] = [];
  for (const r of [...results].sort((a, b) => a.stepIndex - b.stepIndex)) {
    if (r.testValue === undefined || !r.testUnit || !r.exerciseId) continue;
    const step = steps[r.stepIndex];
    if (!step || step.kind !== 'work') continue;
    if (findBlock(prescribed, step.blockId)?.type !== 'test') continue;
    out.push({
      exerciseId: r.exerciseId,
      name: exerciseName(r.exerciseId, locale),
      value: r.testValue,
      unit: r.testUnit,
    });
  }
  return out;
}

export type BenchmarkView =
  | { kind: 'amrap'; rounds: number; extraReps: number; repsPerRound: number }
  | { kind: 'fortime'; timeSec: number; completed: boolean; capSec: number };

/** Score of the workout's AMRAP / For-time step (the first one), when it was recorded. */
export function benchmarkResult(
  steps: readonly PlayerStep[],
  results: readonly ExerciseResult[],
): BenchmarkView | null {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    if (step.kind !== 'amrap' && step.kind !== 'fortime') continue;
    const r = results.find((x) => x.stepIndex === i);
    if (!r || r.skipped) return null;
    if (step.kind === 'amrap') {
      if (r.rounds === undefined) return null;
      const repsPerRound = step.items.reduce((n, it) => n + it.target, 0);
      return { kind: 'amrap', rounds: r.rounds, extraReps: r.extraReps ?? 0, repsPerRound };
    }
    if (r.timeSec === undefined) return null;
    return { kind: 'fortime', timeSec: r.timeSec, completed: r.completed, capSec: step.capSec };
  }
  return null;
}

/** Value stored as a personal record for a benchmark node, or null when there is no clean score. */
export function benchmarkRecord(view: BenchmarkView): { value: number; unit: string } | null {
  switch (view.kind) {
    case 'amrap': {
      const partial = view.repsPerRound > 0 ? view.extraReps / view.repsPerRound : 0;
      return { value: Math.round((view.rounds + partial) * 100) / 100, unit: 'rounds' };
    }
    case 'fortime':
      return view.completed ? { value: view.timeSec, unit: 'seconds' } : null;
  }
}

/**
 * The engine takes the real duration from `startedAt → completedAt`; a session paused overnight
 * would count the night. Handing it the active elapsed time keeps duration honest.
 */
export function elapsedStartedAt(completedAt: string, elapsedSec: number): string | undefined {
  if (!(elapsedSec > 0)) return undefined;
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(end)) return undefined;
  return new Date(end - elapsedSec * 1000).toISOString();
}

export function courseNames(
  courseId: string,
  nodeId: string,
  workoutId: string,
  locale: Locale,
): { course: string; node: string; workout: string } {
  const course = COURSE_BY_ID.get(courseId);
  const node = course?.nodes.find((n) => n.id === nodeId);
  const workout = course?.workouts.find((w) => w.id === workoutId);
  return {
    course: course ? course.name[locale] : courseId,
    node: node ? node.title[locale] : nodeId,
    workout: workout ? workout.name[locale] : workoutId,
  };
}

export function shareText(t: Translate, workout: string, summary: SessionSummary): string {
  return t('app.summaryShareText', {
    workout,
    time: formatClock(summary.durationSec),
    points: summary.points,
    kcal: summary.calories,
    completion: Math.round(summary.completion * 100),
  });
}
