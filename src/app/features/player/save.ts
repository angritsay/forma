/**
 * Persist a finished session: complete the row, adapt and store the course state, record
 * benchmarks. Built as a resumable saver: a retry after a network error re-runs only the stages
 * that have not succeeded, so nothing is written twice and nothing is lost.
 */
import { COURSE_BY_ID } from '@/content/registry';
import { recordBenchmark } from '@/lib/api/benchmarks';
import { getCourseState, upsertCourseState } from '@/lib/api/courseState';
import { completeSession } from '@/lib/api/sessions';
import type { CourseStatePatch, CourseStateRow, WorkoutSessionRow } from '@/lib/api/types';
import { adaptScale, summarizeSession } from '@/lib/training/session';
import type {
  CourseState,
  PlayerStep,
  ScaleAdjustment,
  SessionFeedback,
  SessionSummary,
} from '@/lib/training/types';
import type { ActiveSession, PlayerResult } from '@/app/store/activeWorkout';
import { benchmarkRecord, benchmarkResult, elapsedStartedAt } from './summaryModel';

export interface SaveInput {
  session: ActiveSession;
  steps: PlayerStep[];
  results: PlayerResult[];
  feedback: SessionFeedback;
  completedAt: string;
  /** Active (unpaused) seconds from the player clock. */
  elapsedSec: number;
  weightKg?: number;
}

export interface SaveOutcome {
  summary: SessionSummary;
  adjustment: ScaleAdjustment;
  /** The completed `workout_sessions` row. */
  row: WorkoutSessionRow;
  /** The adapted `user_course_state` row. */
  courseState: CourseStateRow;
  /** Personal records written this time (test measurements, benchmark score). */
  benchmarksRecorded: number;
}

/** Build the session summary the same way the saver does (for the preview before feedback). */
export function buildSummary(input: SaveInput): SessionSummary {
  const { session } = input;
  const startedAt = elapsedStartedAt(input.completedAt, input.elapsedSec);
  return summarizeSession(session.prescribed, input.results, input.feedback, {
    courseId: session.courseId,
    nodeId: session.nodeId,
    sessionId: session.sessionId,
    completedAt: input.completedAt,
    steps: input.steps,
    ...(startedAt ? { startedAt } : {}),
    ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
  });
}

/** Benchmark records this session produces: test-block measurements and the benchmark-node score. */
function benchmarkEntries(input: SaveInput): { key: string; value: number; unit: string }[] {
  const { session, steps, results } = input;
  const entries: { key: string; value: number; unit: string }[] = [];
  const blockType = new Map(session.prescribed.blocks.map((b) => [b.blockId, b.type]));
  for (const r of results) {
    if (r.testValue === undefined || !r.testUnit || !r.exerciseId || r.skipped) continue;
    const step = steps[r.stepIndex];
    if (!step || step.kind !== 'work' || blockType.get(step.blockId) !== 'test') continue;
    entries.push({ key: r.exerciseId, value: r.testValue, unit: r.testUnit });
  }
  const course = COURSE_BY_ID.get(session.courseId);
  const node = course?.nodes.find((n) => n.id === session.nodeId);
  if (node?.kind === 'benchmark') {
    const view = benchmarkResult(steps, results);
    const record = view ? benchmarkRecord(view) : null;
    if (record) entries.push({ key: session.workoutId, ...record });
  }
  return entries;
}

export function createSummarySaver(input: SaveInput): () => Promise<SaveOutcome> {
  let summary: SessionSummary | null = null;
  let row: WorkoutSessionRow | null = null;
  let adjustment: ScaleAdjustment | null = null;
  let courseState: CourseStateRow | null = null;
  const benchmarksSaved = new Set<number>();

  return async function run(): Promise<SaveOutcome> {
    const { session } = input;
    if (!summary) summary = buildSummary(input);

    if (!row) {
      row = await completeSession(session.sessionId, {
        results: input.results,
        rpe: summary.rpe,
        feeling: summary.feeling,
        completion: summary.completion,
        points: summary.points,
        durationSec: summary.durationSec,
        calories: summary.calories,
        completedAt: summary.completedAt,
      });
    }

    if (!courseState) {
      const current = await getCourseState(session.courseId);
      const state: CourseState = {
        scale: current?.scale ?? session.prescribed.scale,
        history: [],
        completedNodeIds: current?.completedNodeIds ?? [],
      };
      adjustment = adaptScale(state, summary);
      const course = COURSE_BY_ID.get(session.courseId);
      const nodeIndex = course ? course.nodes.findIndex((n) => n.id === session.nodeId) : -1;
      const patch: CourseStatePatch = {
        scale: adjustment.scale,
        completedNodeIds: [...new Set([...state.completedNodeIds, session.nodeId])],
      };
      if (nodeIndex >= 0 && (current === null || current.currentNodeIndex === nodeIndex)) {
        patch.currentNodeIndex = nodeIndex + 1;
      }
      courseState = await upsertCourseState(session.courseId, patch);
    }

    const entries = benchmarkEntries(input);
    for (let i = 0; i < entries.length; i++) {
      if (benchmarksSaved.has(i)) continue;
      const e = entries[i]!;
      await recordBenchmark(e.key, e.value, e.unit);
      benchmarksSaved.add(i);
    }

    if (!adjustment) throw new Error('summary saver: adjustment missing');
    return { summary, adjustment, row, courseState, benchmarksRecorded: benchmarksSaved.size };
  };
}
