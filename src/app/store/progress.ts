/**
 * Progress store: per-course adaptive state, recent workout sessions, daily step logs,
 * benchmarks and all-time totals of the signed-in user (docs/SPEC.md §8, ui-home brief).
 *
 * `load()` fetches everything once per user and refreshes stale data in the background;
 * `refresh()` forces a reload. Pure selectors live next to the store so screens and tests share
 * one implementation; the hooks at the bottom memoize them for React.
 *
 * The active course (the one the Home "Today" card follows) is a per-device preference kept in
 * localStorage under `forma.activeCourse`.
 */
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { COURSES, COURSE_BY_ID, getCourse } from '@/content/registry';
import { listBenchmarks } from '@/lib/api/benchmarks';
import { listCourseStates, upsertCourseState as apiUpsertCourseState } from '@/lib/api/courseState';
import { listDailyLogs } from '@/lib/api/dailyLogs';
import { toAppError, type AppError } from '@/lib/api/errors';
import { listRecentSessions } from '@/lib/api/sessions';
import { getMyTotals } from '@/lib/api/stats';
import type {
  BenchmarkSeries,
  CourseStateRow,
  DailyLogRow,
  MyTotals,
  WorkoutSessionRow,
} from '@/lib/api/types';
import { computeFitnessIndex, initialScale } from '@/lib/training/assessment';
import { computeStreak } from '@/lib/training/streak';
import type { CourseState, SessionSummary, StreakInfo } from '@/lib/training/types';
import { addDays, toLocalDateIso } from '@/lib/util/dates';
import {
  buildDayActivity,
  isCompletedSession,
  stepsWeek,
  totalPoints,
  weekStats,
  type DailyLogMap,
  type StepsDay,
  type WeekStats,
} from '@/app/features/home/stats';
import { completeNodePatch } from '@/app/features/path/nodeState';
import { useSession, type Profile } from './session';

export const ACTIVE_COURSE_KEY = 'forma.activeCourse';
/** Completed sessions kept in memory (newest first). */
export const RECENT_SESSIONS_LIMIT = 60;
/** Days of step logs kept in memory (today included). */
export const DAILY_LOG_DAYS = 90;
/**
 * `load()` refreshes in the background when the data is older than this. Short on purpose:
 * every screen mount after a workout (summary → home) picks up the saved session and state.
 */
const STALE_MS = 10_000;

export type ProgressStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ProgressState {
  status: ProgressStatus;
  /** True while a load or refresh is in flight (background refreshes included). */
  loading: boolean;
  /** Last failure; with `status === 'ready'` it means a refresh failed and older data is shown. */
  error?: AppError;
  /** User id the data belongs to. */
  loadedFor?: string;
  loadedAt?: number;
  courseStates: Record<string, CourseStateRow>;
  recentSessions: WorkoutSessionRow[];
  /** Keyed by local date (YYYY-MM-DD). */
  dailyLogs: Record<string, DailyLogRow>;
  benchmarks: BenchmarkSeries[];
  totals: MyTotals | null;
  /** Preferred course id (persisted); resolve it with `resolveActiveCourseId`. */
  activeCourseId: string | null;
  setActiveCourse: (courseId: string | null) => void;
  /** Load once per user; refreshes stale data in the background. Safe to call from any screen. */
  load: () => Promise<void>;
  /** Force a reload, keeping the current data visible meanwhile. */
  refresh: () => Promise<void>;
  reset: () => void;
  putCourseState: (row: CourseStateRow) => void;
  putDailyLog: (row: DailyLogRow) => void;
  putSession: (row: WorkoutSessionRow) => void;
  /** Existing course state, or a fresh row with the profile's starting scale. */
  ensureCourseState: (courseId: string) => Promise<CourseStateRow>;
  /** Mark a node completed (rest days, milestones) and advance the current index. */
  completeNode: (courseId: string, nodeId: string) => Promise<CourseStateRow>;
}

