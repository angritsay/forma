/**
 * Active workout session (docs/SPEC.md §10 flow 6), persisted in localStorage under
 * `forma.activeWorkout` so an unfinished session survives a reload and can be resumed.
 *
 * `steps` are derived from `session.prescribed` with `buildPlayerSteps` — on `begin()` and again
 * when the persisted state is rehydrated — so the step order can never drift from the prescription.
 * The elapsed clock is timestamp-based: `elapsedMs` accumulates finished spans and `activeSince`
 * marks the start of the running span; `tick()` only re-derives `elapsedSec` from them.
 * A rehydrated session always comes back paused (time away from the app does not count).
 *
 * **The current step's own clock is derived from that same pair**, as `elapsedNow() -
 * stepStartedMs`, rather than kept inside the step component. It used to live in a ref there, which
 * meant it died with the component: walk out of a plank at twenty seconds left, come back, and the
 * plank started again at a minute — and a twelve-minute AMRAP reopened at twelve minutes. Deriving
 * it here gets resume, pausing and reload correctness for free, because the session clock already
 * had all three, and makes it impossible for the two clocks to disagree about how long a pause was.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ExerciseUnit } from '@/content/schema';
import { buildPlayerSteps } from '@/lib/training/player';
import type { ExerciseResult, PlayerStep, PrescribedWorkout } from '@/lib/training/types';

export const ACTIVE_WORKOUT_STORAGE_KEY = 'forma.activeWorkout';

export interface ActiveSession {
  /** `workout_sessions.id` created by `startSession` before the player opened. */
  sessionId: string;
  courseId: string;
  nodeId: string;
  workoutId: string;
  prescribed: PrescribedWorkout;
  /** ISO timestamp of the real start (from the session row). */
  startedAt: string;
}

export type BeginInput = ActiveSession;

/**
 * An engine `ExerciseResult` plus the measured value of a test-block step.
 * Engine completion treats `achieved` as reps (reps mode) or seconds (timer mode); a max-effort
 * test is complete once it was done, so its measurement travels separately and feeds benchmarks.
 */
export type PlayerResult = ExerciseResult & {
  testValue?: number;
  testUnit?: ExerciseUnit;
};

export interface ActiveWorkoutState {
  session: ActiveSession | null;
  steps: PlayerStep[];
  stepIndex: number;
  results: PlayerResult[];
  /** Whole seconds of active (unpaused) time, re-derived by `tick()`. */
  elapsedSec: number;
  paused: boolean;
  /** Set by `finish()`; the summary screen reads it as `completedAt`. */
  finishedAt: string | null;
  /** Accumulated milliseconds of finished spans (persisted). */
  elapsedMs: number;
  /** `Date.now()` when the current running span began; null while paused (never persisted). */
  activeSince: number | null;
  /**
   * Session time on the clock when the current step began (persisted). The step's own elapsed is
   * the distance from here to now, so leaving the app mid-step and coming back resumes it.
   */
  stepStartedMs: number;

  begin: (input: BeginInput) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  /** Upsert a result by its `stepIndex`. */
  recordResult: (result: PlayerResult) => void;
  setPaused: (paused: boolean) => void;
  /** Re-derive `elapsedSec` from the timestamps (call on an interval while playing). */
  tick: () => void;
  /** Start the current step over: its clock back to zero, the session clock untouched. */
  restartStep: () => void;
  /** Stop the clock and mark the session finished (results stay until saved). */
  finish: () => void;
  /** Drop the session and its results entirely. */
  abandon: () => void;
}

interface PersistedSlice {
  session: ActiveSession | null;
  stepIndex: number;
  results: PlayerResult[];
  elapsedMs: number;
  stepStartedMs: number;
  finishedAt: string | null;
}

const EMPTY: Omit<
  ActiveWorkoutState,
  | 'begin'
  | 'next'
  | 'prev'
  | 'goTo'
  | 'recordResult'
  | 'setPaused'
  | 'tick'
  | 'restartStep'
  | 'finish'
  | 'abandon'
> = {
  session: null,
  steps: [],
  stepIndex: 0,
  results: [],
  elapsedSec: 0,
  paused: true,
  finishedAt: null,
  elapsedMs: 0,
  activeSince: null,
  stepStartedMs: 0,
};

export function elapsedNow(s: Pick<ActiveWorkoutState, 'elapsedMs' | 'activeSince'>): number {
  return s.elapsedMs + (s.activeSince === null ? 0 : Math.max(0, Date.now() - s.activeSince));
}

/**
 * Milliseconds spent on the step the athlete is on. Frozen while paused, because the session clock
 * it is measured against is frozen too — which is the whole reason it lives here.
 */
export function stepElapsedNow(
  s: Pick<ActiveWorkoutState, 'elapsedMs' | 'activeSince' | 'stepStartedMs'>,
): number {
  return Math.max(0, elapsedNow(s) - s.stepStartedMs);
}

function clampIndex(index: number, steps: readonly PlayerStep[]): number {
  if (steps.length === 0) return 0;
  return Math.max(0, Math.min(steps.length - 1, Math.floor(index)));
}

function isSession(v: unknown): v is ActiveSession {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  const p = s.prescribed as Record<string, unknown> | undefined;
  return (
    typeof s.sessionId === 'string' &&
    typeof s.courseId === 'string' &&
    typeof s.nodeId === 'string' &&
    typeof s.workoutId === 'string' &&
    typeof s.startedAt === 'string' &&
    typeof p === 'object' &&
    p !== null &&
    Array.isArray(p.blocks)
  );
}

