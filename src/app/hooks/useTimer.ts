/** Timestamp-based countdown and stopwatch hooks (accurate across throttled tabs). */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Countdown {
  /** Whole seconds left (rounded up). */
  remainingSec: number;
  running: boolean;
  /** True once the countdown reached zero. */
  done: boolean;
  /** Start or resume. */
  start: () => void;
  pause: () => void;
  /** Back to the full duration, stopped. */
  reset: () => void;
  /** Back to the full duration and start immediately. */
  restart: () => void;
}

export function useCountdown(totalSec: number): Countdown {
  const totalMs = Math.max(0, totalSec) * 1000;
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [running, setRunning] = useState(false);
  const endAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, (endAt.current ?? Date.now()) - Date.now());
      setRemainingMs(left);
      if (left <= 0) setRunning(false);
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    setRemainingMs((left) => {
      endAt.current = Date.now() + left;
      return left;
    });
    setRunning(true);
  }, []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    endAt.current = null;
    setRemainingMs(totalMs);
  }, [totalMs]);
  const restart = useCallback(() => {
    endAt.current = Date.now() + totalMs;
    setRemainingMs(totalMs);
    setRunning(true);
  }, [totalMs]);

  return {
    remainingSec: Math.ceil(remainingMs / 1000),
    running,
    done: remainingMs <= 0,
    start,
    pause,
    reset,
    restart,
  };
}

export interface Stopwatch {
  elapsedMs: number;
  /** Whole seconds elapsed (rounded down). */
  elapsedSec: number;
  running: boolean;
  start: () => void;
  /** Stops and returns the final elapsed milliseconds. */
  stop: () => number;
  reset: () => void;
}

export function useStopwatch(): Stopwatch {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const base = useRef(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = () =>
      setElapsedMs(base.current + (Date.now() - (startedAt.current ?? Date.now())));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    if (startedAt.current !== null) return;
    startedAt.current = Date.now();
    setRunning(true);
  }, []);
  const stop = useCallback(() => {
    if (startedAt.current === null) return base.current;
    const total = base.current + (Date.now() - startedAt.current);
    base.current = total;
    startedAt.current = null;
    setElapsedMs(total);
    setRunning(false);
    return total;
  }, []);
  const reset = useCallback(() => {
    base.current = 0;
    startedAt.current = null;
    setElapsedMs(0);
    setRunning(false);
  }, []);

  return { elapsedMs, elapsedSec: Math.floor(elapsedMs / 1000), running, start, stop, reset };
}