/* ---------------------------------------------------------------------------------------------
 * Pure helpers
 * ------------------------------------------------------------------------------------------- */

function readActiveCourse(): string | null {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(ACTIVE_COURSE_KEY) : null;
    return v && COURSE_BY_ID.has(v) ? v : null;
  } catch {
    return null;
  }
}

function writeActiveCourse(id: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (id) localStorage.setItem(ACTIVE_COURSE_KEY, id);
    else localStorage.removeItem(ACTIVE_COURSE_KEY);
  } catch {
    /* Private mode or full storage: the preference lives in memory only. */
  }
}

/** Starting course scale from the profile's fitness index (conservative when unknown). */
export function startingScale(profile: Profile | null | undefined): number {
  const index =
    profile?.fitnessIndex ??
    (profile?.trainingProfile ? computeFitnessIndex(profile.trainingProfile).index : 0);
  return initialScale(index);
}

/**
 * The course the Home screen follows: the persisted preference when it is owned, otherwise
 * the owned course touched most recently, otherwise the first owned course in catalogue order.
 */
export function resolveActiveCourseId(
  preferred: string | null,
  courseStates: Readonly<Record<string, CourseStateRow>>,
  owned: readonly string[],
): string | null {
  if (preferred && owned.includes(preferred) && COURSE_BY_ID.has(preferred)) return preferred;
  const ownedCourses = COURSES.filter((c) => owned.includes(c.id));
  if (ownedCourses.length === 0) return null;
  let latest: CourseStateRow | undefined;
  for (const c of ownedCourses) {
    const s = courseStates[c.id];
    if (s && (!latest || s.updatedAt > latest.updatedAt)) latest = s;
  }
  return latest?.courseId ?? ownedCourses[0]!.id;
}

/** A completed session row as the engine's history entry; null for unfinished sessions. */
export function sessionToSummary(row: WorkoutSessionRow): SessionSummary | null {
  if (!row.completedAt) return null;
  return {
    sessionId: row.id,
    courseId: row.courseId,
    nodeId: row.nodeId,
    workoutId: row.workoutId,
    choice: row.difficulty ?? 'normal',
    scale: row.scale ?? 1,
    completion: row.completion ?? 1,
    rpe: row.rpe ?? 5,
    feeling: row.feeling ?? 'ok',
    points: row.points,
    durationSec: row.durationSec ?? 0,
    calories: row.calories ?? 0,
    completedAt: row.completedAt,
  };
}

/** Engine `CourseState` for a course from the stored row and the session history. */
export function engineCourseState(
  courseStates: Readonly<Record<string, CourseStateRow>>,
  sessions: readonly WorkoutSessionRow[],
  courseId: string,
  fallbackScale: number,
): CourseState {
  const row = courseStates[courseId];
  const history: SessionSummary[] = [];
  for (const s of sessions) {
    if (s.courseId !== courseId) continue;
    const summary = sessionToSummary(s);
    if (summary) history.push(summary);
  }
  history.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  return {
    scale: row?.scale ?? fallbackScale,
    history,
    completedNodeIds: row?.completedNodeIds ?? [],
  };
}

export function selectStreak(
  sessions: readonly WorkoutSessionRow[],
  logs: DailyLogMap,
  todayIso: string,
): StreakInfo {
  return computeStreak(buildDayActivity(sessions, logs), todayIso);
}

function keyBy<T>(rows: readonly T[], key: (row: T) => string): Record<string, T> {
  const out: Record<string, T> = {};
  for (const r of rows) out[key(r)] = r;
  return out;
}

/* ---------------------------------------------------------------------------------------------
 * Store
 * ------------------------------------------------------------------------------------------- */

