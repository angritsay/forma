/**
 * Write a patch to the server a moment after the typing stops.
 *
 * The course editor has no Save button, so this is what stands in for one. Patches that arrive
 * while a save is pending are merged rather than queued: the coach typing a name produces one
 * write, not one per keystroke, and the last value wins.
 *
 * `flush()` is for leaving the screen or publishing — it sends whatever is pending immediately
 * instead of letting the timer die with the component, and resolves once everything sent so far
 * is saved (`true`) or a save failed (`false`).
 *
 * ## When a save fails (0059)
 *
 * It used to drop the patch: the pending edit was emptied before the send and never refilled, so
 * a failed write was simply gone while the screen still showed the edit — and publishing went
 * ahead on top of it. Now:
 *
 *   - **the patch goes back.** A failed write is merged under whatever was typed since (the newer
 *     value wins), and goes with the next save, or with `retry()`;
 *   - **one write at a time.** A second save waits for the first, so an older write can never
 *     land after a newer one and undo it;
 *   - **each patch keeps its target.** The save function is taken when the patch is pushed: the
 *     day editor's save follows the open day, and a patch written to day 3 must not be sent to
 *     day 4 because it waited behind a slow write.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface Autosave<P> {
  /** Merge a patch into what will be written next. */
  push: (patch: P) => void;
  /** Send anything pending now; `true` once all of it is saved, `false` if a save failed. */
  flush: () => Promise<boolean>;
  /** Send again what failed (and anything newer). */
  retry: () => void;
  state: SaveState;
}

type Save<P> = (patch: P) => Promise<unknown>;

interface Entry<P> {
  patch: P;
  save: Save<P>;
}

/**
 * The queue behind the hook, without React: what is pending, what is in flight, and what a
 * failure puts back. Exported for the tests; the hook is a thin shell around it.
 */
export class SaveQueue<P extends object> {
  private queue: Entry<P>[] = [];
  private running: Promise<boolean> | null = null;

  constructor(private readonly onState: (state: SaveState) => void) {}

  /** Merge into the last entry when it goes to the same place, else queue a new one. */
  push(patch: P, save: Save<P>): void {
    const last = this.queue[this.queue.length - 1];
    if (last && last.save === save) last.patch = { ...last.patch, ...patch };
    else this.queue.push({ patch, save });
  }

  get pending(): boolean {
    return this.queue.length > 0;
  }

  /** Send everything queued, one write at a time. `false` as soon as a write fails. */
  run(): Promise<boolean> {
    if (this.running) {
      // Whatever was pushed meanwhile goes after the write already in flight.
      return this.running.then((ok) => (ok ? this.run() : false));
    }
    if (this.queue.length === 0) return Promise.resolve(true);
    this.running = this.drain().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async drain(): Promise<boolean> {
    while (this.queue.length > 0) {
      const entry = this.queue.shift()!;
      this.onState('saving');
      try {
        await entry.save(entry.patch);
      } catch {
        // Back to the front, under anything newer for the same place.
        const next = this.queue[0];
        if (next && next.save === entry.save) next.patch = { ...entry.patch, ...next.patch };
        else this.queue.unshift(entry);
        this.onState('error');
        return false;
      }
    }
    this.onState('saved');
    return true;
  }
}

export function useAutosave<P extends object>(save: Save<P>, delayMs = 700): Autosave<P> {
  const [state, setState] = useState<SaveState>('idle');
  const queue = useRef<SaveQueue<P> | null>(null);
  if (!queue.current) queue.current = new SaveQueue<P>(setState);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The latest save function, taken at push time (see the header).
  const saveRef = useRef(save);
  saveRef.current = save;

  const send = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    return queue.current!.run();
  }, []);

  const push = useCallback(
    (patch: P) => {
      queue.current!.push(patch, saveRef.current);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void send(), delayMs);
    },
    [send, delayMs],
  );

  const flush = useCallback(() => send(), [send]);
  const retry = useCallback(() => void send(), [send]);

  // Unmounting mid-edit must not lose the edit.
  useEffect(
    () => () => {
      void send();
    },
    [send],
  );

  return { push, flush, retry, state };
}
