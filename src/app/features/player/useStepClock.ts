/**
 * Drift-free per-step clock. Elapsed time is derived from timestamps (accumulated finished spans
 * + the running span), so throttled background tabs and long pauses never skew it. Mount one per
 * step (key the component by step index) — there is no reset, only `running`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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

export function useStepClock(running: boolean, durationSec?: number): StepClock {
  const span = useRef({ baseMs: 0, since: null as number | null });
  const [elapsedMs, setElapsedMs] = useState(0);
  const durationMs = durationSec === undefined ? undefined : Math.max(0, durationSec) * 1000;
  const done = durationMs !== undefined && elapsedMs >= durationMs;
  const active = running && !done;

  useEffect(() => {
    if (!active) return;
    const s = span.current;
    s.since = Date.now();
    const read = () => s.baseMs + (s.since === null ? 0 : Math.max(0, Date.now() - s.since));
    const tick = () => setElapsedMs(read());
    tick();
    const interval = window.setInterval(tick, 100);
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
      s.baseMs = read();
      s.since = null;
      setElapsedMs(s.baseMs);
    };
  }, [active, durationMs]);

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