const EMPTY_DATA = {
  status: 'idle' as const,
  loading: false,
  error: undefined,
  loadedFor: undefined,
  loadedAt: undefined,
  courseStates: {} as Record<string, CourseStateRow>,
  recentSessions: [] as WorkoutSessionRow[],
  dailyLogs: {} as Record<string, DailyLogRow>,
  benchmarks: [] as BenchmarkSeries[],
  totals: null as MyTotals | null,
};

let wired = false;
/** Keyed by user id so a load started for the previous user is never reused for the next one. */
let inflight: { userId: string; promise: Promise<void> } | null = null;

function isRejected(r: PromiseSettledResult<unknown>): r is PromiseRejectedResult {
  return r.status === 'rejected';
}

export const useProgress = create<ProgressState>((set, get) => {
  function wire() {
    if (wired) return;
    wired = true;
    useSession.subscribe((cur, prev) => {
      if (cur.status === 'signed_out' && prev.status !== 'signed_out') get().reset();
    });
  }

  async function fetchAll(userId: string, blocking: boolean): Promise<void> {
    set((s) => ({ loading: true, status: blocking ? 'loading' : s.status, error: undefined }));
    const today = toLocalDateIso();
    const from = addDays(today, -(DAILY_LOG_DAYS - 1));
    const [states, sessions, logs, benchmarks, totals] = await Promise.allSettled([
      listCourseStates(),
      listRecentSessions(RECENT_SESSIONS_LIMIT),
      listDailyLogs(from, today),
      listBenchmarks(),
      getMyTotals(),
    ]);
    if (useSession.getState().user?.id !== userId) {
      set({ loading: false });
      return;
    }
    const prev = get();
    const next: Partial<ProgressState> = {
      loading: false,
      loadedFor: userId,
      loadedAt: Date.now(),
    };
    if (states.status === 'fulfilled') next.courseStates = keyBy(states.value, (r) => r.courseId);
    if (sessions.status === 'fulfilled') next.recentSessions = sessions.value;
    if (logs.status === 'fulfilled') next.dailyLogs = keyBy(logs.value, (r) => r.localDate);
    if (benchmarks.status === 'fulfilled') next.benchmarks = benchmarks.value;
    if (totals.status === 'fulfilled') next.totals = totals.value;
    const failed = [states, sessions, logs].find(isRejected);
    if (failed) {
      next.error = toAppError(failed.reason);
      next.status = prev.status === 'ready' ? 'ready' : 'error';
    } else {
      next.status = 'ready';
    }
    set(next);
  }

  function run(userId: string, blocking: boolean): Promise<void> {
    if (inflight && inflight.userId === userId) return inflight.promise;
    const promise = fetchAll(userId, blocking).finally(() => {
      if (inflight?.promise === promise) inflight = null;
    });
    inflight = { userId, promise };
    return promise;
  }

  return {
    ...EMPTY_DATA,
    activeCourseId: readActiveCourse(),

    setActiveCourse: (courseId) => {
      const id = courseId && COURSE_BY_ID.has(courseId) ? courseId : null;
      writeActiveCourse(id);
      set({ activeCourseId: id });
    },

    load: async () => {
      wire();
      const user = useSession.getState().user;
      if (!user) return;
      const s = get();
      const sameUser = s.loadedFor === user.id;
      if (s.loadedFor && !sameUser) get().reset();
      const fresh = sameUser && s.status === 'ready' && Date.now() - (s.loadedAt ?? 0) < STALE_MS;
      if (fresh) return;
      await run(user.id, !(sameUser && s.status === 'ready'));
    },

    refresh: async () => {
      wire();
      const user = useSession.getState().user;
      if (!user) return;
      const s = get();
      await run(user.id, s.loadedFor !== user.id || s.status !== 'ready');
    },

    reset: () => set({ ...EMPTY_DATA }),

    putCourseState: (row) =>
      set((s) => ({ courseStates: { ...s.courseStates, [row.courseId]: row } })),

    putDailyLog: (row) => set((s) => ({ dailyLogs: { ...s.dailyLogs, [row.localDate]: row } })),

    putSession: (row) =>
      set((s) => {
        const rest = s.recentSessions.filter((x) => x.id !== row.id);
        const list = isCompletedSession(row) ? [row, ...rest] : rest;
        return { recentSessions: list.slice(0, RECENT_SESSIONS_LIMIT) };
      }),

    ensureCourseState: async (courseId) => {
      if (get().status !== 'ready') await get().load();
      const existing = get().courseStates[courseId];
      if (existing) return existing;
      const row = await apiUpsertCourseState(courseId, {
        scale: startingScale(useSession.getState().profile),
        currentNodeIndex: 0,
        completedNodeIds: [],
      });
      get().putCourseState(row);
      return row;
    },

    completeNode: async (courseId, nodeId) => {
      const course = getCourse(courseId);
      const current = await get().ensureCourseState(courseId);
      const patch = completeNodePatch(course.nodes, current, nodeId);
      const row = await apiUpsertCourseState(courseId, patch);
      get().putCourseState(row);
      return row;
    },
  };
});

