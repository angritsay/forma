/**
 * Geometry of the winding course path: rows (week headers and nodes) with absolute y positions,
 * a gentle sine x-offset per node and the bezier segments that connect consecutive nodes.
 * Pure so the DOM and the SVG overlay agree on every coordinate.
 */
import type { CourseNode } from '@/content/schema';
import type { NodeStatus, WeekGroup } from './nodeState';

export const NODE_SIZE = 72;
/** Height reserved per node (circle + two label lines). */
export const ROW_H = 140;
export const HEADER_H = 56;
/** Max horizontal offset of a node from the centre line, px. */
export const AMPLITUDE = 64;
export const PAD_TOP = 8;
export const PAD_BOTTOM = 24;

export type PathRow =
  | {
      kind: 'header';
      week: number;
      deload: boolean;
      done: number;
      total: number;
      /** Top edge. */
      y: number;
    }
  | {
      kind: 'node';
      node: CourseNode;
      /** Index in course.nodes. */
      index: number;
      status: NodeStatus;
      /** Centre of the circle. */
      y: number;
      /** Horizontal offset from the centre line. */
      x: number;
    };

export interface PathLayout {
  rows: PathRow[];
  height: number;
  /** Node rows only, in path order (for the connecting curve). */
  nodes: Extract<PathRow, { kind: 'node' }>[];
}

/** Sine wave with a period of four nodes: right → centre → left → centre → … */
export function nodeOffset(index: number): number {
  return Math.round(AMPLITUDE * Math.sin((index * Math.PI) / 2 + Math.PI / 2));
}

export function layoutPath(
  groups: readonly WeekGroup[],
  statusOf: (index: number) => NodeStatus,
): PathLayout {
  const rows: PathRow[] = [];
  const nodes: Extract<PathRow, { kind: 'node' }>[] = [];
  let y = PAD_TOP;
  for (const g of groups) {
    const total = g.nodes.length;
    const done = g.nodes.filter(({ index }) => statusOf(index) === 'done').length;
    rows.push({ kind: 'header', week: g.week, deload: g.deload, done, total, y });
    y += HEADER_H;
    for (const { node, index } of g.nodes) {
      const row: Extract<PathRow, { kind: 'node' }> = {
        kind: 'node',
        node,
        index,
        status: statusOf(index),
        y: y + NODE_SIZE / 2,
        x: nodeOffset(index),
      };
      rows.push(row);
      nodes.push(row);
      y += ROW_H;
    }
  }
  return { rows, nodes, height: y + PAD_BOTTOM };
}

export interface PathSegment {
  d: string;
  /** Both ends reached: drawn in the accent color. */
  done: boolean;
}

/** Vertical-tangent cubic between consecutive nodes; `centerX` is the container centre in px. */
export function pathSegments(
  nodes: readonly Extract<PathRow, { kind: 'node' }>[],
  centerX: number,
): PathSegment[] {
  const out: PathSegment[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]!;
    const b = nodes[i + 1]!;
    const ax = centerX + a.x;
    const bx = centerX + b.x;
    const mid = (a.y + b.y) / 2;
    const d = `M${ax} ${a.y} C${ax} ${mid}, ${bx} ${mid}, ${bx} ${b.y}`;
    const done = a.status === 'done' && (b.status === 'done' || b.status === 'current');
    out.push({ d, done });
  }
  return out;
}
