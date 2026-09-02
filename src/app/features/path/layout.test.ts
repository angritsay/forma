import { describe, expect, it } from 'vitest';
import { getCourse } from '@/content/registry';
import { AMPLITUDE, HEADER_H, layoutPath, nodeOffset, pathSegments, ROW_H } from './layout';
import { groupNodesByWeek, nodeStatus, type PathState } from './nodeState';

describe('nodeOffset', () => {
  it('alternates right → centre → left → centre within the amplitude', () => {
    expect(nodeOffset(0)).toBe(AMPLITUDE);
    expect(nodeOffset(1)).toBe(0);
    expect(nodeOffset(2)).toBe(-AMPLITUDE);
    expect(nodeOffset(3)).toBe(0);
    expect(nodeOffset(4)).toBe(AMPLITUDE);
  });
});

describe('layoutPath', () => {
  const course = getCourse('start');
  const groups = groupNodesByWeek(course);
  const state: PathState = { currentNodeIndex: 2, completedNodeIds: ['w1_d1_test', 'w1_d2_rest'] };
  const layout = layoutPath(groups, (i) => nodeStatus(i, course.nodes, state));

  it('emits one header per week and one row per node, in order', () => {
    const headers = layout.rows.filter((r) => r.kind === 'header');
    expect(headers.map((h) => (h.kind === 'header' ? h.week : -1))).toEqual([1, 2, 3, 4]);
    expect(layout.nodes.length).toBe(course.nodes.length);
    expect(layout.nodes.map((n) => n.index)).toEqual(course.nodes.map((_, i) => i));
  });
  it('stacks rows without overlap', () => {
    for (let i = 1; i < layout.nodes.length; i++) {
      const prev = layout.nodes[i - 1]!;
      const cur = layout.nodes[i]!;
      expect(cur.y - prev.y).toBeGreaterThanOrEqual(ROW_H);
    }
    const first = layout.rows[0];
    const second = layout.rows[1];
    expect(first?.kind).toBe('header');
    expect(second?.kind).toBe('node');
    if (first?.kind === 'header' && second?.kind === 'node') {
      expect(second.y).toBeGreaterThan(first.y + HEADER_H);
    }
    expect(layout.height).toBeGreaterThan(layout.nodes[layout.nodes.length - 1]!.y);
  });
  it('counts done nodes per week header', () => {
    const week1 = layout.rows[0];
    expect(week1?.kind === 'header' && week1.done).toBe(2);
  });
  it('connects consecutive nodes and colors finished segments', () => {
    const segments = pathSegments(layout.nodes, 200);
    expect(segments.length).toBe(layout.nodes.length - 1);
    expect(segments[0]?.done).toBe(true); // done → done
    expect(segments[1]?.done).toBe(true); // done → current
    expect(segments[2]?.done).toBe(false); // current → locked
    expect(segments[0]?.d.startsWith(`M${200 + AMPLITUDE} `)).toBe(true);
  });
});
