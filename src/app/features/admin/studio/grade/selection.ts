/**
 * The clip grid's arithmetic: which clips a filter shows, what a selection can do, and what a
 * queue would replace.
 *
 * The server decides for real (`admin_media_queue` skips unlabelled and busy clips and answers how
 * many it took). These helpers exist so the screen can say so *before* the button is pressed —
 * «3 из 5 уйдут в обработку, 2 без упражнения» — and ask about replacing a video while there is
 * still time to say no.
 */
import type { MediaClip, MediaClipStatus } from '@/lib/api/mediaStudio';

export const CLIP_FILTERS = ['all', 'todo', 'queued', 'done', 'failed'] as const;
export type ClipFilter = (typeof CLIP_FILTERS)[number];

/** Which statuses each filter shows. «todo» is everything still waiting for her: drafts. */
const FILTER_STATUSES: Record<Exclude<ClipFilter, 'all'>, readonly MediaClipStatus[]> = {
  todo: ['draft'],
  queued: ['queued', 'rendering'],
  done: ['done'],
  failed: ['failed'],
};

export function filterClips(clips: readonly MediaClip[], filter: ClipFilter): MediaClip[] {
  if (filter === 'all') return [...clips];
  const statuses = FILTER_STATUSES[filter];
  return clips.filter((c) => statuses.includes(c.status));
}

export function filterCounts(clips: readonly MediaClip[]): Record<ClipFilter, number> {
  const out: Record<ClipFilter, number> = {
    all: clips.length,
    todo: 0,
    queued: 0,
    done: 0,
    failed: 0,
  };
  for (const c of clips) {
    for (const f of CLIP_FILTERS) {
      if (f !== 'all' && FILTER_STATUSES[f].includes(c.status)) out[f]++;
    }
  }
  return out;
}

/**
 * Being rendered by a live run: the server refuses edits (`clip_busy`). A dead run's clip reads
 * `rendering` until the next claim, but its lease has lapsed and the server lets it be edited, so
 * the screen only blocks while the status says so and leaves the last word to the server.
 */
export const isBusy = (c: Pick<MediaClip, 'status'>): boolean => c.status === 'rendering';

/** A clip `admin_media_queue` would take: labelled, and not already waiting or rendering. */
export const isQueueable = (c: Pick<MediaClip, 'status' | 'exerciseId'>): boolean =>
  c.exerciseId !== null && (c.status === 'draft' || c.status === 'done' || c.status === 'failed');

/**
 * A clip «Отправить в обработку» on the preview step sends: labelled and not sent since its last
 * change. A rendered clip that changes is a draft again, so a done one has nothing new to render
 * (sending it would only replace its video with the same one); a failed one is «Повторить»'s.
 */
export const isUnsent = (c: Pick<MediaClip, 'status' | 'exerciseId'>): boolean =>
  c.exerciseId !== null && c.status === 'draft';

export const isRetryable = (c: Pick<MediaClip, 'status'>): boolean => c.status === 'failed';

export interface QueuePlan {
  /** Clips that will be queued. */
  queue: MediaClip[];
  /** Of those, the ones whose exercise already has a video, which the render replaces. */
  replacing: MediaClip[];
  /**
   * Exercises that two or more queued clips point at: only the last one rendered stays, which is
   * almost always a labelling slip.
   */
  sharedExercises: string[];
  /** Selected but without an exercise: the worker has nowhere to put them. */
  unlabelled: number;
  /** Selected but already queued or rendering. */
  waiting: number;
}

export function planQueue(clips: readonly MediaClip[], ids: Iterable<string>): QueuePlan {
  const wanted = new Set(ids);
  const plan: QueuePlan = {
    queue: [],
    replacing: [],
    sharedExercises: [],
    unlabelled: 0,
    waiting: 0,
  };
  const perExercise = new Map<string, number>();
  for (const c of clips) {
    if (!wanted.has(c.id)) continue;
    if (c.status === 'queued' || c.status === 'rendering') {
      plan.waiting++;
      continue;
    }
    if (!c.exerciseId) {
      plan.unlabelled++;
      continue;
    }
    plan.queue.push(c);
    if (c.exerciseHasVideo) plan.replacing.push(c);
    perExercise.set(c.exerciseId, (perExercise.get(c.exerciseId) ?? 0) + 1);
  }
  plan.sharedExercises = [...perExercise].filter(([, n]) => n > 1).map(([id]) => id);
  return plan;
}

/** The selected clips that can be retried. */
export function retryIds(clips: readonly MediaClip[], ids: Iterable<string>): string[] {
  const wanted = new Set(ids);
  return clips.filter((c) => wanted.has(c.id) && isRetryable(c)).map((c) => c.id);
}

/** The selected clips a paste can change (anything not being rendered). */
export function pasteIds(clips: readonly MediaClip[], ids: Iterable<string>): string[] {
  const wanted = new Set(ids);
  return clips.filter((c) => wanted.has(c.id) && !isBusy(c)).map((c) => c.id);
}

export function toggleId(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * «Выбрать все» on what is shown: selects every shown clip, or clears them when all of them are
 * already selected. Selected clips the filter hides are kept, so switching filters loses nothing.
 */
export function toggleAll(
  selected: ReadonlySet<string>,
  shown: readonly { id: string }[],
): Set<string> {
  const next = new Set(selected);
  const all = shown.length > 0 && shown.every((c) => next.has(c.id));
  for (const c of shown) {
    if (all) next.delete(c.id);
    else next.add(c.id);
  }
  return next;
}

/** The selection with clips that no longer exist dropped (after a refresh or a delete). */
export function pruneSelection(
  selected: ReadonlySet<string>,
  clips: readonly { id: string }[],
): Set<string> {
  const ids = new Set(clips.map((c) => c.id));
  return new Set([...selected].filter((id) => ids.has(id)));
}
