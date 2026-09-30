/**
 * A workout left in the background pauses itself.
 *
 * The session clock keeps running while the page is hidden — which is right for a minute (the
 * athlete switched to their music, or glanced at a message mid-plank) and wrong for twenty (they
 * took a call and forgot). Past {@link BACKGROUND_GRACE_MS} the player pauses **as of the moment
 * the grace ran out**, so the summary counts the minute and not the call.
 *
 * The timer may never fire in a hidden tab (browsers throttle them to nothing), so the same rule
 * is applied again when the page comes back.
 */
import { useEffect } from 'react';
import { useActiveWorkoutStore } from '@/app/store/activeWorkout';

export const BACKGROUND_GRACE_MS = 60_000;

/** When to pause a session hidden since `hiddenAt`, or null while it is still within grace. */
export function backgroundPauseAt(
  hiddenAt: number,
  now: number,
  graceMs = BACKGROUND_GRACE_MS,
): number | null {
  return now - hiddenAt > graceMs ? hiddenAt + graceMs : null;
}

export function useBackgroundPause(paused: boolean): void {
  useEffect(() => {
    if (paused || typeof document === 'undefined') return;
    let hiddenAt: number | null = document.hidden ? Date.now() : null;
    let timer: number | undefined;
    const pauseIfDue = () => {
      if (hiddenAt === null) return;
      const at = backgroundPauseAt(hiddenAt, Date.now());
      if (at !== null) useActiveWorkoutStore.getState().setPaused(true, at);
    };
    const onChange = () => {
      window.clearTimeout(timer);
      if (document.hidden) {
        hiddenAt = Date.now();
        timer = window.setTimeout(pauseIfDue, BACKGROUND_GRACE_MS + 1_000);
      } else {
        pauseIfDue();
        hiddenAt = null;
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onChange);
    };
  }, [paused]);
}
