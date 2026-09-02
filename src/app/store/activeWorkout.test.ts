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

const { ACTIVE_WORKOUT_STORAGE_KEY, activeWorkoutPath, hasActiveWorkout, useActiveWorkoutStore } =
  await import('./activeWorkout');

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
    expect(s.steps[0]?.kind).toBe('block_intro');
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
    useActiveWorkoutStore.getState().recordResult({ stepIndex: 2, blockId: 'warmup', completed: true });
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

    // Simulate a reload: tamper with the index, reset memory, rehydrate from storage.
    persisted.state.stepIndex = 10_000;
    storage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(persisted));
    useActiveWorkoutStore.setState({ session: null, steps: [], stepIndex: 0, paused: true });
    await useActiveWorkoutStore.persist.rehydrate();

    const s = useActiveWorkoutStore.getState();
    expect(s.session?.sessionId).toBe('s1');
    expect(s.steps).toEqual(buildPlayerSteps(prescribed));
    expect(s.stepIndex).toBe(s.steps.length - 1);
    expect(s.paused).toBe(true);
    expect(s.activeSince).toBeNull();
    expect(s.elapsedSec).toBe(12);
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
