import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPlayerSteps } from '@/lib/training/player';
import { prescribeWorkout } from '@/lib/training/prescribe';
import { fixtureLookup, FULL_WORKOUT, profile } from '@/lib/training/fixtures.test-helpers';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, String(v));
    },
  };
}

const storage = memoryStorage();
vi.stubGlobal('localStorage', storage);

const {
  ACTIVE_WORKOUT_STORAGE_KEY,
  activeWorkoutPath,
  hasActiveWorkout,
  stepElapsedNow,
  useActiveWorkoutStore,
} = await import('./activeWorkout');

const prescribed = prescribeWorkout(
  FULL_WORKOUT,
  { profile: profile(), scale: 1, choice: 'normal', level: 2 },
  fixtureLookup,
);

const T0 = new Date('2026-09-01T10:00:00.000Z');

function begin() {
  useActiveWorkoutStore.getState().begin({
    sessionId: 's1',
    courseId: 'c1',
    nodeId: 'n1',
    workoutId: FULL_WORKOUT.id,
    prescribed,
    startedAt: T0.toISOString(),
  });
}

describe('activeWorkout store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    useActiveWorkoutStore.getState().abandon();
    storage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty', () => {
    const s = useActiveWorkoutStore.getState();
    expect(s.session).toBeNull();
    expect(hasActiveWorkout(s)).toBe(false);
    expect(activeWorkoutPath(s)).toBeNull();
  });

  it('begin() builds the steps from the prescription and starts the clock', () => {
    begin();
    const s = useActiveWorkoutStore.getState();
    expect(s.steps).toEqual(buildPlayerSteps(prescribed));
    // The fixture opens with a warm-up, and a session lands straight inside it: no gate, no intro.
    expect(s.steps[0]?.kind).toBe('work');
    expect(s.steps[s.steps.length - 1]?.kind).toBe('done');
    expect(s.stepIndex).toBe(0);
    expect(s.paused).toBe(false);
    expect(s.results).toEqual([]);
    expect(hasActiveWorkout()).toBe(true);
    expect(activeWorkoutPath()).toBe('/play');
  });

  it('next/prev/goTo clamp to the step range', () => {
    begin();
    const st = useActiveWorkoutStore.getState;
    st().prev();
    expect(st().stepIndex).toBe(0);
    st().next();
    st().next();
    expect(st().stepIndex).toBe(2);
    st().prev();
    expect(st().stepIndex).toBe(1);
    st().goTo(9999);
    expect(st().stepIndex).toBe(st().steps.length - 1);
    st().goTo(-5);
    expect(st().stepIndex).toBe(0);
  });

  it('recordResult upserts by stepIndex and keeps results ordered', () => {
    begin();
    const st = useActiveWorkoutStore.getState;
    st().recordResult({ stepIndex: 5, blockId: 'strength', completed: true, achieved: 10 });
    st().recordResult({ stepIndex: 2, blockId: 'warmup', completed: true });
    st().recordResult({ stepIndex: 5, blockId: 'strength', completed: false, achieved: 6 });
    expect(st().results).toEqual([
      { stepIndex: 2, blockId: 'warmup', completed: true },
      { stepIndex: 5, blockId: 'strength', completed: false, achieved: 6 },
    ]);
  });

  it('elapsed time comes from timestamps and freezes while paused', () => {
    begin();
    const st = useActiveWorkoutStore.getState;
    vi.setSystemTime(new Date(T0.getTime() + 5_400));
    st().tick();
    expect(st().elapsedSec).toBe(5);

    st().setPaused(true);
    expect(st().paused).toBe(true);
    expect(st().elapsedMs).toBe(5_400);
    vi.setSystemTime(new Date(T0.getTime() + 60_000));
    st().tick();
    expect(st().elapsedSec).toBe(5);

    st().setPaused(false);
    vi.setSystemTime(new Date(T0.getTime() + 62_000));
    st().tick();
    expect(st().elapsedSec).toBe(7);
  });

  it('finish() stops the clock, jumps to the done step and routes to the summary', () => {
    begin();
    const st = useActiveWorkoutStore.getState;
    vi.setSystemTime(new Date(T0.getTime() + 30_000));
    st().finish();
    expect(st().paused).toBe(true);
    expect(st().elapsedSec).toBe(30);
    expect(st().finishedAt).toBe(new Date(T0.getTime() + 30_000).toISOString());
    expect(st().steps[st().stepIndex]?.kind).toBe('done');
    expect(activeWorkoutPath()).toBe('/summary/s1');
    // Pausing/resuming after finish is a no-op.
    st().setPaused(false);
    expect(st().paused).toBe(true);
  });

  it('abandon() clears everything', () => {
    begin();
    useActiveWorkoutStore
      .getState()
      .recordResult({ stepIndex: 2, blockId: 'warmup', completed: true });
    useActiveWorkoutStore.getState().abandon();
    const s = useActiveWorkoutStore.getState();
    expect(s.session).toBeNull();
    expect(s.steps).toEqual([]);
    expect(s.results).toEqual([]);
    expect(s.elapsedSec).toBe(0);
    expect(hasActiveWorkout(s)).toBe(false);
  });

  it('rehydrates a persisted session paused, with steps rebuilt and the index clamped', async () => {
    begin();
    useActiveWorkoutStore.getState().next();
    vi.setSystemTime(new Date(T0.getTime() + 12_000));
    useActiveWorkoutStore.getState().tick();
    const raw = storage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw!) as { state: Record<string, unknown>; version: number };
    expect(persisted.state).not.toHaveProperty('steps');
    expect(persisted.state).not.toHaveProperty('activeSince');

    // Simulate a reload: reset memory first (the persist middleware writes every setState through
    // to storage), then plant a tampered index and rehydrate from storage.
    useActiveWorkoutStore.setState({ session: null, steps: [], stepIndex: 0, paused: true });
    persisted.state.stepIndex = 10_000;
    storage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(persisted));
    await useActiveWorkoutStore.persist.rehydrate();

    const s = useActiveWorkoutStore.getState();
    expect(s.session?.sessionId).toBe('s1');
    expect(s.steps).toEqual(buildPlayerSteps(prescribed));
    expect(s.stepIndex).toBe(s.steps.length - 1);
    expect(s.paused).toBe(true);
    expect(s.activeSince).toBeNull();
    expect(s.elapsedSec).toBe(12);
  });

  /*
   * The step's own clock. It used to live in a ref inside the player's clock hook, which meant it
   * died with the component: leaving a plank with twenty seconds left and coming back restarted it
   * at a minute, and a twelve-minute AMRAP reopened at twelve minutes. It is derived from the
   * session clock now, so pausing, leaving and reloading all behave the same way.
   */
  describe('the current step resumes where it stopped', () => {
    const at = (sec: number) => vi.setSystemTime(new Date(T0.getTime() + sec * 1000));
    const st = () => useActiveWorkoutStore.getState();

    it('counts from the moment the step began, not from the start of the session', () => {
      begin();
      at(30);
      st().next();
      at(50);
      expect(st().elapsedSec).toBe(0); // not ticked yet
      expect(Math.round(stepElapsedNow(st()) / 1000)).toBe(20);
    });

    it('freezes while paused and carries on from the same second', () => {
      begin();
      at(40);
      st().setPaused(true);
      expect(Math.round(stepElapsedNow(st()) / 1000)).toBe(40);
      // Four minutes away from the app change nothing.
      at(280);
      expect(Math.round(stepElapsedNow(st()) / 1000)).toBe(40);
      st().setPaused(false);
      at(290);
      expect(Math.round(stepElapsedNow(st()) / 1000)).toBe(50);
    });

    it('survives a reload mid-step', async () => {
      begin();
      at(20);
      st().next();
      at(45); // 25 seconds into the second step
      st().setPaused(true);
      const raw = storage.getItem(ACTIVE_WORKOUT_STORAGE_KEY)!;
      const persisted = JSON.parse(raw) as { state: Record<string, unknown> };
      expect(persisted.state).toHaveProperty('stepStartedMs');

      useActiveWorkoutStore.setState({ session: null, steps: [], stepIndex: 0, paused: true });
      storage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, raw);
      // A day later, on a different device clock.
      at(86_400);
      await useActiveWorkoutStore.persist.rehydrate();

      expect(st().stepIndex).toBe(1);
      expect(Math.round(stepElapsedNow(st()) / 1000)).toBe(25);
      expect(st().paused).toBe(true);
    });

    it('starts the step over on restartStep, and only that step', () => {
      begin();
      at(60);
      st().next();
      at(100);
      expect(Math.round(stepElapsedNow(st()) / 1000)).toBe(40);
      st().restartStep();
      expect(Math.round(stepElapsedNow(st()) / 1000)).toBe(0);
      st().tick();
      expect(st().elapsedSec).toBe(100); // the session clock is untouched
    });

    it('refuses a persisted origin that is ahead of the session clock', async () => {
      begin();
      at(30);
      st().setPaused(true);
      const persisted = JSON.parse(storage.getItem(ACTIVE_WORKOUT_STORAGE_KEY)!) as {
        state: Record<string, unknown>;
      };
      persisted.state.stepStartedMs = 999_999_999;
      useActiveWorkoutStore.setState({ session: null, steps: [], stepIndex: 0, paused: true });
      storage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(persisted));
      await useActiveWorkoutStore.persist.rehydrate();
      // Clamped into the session, so the step reads as just-started rather than as negative time.
      expect(stepElapsedNow(st())).toBe(0);
    });
  });

  it('ignores malformed persisted state', async () => {
    storage.setItem(
      ACTIVE_WORKOUT_STORAGE_KEY,
      JSON.stringify({ state: { session: { sessionId: 'x' }, stepIndex: 3 }, version: 1 }),
    );
    await useActiveWorkoutStore.persist.rehydrate();
    const s = useActiveWorkoutStore.getState();
    expect(s.session).toBeNull();
    expect(s.steps).toEqual([]);
    expect(s.stepIndex).toBe(0);
  });
});