/* ---------------------------------------------------------------------------------------------
 * Hooks
 * ------------------------------------------------------------------------------------------- */

/** Kick off `load()` on mount (idempotent; stale data refreshes in the background). */
export function useProgressLoader(): void {
  useEffect(() => {
    void useProgress.getState().load();
  }, []);
}

/** Today's local date; re-evaluated on every render so a screen left open crosses midnight. */
export function useTodayIso(): string {
  return toLocalDateIso();
}

export function useActiveCourseId(): string | null {
  const preferred = useProgress((s) => s.activeCourseId);
  const courseStates = useProgress((s) => s.courseStates);
  const owned = useSession((s) => s.entitlements);
  return useMemo(
    () => resolveActiveCourseId(preferred, courseStates, owned),
    [preferred, courseStates, owned],
  );
}

export function useCourseStateRow(courseId: string | null | undefined): CourseStateRow | undefined {
  return useProgress((s) => (courseId ? s.courseStates[courseId] : undefined));
}

export function useEngineCourseState(courseId: string): CourseState {
  const courseStates = useProgress((s) => s.courseStates);
  const sessions = useProgress((s) => s.recentSessions);
  const profile = useSession((s) => s.profile);
  return useMemo(
    () => engineCourseState(courseStates, sessions, courseId, startingScale(profile)),
    [courseStates, sessions, courseId, profile],
  );
}

export function useStreak(): StreakInfo {
  const sessions = useProgress((s) => s.recentSessions);
  const logs = useProgress((s) => s.dailyLogs);
  const today = useTodayIso();
  return useMemo(() => selectStreak(sessions, logs, today), [sessions, logs, today]);
}

export function useWeekStats(): WeekStats {
  const sessions = useProgress((s) => s.recentSessions);
  const logs = useProgress((s) => s.dailyLogs);
  const today = useTodayIso();
  return useMemo(() => weekStats(sessions, logs, today), [sessions, logs, today]);
}

export function useStepsWeek(): StepsDay[] {
  const logs = useProgress((s) => s.dailyLogs);
  const today = useTodayIso();
  return useMemo(() => stepsWeek(logs, today), [logs, today]);
}

export function useStepsToday(): number {
  const today = useTodayIso();
  return useProgress((s) => s.dailyLogs[today]?.steps ?? 0);
}

export function useStepsYesterday(): number {
  const yesterday = addDays(useTodayIso(), -1);
  return useProgress((s) => s.dailyLogs[yesterday]?.steps ?? 0);
}

/** All-time points: the server total when available, else the sum of the loaded rows. */
export function useTotalPoints(): number {
  const totals = useProgress((s) => s.totals);
  const sessions = useProgress((s) => s.recentSessions);
  const logs = useProgress((s) => s.dailyLogs);
  return useMemo(() => totals?.points ?? totalPoints(sessions, logs), [totals, sessions, logs]);
}