/** Rebuild the derived state from a persisted slice; anything malformed yields an empty store. */
function fromPersisted(raw: unknown): typeof EMPTY {
  if (typeof raw !== 'object' || raw === null) return { ...EMPTY };
  const p = raw as Partial<PersistedSlice>;
  if (!isSession(p.session)) return { ...EMPTY };
  let steps: PlayerStep[];
  try {
    steps = buildPlayerSteps(p.session.prescribed);
  } catch {
    return { ...EMPTY };
  }
  const elapsedMs = typeof p.elapsedMs === 'number' && p.elapsedMs > 0 ? p.elapsedMs : 0;
  // Clamped into the session clock: a value from a future version, or a hand-edited one, must not
  // leave the step running backwards or already over.
  const stepStartedMs =
    typeof p.stepStartedMs === 'number' && p.stepStartedMs > 0
      ? Math.min(p.stepStartedMs, elapsedMs)
      : 0;
  return {
    session: p.session,
    steps,
    stepIndex: clampIndex(typeof p.stepIndex === 'number' ? p.stepIndex : 0, steps),
    results: Array.isArray(p.results) ? p.results : [],
    elapsedMs,
    elapsedSec: Math.floor(elapsedMs / 1000),
    paused: true,
    finishedAt: typeof p.finishedAt === 'string' ? p.finishedAt : null,
    activeSince: null,
    stepStartedMs,
  };
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      begin: (input) => {
        const steps = buildPlayerSteps(input.prescribed);
        set({
          session: { ...input },
          steps,
          stepIndex: 0,
          results: [],
          elapsedMs: 0,
          elapsedSec: 0,
          paused: false,
          finishedAt: null,
          activeSince: Date.now(),
          stepStartedMs: 0,
        });
      },

      /*
       * Every move between steps restarts the step clock, because arriving at a movement is when
       * its own countdown starts. Only `setPaused` and a reload leave it where it was — which is
       * exactly the difference between "next" and "I'll be back in a minute".
       */
      next: () => {
        const s = get();
        set({ stepIndex: clampIndex(s.stepIndex + 1, s.steps), stepStartedMs: elapsedNow(s) });
      },

      prev: () => {
        const s = get();
        set({ stepIndex: clampIndex(s.stepIndex - 1, s.steps), stepStartedMs: elapsedNow(s) });
      },

      goTo: (index) => {
        const s = get();
        set({ stepIndex: clampIndex(index, s.steps), stepStartedMs: elapsedNow(s) });
      },

      recordResult: (result) => {
        set((s) => ({
          results: [...s.results.filter((r) => r.stepIndex !== result.stepIndex), result].sort(
            (a, b) => a.stepIndex - b.stepIndex,
          ),
        }));
      },

      setPaused: (paused) => {
        const s = get();
        if (!s.session || s.finishedAt) return;
        if (paused) {
          if (s.activeSince === null) {
            if (!s.paused) set({ paused: true });
            return;
          }
          const elapsedMs = elapsedNow(s);
          set({
            paused: true,
            activeSince: null,
            elapsedMs,
            elapsedSec: Math.floor(elapsedMs / 1000),
          });
        } else if (s.activeSince === null) {
          set({ paused: false, activeSince: Date.now() });
        } else if (s.paused) {
          set({ paused: false });
        }
      },

      tick: () => {
        const s = get();
        if (s.activeSince === null) return;
        const elapsedSec = Math.floor(elapsedNow(s) / 1000);
        if (elapsedSec !== s.elapsedSec) set({ elapsedSec });
      },

      restartStep: () => {
        const s = get();
        if (!s.session || s.finishedAt) return;
        set({ stepStartedMs: elapsedNow(s) });
      },

      finish: () => {
        const s = get();
        if (!s.session) return;
        const elapsedMs = elapsedNow(s);
        set({
          paused: true,
          activeSince: null,
          elapsedMs,
          elapsedSec: Math.floor(elapsedMs / 1000),
          finishedAt: s.finishedAt ?? new Date().toISOString(),
          stepIndex: s.steps.length > 0 ? s.steps.length - 1 : 0,
        });
      },

      abandon: () => set({ ...EMPTY }),
    }),
    {
      name: ACTIVE_WORKOUT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedSlice => ({
        session: s.session,
        stepIndex: s.stepIndex,
        results: s.results,
        // Fold the running span so a reload never loses time, without persisting `activeSince`.
        elapsedMs: elapsedNow(s),
        stepStartedMs: s.stepStartedMs,
        finishedAt: s.finishedAt,
      }),
      merge: (persisted, current) => ({ ...current, ...fromPersisted(persisted) }),
    },
  ),
);

/**
 * True when a session is in progress or finished but not yet saved. Works as a zustand selector
 * (`useActiveWorkoutStore(hasActiveWorkout)`) and as a plain call (`hasActiveWorkout()`).
 */
export function hasActiveWorkout(
  state: Pick<ActiveWorkoutState, 'session'> = useActiveWorkoutStore.getState(),
): boolean {
  return state.session !== null;
}

/** Route that resumes the active session: the player, or the summary once it is finished. */
export function activeWorkoutPath(
  state: Pick<ActiveWorkoutState, 'session' | 'finishedAt'> = useActiveWorkoutStore.getState(),
): string | null {
  if (!state.session) return null;
  return state.finishedAt ? `/summary/${state.session.sessionId}` : '/play';
}
