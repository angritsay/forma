/**
 * Pure derivations for the summary screen: per-block completion, test and benchmark results,
 * the share text and the duration handed to the engine.
 */
import type { ExerciseUnit } from '@/content/schema';
import { findCourse } from '@/content/catalogue';
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
  | {
      kind: 'amrap';
      rounds: number;
      extraReps: number;
      repsPerRound: number;
      /** One movement, max reps: the score is the total reps, not rounds. */
      maxReps?: boolean;
    }
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
      const view: BenchmarkView = {
        kind: 'amrap',
        rounds: r.rounds,
        extraReps: r.extraReps ?? 0,
        repsPerRound,
      };
      if (step.maxReps) view.maxReps = true;
      return view;
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
      if (view.maxReps)
        return { value: view.rounds * view.repsPerRound + view.extraReps, unit: 'reps' };
      const partial = view.repsPerRound > 0 ? view.extraReps / view.repsPerRound : 0;
      return { value: Math.round((view.rounds + partial) * 100) / 100, unit: 'rounds' };
    }
    case 'fortime':
      return view.completed ? { value: view.timeSec, unit: 'seconds' } : null;
  }
}

/**
 * Repetitions actually done, summed over the whole session — the middle figure of «Готово!».
 *
 * Only steps counted in reps: a rep-mode work step contributes what was achieved (or its target
 * when the step was completed without a count being entered), an AMRAP contributes its rounds
 * times the reps of one round plus the extra reps, a For-time its rounds times the reps of one
 * round when finished. Timed holds, test measurements in seconds and rests are not repetitions
 * and add nothing; a skipped step adds nothing.
 *
 * Null when the session has no rep-counted work at all (a plank test, a stretching day), so the
 * screen can put a different figure in that slot rather than print a zero for having planked.
 */
export function totalReps(
  steps: readonly PlayerStep[],
  results: readonly ExerciseResult[],
): number | null {
  const byIndex = new Map<number, ExerciseResult>();
  for (const r of results) byIndex.set(r.stepIndex, r);
  let counted = false;
  let total = 0;
  steps.forEach((step, i) => {
    const r = byIndex.get(i);
    if (step.kind === 'work') {
      if (step.mode !== 'reps' || step.item.unit !== 'reps') return;
      counted = true;
      if (!r || r.skipped || !r.completed) return;
      total += r.achieved ?? step.target;
      return;
    }
    if (step.kind === 'amrap' || step.kind === 'fortime') {
      const perRound = step.items.reduce((n, it) => n + (it.unit === 'reps' ? it.target : 0), 0);
      if (perRound === 0) return;
      counted = true;
      if (!r || r.skipped) return;
      if (step.kind === 'amrap') total += (r.rounds ?? 0) * perRound + (r.extraReps ?? 0);
      else if (r.completed) total += step.rounds * perRound;
    }
  });
  return counted ? Math.round(total) : null;
}

/**
 * The one warm line under «Готово!»: which workout this is.
 *
 * It said «Четвёртый день подряд» and now says «Четвёртая тренировка», and that is the whole of
 * the change: the ordinal is still a word rather than a figure — at this size a figure would
 * compete with the three under it — words are still kept for the second to the tenth, and from the
 * eleventh it falls back to «Тренировка №11», which is still one line and still true.
 *
 * What it counts is what changed. A day in a row is a claim about the calendar, and the calendar
 * says this course has two rest days a week in it, so the line congratulated people for ignoring
 * the plan and went quiet for everybody who followed it. A count of workouts can only go up.
 *
 * Nothing here guesses: with nothing to report (the store not loaded, or the number 0) the caller
 * passes nothing and no line is drawn.
 */
export function workoutCountLine(t: Translate, n: number): string | null {
  if (!Number.isFinite(n) || n < 1) return null;
  if (n === 1) return t('app.summaryCountFirst');
  const ordinals = t('app.summaryOrdinals').split('|');
  const word = ordinals[n - 2];
  return word ? t('app.summaryCountWord', { ordinal: word }) : t('app.summaryCountNum', { n });
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
  // A custom (coach-built) workout is not in the catalogue; give it a readable label.
  if (courseId === 'custom') {
    const ru = locale === 'ru';
    return {
      course: ru ? 'Своя тренировка' : 'Custom workout',
      node: '',
      workout: ru ? 'Тренировка от тренера' : 'Coach workout',
    };
  }
  const course = findCourse(courseId);
  const node = course?.nodes.find((n) => n.id === nodeId);
  const workout = course?.workouts.find((w) => w.id === workoutId);
  return {
    course: course ? course.name[locale] : courseId,
    node: node ? node.title[locale] : nodeId,
    workout: workout ? workout.name[locale] : workoutId,
  };
}

export function shareText(t: Translate, workout: string, summary: SessionSummary): string {
  /*
   * Без очков — когда их нет. Выданная тренером тренировка их больше не приносит
   * (`customWorkoutPoints`), и «0 очков» в строке, которой хвастаются, читается как поломка, а не
   * как правило. Убираем сам пункт: время, калории и процент выполнения никуда не делись.
   */
  if (!(summary.points > 0)) {
    return t('app.summaryShareTextNoPoints', {
      workout,
      time: formatClock(summary.durationSec),
      kcal: summary.calories,
      completion: Math.round(summary.completion * 100),
    });
  }
  return t('app.summaryShareText', {
    workout,
    time: formatClock(summary.durationSec),
    points: summary.points,
    kcal: summary.calories,
    completion: Math.round(summary.completion * 100),
  });
}
