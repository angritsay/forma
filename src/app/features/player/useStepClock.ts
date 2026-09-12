/**
 * Drift-free per-step clock, read from the session store rather than kept here.
 *
 * Elapsed time is derived from timestamps — the session's accumulated spans, less the point the
 * step began — so throttled background tabs and long pauses never skew it, and, crucially, neither
 * does leaving. It used to live in a ref in this hook, which meant it died whenever the component
 * did: walking out of a plank with twenty seconds left and coming back restarted it at a minute,
 * and a twelve-minute AMRAP reopened at twelve minutes. The store persists, so now it does not.
 *
 * This hook therefore owns no time of its own. All it does is re-render often enough for the digits
 * to change, and stop when there is nothing counting.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { stepElapsedNow, useActiveWorkoutStore } from '@/app/store/activeWorkout';
import type { Cue } from './sound';

export interface StepClock {
  elapsedMs: number;
  /** Whole seconds elapsed (rounded down). */
  elapsedSec: number;
  /** Whole seconds left (rounded up); 0 without a duration. */
  remainingSec: number;
  /** True once a countdown reached its duration. */
  done: boolean;
}

/** Every 100ms, so a whole second never lands visibly late. */
const TICK_MS = 100;

export function useStepClock(running: boolean, durationSec?: number): StepClock {
  const read = useCallback(() => stepElapsedNow(useActiveWorkoutStore.getState()), []);
  const [elapsedMs, setElapsedMs] = useState(read);
  const durationMs = durationSec === undefined ? undefined : Math.max(0, durationSec) * 1000;
  const done = durationMs !== undefined && elapsedMs >= durationMs;
  const active = running && !done;

  /*
   * The step may have been restarted, or moved on, without this component unmounting — the store's
   * `stepStartedMs` is what says so, and reading it back immediately keeps the digits honest even
   * while the clock is standing still.
   */
  const startedMs = useActiveWorkoutStore((s) => s.stepStartedMs);
  const lastStart = useRef(startedMs);
  useEffect(() => {
    if (lastStart.current === startedMs) return;
    lastStart.current = startedMs;
    setElapsedMs(read());
  }, [startedMs, read]);

  useEffect(() => {
    const tick = () => setElapsedMs(read());
    tick();
    if (!active) return;
    const interval = window.setInterval(tick, TICK_MS);
    // The moment of zero deserves its own wake-up: an interval alone can be up to TICK_MS late.
    let endTimer: number | undefined;
    if (durationMs !== undefined) {
      const left = durationMs - read();
      if (left > 0) endTimer = window.setTimeout(tick, left + 5);
    }
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      if (endTimer !== undefined) window.clearTimeout(endTimer);
      document.removeEventListener('visibilitychange', tick);
      tick();
    };
  }, [active, durationMs, read]);

  const remainingMs = durationMs === undefined ? 0 : Math.max(0, durationMs - elapsedMs);
  return {
    elapsedMs,
    elapsedSec: Math.floor(elapsedMs / 1000),
    remainingSec: Math.ceil(remainingMs / 1000),
    done,
  };
}

/**
 * Beeps at 3-2-1 and once at zero, then calls `onDone` exactly once.
 * `running` mirrors the clock so a pause never triggers a cue.
 */
export function useCountdownCues(
  clock: StepClock,
  running: boolean,
  beep: (cue: Cue) => void,
  onDone?: () => void,
): void {
  const lastSec = useRef<number | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!running || clock.done) return;
    const sec = clock.remainingSec;
    if (lastSec.current === null) {
      lastSec.current = sec;
      return;
    }
    if (sec !== lastSec.current) {
      lastSec.current = sec;
      if (sec >= 1 && sec <= 3) beep('tick');
    }
  }, [clock.remainingSec, clock.done, running, beep]);

  useEffect(() => {
    if (!clock.done || fired.current) return;
    fired.current = true;
    beep('end');
    onDone?.();
  }, [clock.done, beep, onDone]);
}

/**
 * Register what the "Next" control (and the → key) means for the current step. The latest
 * handler is always used, so callers can pass a fresh closure every render.
 */
export function useNextHandler(
  register: (fn: (() => void) | null) => void,
  handler: () => void,
): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  const stable = useCallback(() => latest.current(), []);
  useEffect(() => {
    register(stable);
    return () => register(null);
  }, [register, stable]);
}
