/**
 * The summary screen's unsaved state, kept on the device until the save lands: the feedback the
 * athlete gave («Как зашло?», effort, note) and how far the save got (`SaveProgress`).
 *
 * Both used to live in component state, so walking away from a failed save and coming back asked
 * for the feedback again and started the save from scratch — which completed the session twice
 * and, worse, recorded its benchmarks twice. One record for one session: a record for another
 * session id is ignored and overwritten.
 *
 * localStorage, not sessionStorage: the active workout itself lives there, and the draft has to
 * outlive the same reloads it does. Every access is guarded; without storage the screen still
 * works, it just forgets on reload.
 */
import type { SaveProgress, SaveProgressStore } from '../save';
import type { FeedbackValue } from './FeedbackForm';

export const SUMMARY_DRAFT_KEY = 'forma.summaryDraft';

interface Draft {
  sessionId: string;
  feedback?: FeedbackValue;
  progress?: SaveProgress;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function local(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readDraft(sessionId: string, store: StorageLike | null): Draft | null {
  if (!store) return null;
  try {
    const raw = store.getItem(SUMMARY_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    return draft && draft.sessionId === sessionId ? draft : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft, store: StorageLike | null): void {
  if (!store) return;
  try {
    store.setItem(SUMMARY_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Full or blocked storage: the draft lives as long as the screen does. */
  }
}

function isFeedback(v: unknown): v is FeedbackValue {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return typeof f.rpe === 'number' && typeof f.note === 'string';
}

export function readFeedback(sessionId: string, store = local()): FeedbackValue | null {
  const f = readDraft(sessionId, store)?.feedback;
  return isFeedback(f) ? f : null;
}

export function writeFeedback(sessionId: string, feedback: FeedbackValue, store = local()): void {
  const draft = readDraft(sessionId, store) ?? { sessionId };
  writeDraft({ ...draft, feedback }, store);
}

/** The save's progress for `createSummarySaver`, persisted beside the feedback. */
export function draftProgressStore(store = local()): SaveProgressStore {
  let memory: SaveProgress | null = null;
  return {
    read: (sessionId) => {
      const kept = readDraft(sessionId, store)?.progress;
      if (kept && Array.isArray(kept.benchmarks)) return kept;
      return memory?.sessionId === sessionId ? memory : null;
    },
    write: (progress) => {
      memory = progress;
      const draft = readDraft(progress.sessionId, store) ?? { sessionId: progress.sessionId };
      writeDraft({ ...draft, progress }, store);
    },
  };
}

/** Whether the session row is already written: the feedback on the server can no longer change. */
export function rowSaved(sessionId: string, store = local()): boolean {
  return Boolean(readDraft(sessionId, store)?.progress?.row);
}

/** Forget the draft: the save landed, or the athlete let the workout go. */
export function clearSummaryDraft(store = local()): void {
  try {
    store?.removeItem(SUMMARY_DRAFT_KEY);
  } catch {
    /* Nothing to do: a draft for a finished session is ignored by id anyway. */
  }
}
