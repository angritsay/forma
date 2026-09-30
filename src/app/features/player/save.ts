/**
 * Persist a finished session: complete the row, adapt and store the course state, record
 * benchmarks. Built as a resumable saver: a retry after a network error re-runs only the stages
 * that have not succeeded, so nothing is written twice and nothing is lost.
 */
import { findCourse } from '@/content/catalogue';
import { recordBenchmark } from '@/lib/api/benchmarks';
import { getCourseState, upsertCourseState } from '@/lib/api/courseState';
import { isAppError } from '@/lib/api/errors';
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
import { completeNodePatch } from '@/app/features/path/nodeState';
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
  const course = findCourse(session.courseId);
  const node = course?.nodes.find((n) => n.id === session.nodeId);
  if (node?.kind === 'benchmark') {
    const view = benchmarkResult(steps, results);
    const record = view ? benchmarkRecord(view) : null;
    if (record) entries.push({ key: session.workoutId, ...record });
  }
  return entries;
}

/**
 * What a save has already written, per session. Kept outside the saver so that a summary screen
 * that remounts — the athlete walked away and came back, or the app was reloaded — resumes where
 * the last attempt stopped instead of completing, adapting the scale and recording benchmarks a
 * second time.
 */
export interface SaveProgress {
  sessionId: string;
  summary?: SessionSummary;
  row?: WorkoutSessionRow;
  adjustment?: ScaleAdjustment;
  courseState?: CourseStateRow;
  /** Indexes into the session's benchmark entries that are already recorded. */
  benchmarks: number[];
}

export interface SaveProgressStore {
  read: (sessionId: string) => SaveProgress | null;
  write: (progress: SaveProgress) => void;
}

/** Progress that lives as long as the saver itself (tests, and the fallback without storage). */
export function memoryProgressStore(): SaveProgressStore {
  let kept: SaveProgress | null = null;
  return {
    read: (sessionId) => (kept?.sessionId === sessionId ? kept : null),
    write: (progress) => {
      kept = progress;
    },
  };
}

/**
 * A save that can be retried stage by stage. The feedback passed to a call wins over the input's
 * until the session row is written — after an error the athlete may still change «Как зашло?» —
 * and is fixed from then on, because the server already holds it.
 */
export function createSummarySaver(
  input: SaveInput,
  store: SaveProgressStore = memoryProgressStore(),
): (feedback?: SessionFeedback) => Promise<SaveOutcome> {
  return async function run(feedback?: SessionFeedback): Promise<SaveOutcome> {
    const { session } = input;
    const p: SaveProgress = store.read(session.sessionId) ?? {
      sessionId: session.sessionId,
      benchmarks: [],
    };

    if (!p.row || !p.summary) {
      const summary = buildSummary(feedback ? { ...input, feedback } : input);
      p.row = await completeSession(session.sessionId, {
        results: input.results,
        rpe: summary.rpe,
        feeling: summary.feeling,
        completion: summary.completion,
        points: summary.points,
        durationSec: summary.durationSec,
        calories: summary.calories,
        completedAt: summary.completedAt,
      });
      p.summary = summary;
      store.write(p);
    }
    const summary = p.summary;

    if (!p.courseState || !p.adjustment) {
      const current = await getCourseState(session.courseId);
      const state: CourseState = {
        scale: current?.scale ?? session.prescribed.scale,
        history: [],
        completedNodeIds: current?.completedNodeIds ?? [],
      };
      const adjustment = adaptScale(state, summary);
      const course = findCourse(session.courseId);
      // Same semantics as the path screen's `completeNode`: the node joins `completedNodeIds` and
      // the index moves to the next unfinished node (a repeat of an earlier node leaves it put).
      const patch: CourseStatePatch = course
        ? { scale: adjustment.scale, ...completeNodePatch(course.nodes, current, session.nodeId) }
        : {
            scale: adjustment.scale,
            completedNodeIds: [...new Set([...state.completedNodeIds, session.nodeId])],
          };
      p.courseState = await upsertCourseState(session.courseId, patch);
      p.adjustment = adjustment;
      store.write(p);
    }

    const entries = benchmarkEntries(input);
    for (let i = 0; i < entries.length; i++) {
      if (p.benchmarks.includes(i)) continue;
      const e = entries[i]!;
      await recordBenchmark(e.key, e.value, e.unit);
      p.benchmarks = [...p.benchmarks, i];
      store.write(p);
    }

    return {
      summary,
      adjustment: p.adjustment,
      row: p.row,
      courseState: p.courseState,
      benchmarksRecorded: p.benchmarks.length,
    };
  };
}

/**
 * What went wrong with a save, in the terms the summary screen speaks.
 *
 * * `offline` — the request never arrived; the results are on the device and a retry will do.
 * * `daily_limit` — the server counts at most four finished sessions a day
 *   (`workout_sessions_guard`, 0001): no retry today will land it, so the way out is to let it go.
 * * `gone` — the session row is not there any more (deleted, or started under another account);
 *   there is nothing left to complete.
 * * `auth` — the sign-in ran out; the results wait on the device until the athlete is back.
 * * `generic` — anything else, worth one more try.
 */
export type SaveErrorKind = 'offline' | 'daily_limit' | 'gone' | 'auth' | 'generic';

export function saveErrorKind(e: unknown): SaveErrorKind {
  if (!isAppError(e)) return 'generic';
  if (e.code === 'network') return 'offline';
  if (e.code === 'auth') return 'auth';
  if (e.code === 'not_found') return 'gone';
  if (e.code === 'validation' && e.message === 'too_many_sessions_today') return 'daily_limit';
  return 'generic';
}

/**
 * Whether pressing «Повторить» can still end in a saved workout. `auth` can: the app sends the
 * athlete to sign in, the results wait on the device, and the retry after that lands.
 */
export function saveRetryable(kind: SaveErrorKind): boolean {
  return kind !== 'daily_limit' && kind !== 'gone';
}
