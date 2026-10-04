import { describe, expect, it } from 'vitest';
import type { MediaClip } from '@/lib/api/mediaStudio';
import {
  filterClips,
  filterCounts,
  isQueueable,
  pasteIds,
  planQueue,
  pruneSelection,
  retryIds,
  toggleAll,
  toggleId,
} from './selection';

const clip = (id: string, over: Partial<MediaClip> = {}): MediaClip => ({
  id,
  sourceId: 's',
  exerciseId: `ex_${id}`,
  exerciseName: null,
  exerciseUnit: null,
  exerciseHasVideo: false,
  rawPath: `s/${id}.mp4`,
  rawOffsetS: 0,
  startS: 0,
  endS: 10,
  crop: null,
  grade: null,
  gradeVersion: 1,
  playMode: 'loop',
  stillAtS: null,
  autoEnhance: true,
  autoParams: null,
  status: 'draft',
  error: null,
  attempts: 0,
  renderedAt: null,
  createdAt: '2026-10-04T10:00:00Z',
  updatedAt: '2026-10-04T10:00:00Z',
  ...over,
});

const clips = [
  clip('a'),
  clip('b', { status: 'queued' }),
  clip('c', { status: 'rendering' }),
  clip('d', { status: 'done', exerciseHasVideo: true }),
  clip('e', { status: 'failed', error: 'raw_missing' }),
  clip('f', { exerciseId: null }),
];

describe('filters', () => {
  it('shows each status group', () => {
    expect(filterClips(clips, 'all')).toHaveLength(6);
    expect(filterClips(clips, 'todo').map((c) => c.id)).toEqual(['a', 'f']);
    expect(filterClips(clips, 'queued').map((c) => c.id)).toEqual(['b', 'c']);
    expect(filterClips(clips, 'done').map((c) => c.id)).toEqual(['d']);
    expect(filterClips(clips, 'failed').map((c) => c.id)).toEqual(['e']);
  });

  it('counts them', () => {
    expect(filterCounts(clips)).toEqual({ all: 6, todo: 2, queued: 2, done: 1, failed: 1 });
  });
});

describe('planQueue', () => {
  it('takes labelled clips that are not already waiting', () => {
    expect(isQueueable(clips[0]!)).toBe(true);
    expect(isQueueable(clips[5]!)).toBe(false);
    const plan = planQueue(clips, ['a', 'b', 'c', 'd', 'e', 'f']);
    expect(plan.queue.map((c) => c.id)).toEqual(['a', 'd', 'e']);
    expect(plan.waiting).toBe(2);
    expect(plan.unlabelled).toBe(1);
  });

  it('lists the clips that replace an existing video', () => {
    expect(planQueue(clips, ['a', 'd']).replacing.map((c) => c.id)).toEqual(['d']);
    expect(planQueue(clips, ['a']).replacing).toEqual([]);
  });

  it('flags two clips labelled with one exercise', () => {
    const twins = [clip('x', { exerciseId: 'squat' }), clip('y', { exerciseId: 'squat' })];
    expect(planQueue(twins, ['x', 'y']).sharedExercises).toEqual(['squat']);
    expect(planQueue(twins, ['x']).sharedExercises).toEqual([]);
  });
});

describe('retry and paste targets', () => {
  it('retries only failed clips', () => {
    expect(retryIds(clips, ['a', 'e'])).toEqual(['e']);
  });

  it('pastes onto anything not being rendered', () => {
    expect(pasteIds(clips, ['a', 'b', 'c', 'd'])).toEqual(['a', 'b', 'd']);
  });
});

describe('selection', () => {
  it('toggles one id', () => {
    const s = toggleId(new Set(['a']), 'b');
    expect([...s]).toEqual(['a', 'b']);
    expect([...toggleId(s, 'a')]).toEqual(['b']);
  });

  it('selects all shown, or clears them when all are selected, keeping hidden ones', () => {
    const shown = [{ id: 'a' }, { id: 'b' }];
    const s = toggleAll(new Set(['z']), shown);
    expect([...s].sort()).toEqual(['a', 'b', 'z']);
    expect([...toggleAll(s, shown)]).toEqual(['z']);
    expect([...toggleAll(new Set(), [])]).toEqual([]);
  });

  it('drops ids that no longer exist', () => {
    expect([...pruneSelection(new Set(['a', 'gone']), clips)]).toEqual(['a']);
  });
});
