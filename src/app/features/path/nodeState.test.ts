import { describe, expect, it } from 'vitest';
import { getCourse } from '@/content/registry';
import {
  completeNodePatch,
  courseProgress,
  currentNodeIndex,
  groupNodesByWeek,
  nextNode,
  nodeStatus,
} from './nodeState';

const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

describe('currentNodeIndex', () => {
  it('starts at the first node without state', () => {
    expect(currentNodeIndex(nodes, null)).toBe(0);
    expect(currentNodeIndex(nodes, undefined)).toBe(0);
  });
  it('follows the stored index past completed nodes', () => {
    expect(currentNodeIndex(nodes, { currentNodeIndex: 2, completedNodeIds: ['a', 'b'] })).toBe(2);
    expect(currentNodeIndex(nodes, { currentNodeIndex: 1, completedNodeIds: ['a', 'b'] })).toBe(2);
  });
  it('falls back to an unfinished earlier node when the index ran past the end', () => {
    expect(currentNodeIndex(nodes, { currentNodeIndex: 4, completedNodeIds: ['a', 'c', 'd'] })).toBe(
      1,
    );
  });
  it('returns -1 when everything is done', () => {
    expect(
      currentNodeIndex(nodes, { currentNodeIndex: 4, completedNodeIds: ['a', 'b', 'c', 'd'] }),
    ).toBe(-1);
  });
  it('tolerates garbage indexes', () => {
    expect(currentNodeIndex(nodes, { currentNodeIndex: -5, completedNodeIds: [] })).toBe(0);
    expect(currentNodeIndex(nodes, { currentNodeIndex: Number.NaN, completedNodeIds: [] })).toBe(0);
    expect(currentNodeIndex(nodes, { currentNodeIndex: 99, completedNodeIds: ['a'] })).toBe(1);
  });
});

describe('nodeStatus', () => {
  const state = { currentNodeIndex: 2, completedNodeIds: ['a', 'b'] };
  it('classifies done / current / locked', () => {
    expect(nodeStatus(0, nodes, state)).toBe('done');
    expect(nodeStatus(1, nodes, state)).toBe('done');
    expect(nodeStatus(2, nodes, state)).toBe('current');
    expect(nodeStatus(3, nodes, state)).toBe('locked');
  });
  it('exposes an unfinished node before the current one as open', () => {
    const s = { currentNodeIndex: 2, completedNodeIds: ['a'] };
    // First unfinished node from the index is 'c' (2); 'b' is open, not locked.
    expect(nodeStatus(2, nodes, s)).toBe('current');
    expect(nodeStatus(1, nodes, s)).toBe('open');
  });
  it('is locked for indexes outside the path', () => {
    expect(nodeStatus(10, nodes, state)).toBe('locked');
  });
});

describe('courseProgress', () => {
  it('counts only ids that exist in the course', () => {
    expect(courseProgress(nodes, { currentNodeIndex: 0, completedNodeIds: ['a', 'zzz'] })).toEqual({
      done: 1,
      total: 4,
      pct: 25,
    });
    expect(courseProgress(nodes, null)).toEqual({ done: 0, total: 4, pct: 0 });
    expect(courseProgress([], null)).toEqual({ done: 0, total: 0, pct: 0 });
  });
});

describe('completeNodePatch', () => {
  it('adds the id once and advances to the next unfinished node', () => {
    const patch = completeNodePatch(nodes, { currentNodeIndex: 1, completedNodeIds: ['a'] }, 'b');
    expect(patch).toEqual({ currentNodeIndex: 2, completedNodeIds: ['a', 'b'] });
    const again = completeNodePatch(nodes, patch, 'b');
    expect(again.completedNodeIds).toEqual(['a', 'b']);
    expect(again.currentNodeIndex).toBe(2);
  });
  it('points past the end when the course is finished', () => {
    const patch = completeNodePatch(
      nodes,
      { currentNodeIndex: 3, completedNodeIds: ['a', 'b', 'c'] },
      'd',
    );
    expect(patch.currentNodeIndex).toBe(4);
  });
  it('keeps the index on a repeat of an earlier node', () => {
    const patch = completeNodePatch(nodes, { currentNodeIndex: 3, completedNodeIds: ['a', 'b', 'c'] }, 'a');
    expect(patch.currentNodeIndex).toBe(3);
  });
});

describe('with real content', () => {
  const course = getCourse('start');
  it('nextNode is the baseline test for a fresh athlete', () => {
    expect(nextNode(course, null)?.kind).toBe('test');
  });
  it('groups nodes by week in order with global indexes', () => {
    const groups = groupNodesByWeek(course);
    expect(groups.map((g) => g.week)).toEqual([1, 2, 3, 4]);
    expect(groups[0]?.nodes[0]?.index).toBe(0);
    const total = groups.reduce((n, g) => n + g.nodes.length, 0);
    expect(total).toBe(course.nodes.length);
  });
  it('marks deload weeks', () => {
    const engine = getCourse('engine');
    const week4 = groupNodesByWeek(engine).find((g) => g.week === 4);
    expect(week4?.deload).toBe(true);
  });
});
