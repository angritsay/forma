/**
 * The cutter's seeking: one seek in flight at a time, the newest target next (`timelineView.ts`
 * has the queue and why). The `<video>`'s own `seeked` handler calls {@link Seeker.settled}; a
 * seek that never reports back (a phone can drop one on a long file) is let go after a moment, so
 * the queue cannot stick.
 */
import { useMemo, useRef, type RefObject } from 'react';
import {
  IDLE_SEEK,
  requestSeek,
  seekSettled,
  type SeekQueue,
  type SeekTarget,
} from './timelineView';

/**
 * A seek with no `seeked` after this long is taken as landed. Long enough for an exact seek deep
 * into a long 4K HEVC file on a phone; short enough that a dropped one does not freeze the picture.
 */
const STUCK_MS = 2000;

type FastSeekable = HTMLVideoElement & { fastSeek?: (t: number) => void };

export interface Seeker {
  /** Go to `t`; `fast` lets the browser land on the nearest keyframe while a finger moves. */
  seek: (t: number, fast?: boolean) => void;
  /** The video reported `seeked`. */
  settled: () => void;
  /** No seek is in flight or waiting: what the video reports is where it is meant to be. */
  idle: () => boolean;
  /** Forget everything in flight (a new file). */
  reset: () => void;
}

export function useSeeker(video: RefObject<HTMLVideoElement | null>): Seeker {
  const queue = useRef<SeekQueue>(IDLE_SEEK);
  const stuck = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useMemo(() => {
    const clearStuck = () => {
      if (stuck.current !== null) clearTimeout(stuck.current);
      stuck.current = null;
    };
    const apply = (target: SeekTarget | null) => {
      clearStuck();
      if (!target) return;
      const v = video.current as FastSeekable | null;
      if (!v) {
        queue.current = IDLE_SEEK;
        return;
      }
      try {
        if (target.fast && typeof v.fastSeek === 'function') v.fastSeek(target.t);
        else v.currentTime = target.t;
      } catch {
        // Not seekable yet: nothing is in flight.
        queue.current = IDLE_SEEK;
        return;
      }
      stuck.current = setTimeout(settled, STUCK_MS);
    };
    const settled = () => {
      const r = seekSettled(queue.current);
      queue.current = r.queue;
      apply(r.start);
    };
    return {
      seek: (t, fast = false) => {
        const r = requestSeek(queue.current, { t, fast });
        queue.current = r.queue;
        if (r.start) apply(r.start);
      },
      settled,
      idle: () => !queue.current.busy,
      reset: () => {
        clearStuck();
        queue.current = IDLE_SEEK;
      },
    };
  }, [video]);
}
