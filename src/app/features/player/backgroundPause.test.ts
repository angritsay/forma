/** A workout left in the background pauses itself, counting only the minute of grace. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal('localStorage', {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

const { backgroundPauseAt, BACKGROUND_GRACE_MS } = await import('./backgroundPause');
const { useActiveWorkoutStore } = await import('@/app/store/activeWorkout');

describe('backgroundPauseAt', () => {
  it('leaves a short trip to another app alone', () => {
    expect(backgroundPauseAt(0, BACKGROUND_GRACE_MS)).toBeNull();
  });

  it('pauses a long one as of the end of the grace', () => {
    expect(backgroundPauseAt(1_000, 1_000 + 20 * 60_000)).toBe(1_000 + BACKGROUND_GRACE_MS);
  });
});

describe('setPaused with a moment', () => {
  beforeEach(() => vi.useRealTimers());

  it('counts the clock only up to that moment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    useActiveWorkoutStore.getState().begin({
      sessionId: 's',
      courseId: 'custom',
      nodeId: 'n',
      workoutId: 'w',
      prescribed: { blocks: [] } as never,
      startedAt: '2026-09-30T10:00:00Z',
    });
    vi.setSystemTime(20 * 60_000);
    useActiveWorkoutStore.getState().setPaused(true, BACKGROUND_GRACE_MS);
    const s = useActiveWorkoutStore.getState();
    expect(s.paused).toBe(true);
    expect(s.elapsedMs).toBe(BACKGROUND_GRACE_MS);
    vi.useRealTimers();
  });
});
