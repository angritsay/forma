/**
 * How a clip's state reads in the studio: one chip per status, and what the owner can do next.
 *
 * `rendering` is shown only while a live run holds the clip; a clip from a dead run comes back as
 * queued on the worker's next pass (0060), so there is no «stuck» state to draw.
 */
import type { ChipTone } from '@/components/ui/Chip';
import type { MediaClip, MediaClipStatus, MediaSource } from '@/lib/api/mediaStudio';
import type { TKey } from '@/i18n/index';

export const STATUS_LABEL: Record<MediaClipStatus, TKey> = {
  draft: 'app.studioStatusDraft',
  queued: 'app.studioStatusQueued',
  rendering: 'app.studioStatusRendering',
  done: 'app.studioStatusDone',
  failed: 'app.studioStatusFailed',
};

export const STATUS_TONE: Record<MediaClipStatus, ChipTone> = {
  draft: 'default',
  queued: 'accent',
  rendering: 'warning',
  done: 'success',
  failed: 'danger',
};

/** A draft with no exercise cannot be queued: the label is the next step. */
export function needsLabel(c: Pick<MediaClip, 'status' | 'exerciseId'>): boolean {
  return c.status === 'draft' && !c.exerciseId;
}

export type StudioFilter = 'all' | 'draft' | 'queued' | 'done' | 'failed';

/** Which filter a status belongs to; rendering sits with queued (both are «in the works»). */
export function filterOf(s: MediaClipStatus): Exclude<StudioFilter, 'all'> {
  return s === 'rendering' ? 'queued' : s;
}

export function matchesFilter(c: Pick<MediaClip, 'status'>, f: StudioFilter): boolean {
  return f === 'all' || filterOf(c.status) === f;
}

/** Clip counts per filter, for the tab badges. */
export function countByFilter(
  clips: readonly Pick<MediaClip, 'status'>[],
): Record<StudioFilter, number> {
  const out: Record<StudioFilter, number> = { all: 0, draft: 0, queued: 0, done: 0, failed: 0 };
  for (const c of clips) {
    out.all++;
    out[filterOf(c.status)]++;
  }
  return out;
}

/** Drafts of a source: its clips not yet sent, done, queued or failed. */
export function sourceDrafts(s: Pick<MediaSource, 'clips' | 'done' | 'queued' | 'failed'>): number {
  return Math.max(0, s.clips - s.done - s.queued - s.failed);
}

/** Clips of one source, in the order they were filmed. */
export function clipsOfSource(clips: readonly MediaClip[], sourceId: string): MediaClip[] {
  return clips.filter((c) => c.sourceId === sourceId).sort((a, b) => a.startS - b.startS);
}
