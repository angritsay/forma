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
  /** Run with `sec` left — a countdown picked up after a reload; zero or less is already done. */
  resume: (sec: number) => void;
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
  const resume = useCallback((sec: number) => {
    const left = Math.max(0, sec * 1000);
    endAt.current = Date.now() + left;
    setRemainingMs(left);
    setRunning(left > 0);
  }, []);

  return {
    remainingSec: Math.ceil(remainingMs / 1000),
    running,
    done: remainingMs <= 0,
    start,
    pause,
    reset,
    restart,
    resume,
  };
}
