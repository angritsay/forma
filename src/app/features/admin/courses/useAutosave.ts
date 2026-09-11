/**
 * Write a patch to the server a moment after the typing stops.
 *
 * The course editor has no Save button, so this is what stands in for one. Patches that arrive
 * while a save is pending are merged rather than queued: the coach typing a name produces one
 * write, not one per keystroke, and the last value wins.
 *
 * `flush()` is for leaving the screen — it sends whatever is pending immediately instead of
 * letting the timer die with the component.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface Autosave<P> {
  /** Merge a patch into what will be written next. */
  push: (patch: P) => void;
  /** Send anything pending now. */
  flush: () => void;
  state: SaveState;
}

export function useAutosave<P extends object>(
  save: (patch: P) => Promise<unknown>,
  delayMs = 700,
): Autosave<P> {
  const [state, setState] = useState<SaveState>('idle');
  const pending = useRef<P | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The latest save function, so the timer never calls a stale closure.
  const saveRef = useRef(save);
  saveRef.current = save;

  const send = useCallback(() => {
    const patch = pending.current;
    pending.current = null;
    if (!patch) return;
    setState('saving');
    saveRef
      .current(patch)
      .then(() => setState('saved'))
      .catch(() => setState('error'));
  }, []);

  const push = useCallback(
    (patch: P) => {
      pending.current = { ...(pending.current ?? {}), ...patch } as P;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(send, delayMs);
    },
    [send, delayMs],
  );

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    send();
  }, [send]);

  // Unmounting mid-edit must not lose the edit.
  useEffect(() => () => flush(), [flush]);

  return { push, flush, state };
}
