/**
 * Pure helpers for the course path: which node is current, per-node status, course progress,
 * week grouping and the course-state patch that completes a node. No React; unit-tested.
 *
 * `user_course_state` semantics (docs/SPEC.md §8): `completedNodeIds` lists finished nodes,
 * `currentNodeIndex` points at the node the athlete should do next. The helpers tolerate an
 * inconsistent pair (e.g. an unfinished node before the index) by exposing it as `open`.
 */
import type { Course, CourseNode } from '@/content/schema';
import type { CourseStatePatch } from '@/lib/api/types';

export type NodeStatus = 'done' | 'current' | 'open' | 'locked';

export interface PathState {
  currentNodeIndex: number;
  completedNodeIds: readonly string[];
}

export interface CourseProgress {
  done: number;
  total: number;
  /** 0..100, rounded. */
  pct: number;
}

export interface WeekGroup {
  week: number;
  deload: boolean;
  nodes: { node: CourseNode; index: number }[];
}

const EMPTY_STATE: PathState = { currentNodeIndex: 0, completedNodeIds: [] };

type NodeLike = Pick<CourseNode, 'id'>;

function clampIndex(i: number, length: number): number {
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(length, Math.floor(i)));
}

/** Index of the node the athlete should do next; -1 when every node is completed. */
export function currentNodeIndex(
  nodes: readonly NodeLike[],
  state: PathState | null | undefined,
): number {
  const s = state ?? EMPTY_STATE;
  const done = new Set(s.completedNodeIds);
  const start = clampIndex(s.currentNodeIndex, nodes.length);
  for (let i = start; i < nodes.length; i++) if (!done.has(nodes[i]!.id)) return i;
  for (let i = 0; i < start; i++) if (!done.has(nodes[i]!.id)) return i;
  return -1;
}

export function nodeStatus(
  index: number,
  nodes: readonly NodeLike[],
  state: PathState | null | undefined,
): NodeStatus {
  const s = state ?? EMPTY_STATE;
  const node = nodes[index];
  if (!node) return 'locked';
  if (s.completedNodeIds.includes(node.id)) return 'done';
  const current = currentNodeIndex(nodes, s);
  if (current === -1 || index === current) return 'current';
  return index < current ? 'open' : 'locked';
}

/** True when the node can be opened (done, current or available). */
export function isUnlocked(status: NodeStatus): boolean {
  return status !== 'locked';
}

/** The next node to do, or null when the course is finished. */
export function nextNode(course: Course, state: PathState | null | undefined): CourseNode | null {
  const i = currentNodeIndex(course.nodes, state);
  return i === -1 ? null : (course.nodes[i] ?? null);
}

export function courseProgress(
  nodes: readonly NodeLike[],
  state: PathState | null | undefined,
): CourseProgress {
  const done = new Set(state?.completedNodeIds ?? []);
  const total = nodes.length;
  const count = nodes.filter((n) => done.has(n.id)).length;
  return { done: count, total, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
}

/**
 * Course-state patch after finishing `nodeId`: the id joins `completedNodeIds` (once) and the
 * index moves to the next unfinished node — `nodes.length` when the course is complete.
 */
export function completeNodePatch(
  nodes: readonly NodeLike[],
  state: PathState | null | undefined,
  nodeId: string,
): Required<Pick<CourseStatePatch, 'currentNodeIndex' | 'completedNodeIds'>> {
  const s = state ?? EMPTY_STATE;
  const completedNodeIds = s.completedNodeIds.includes(nodeId)
    ? [...s.completedNodeIds]
    : [...s.completedNodeIds, nodeId];
  const idx = nodes.findIndex((n) => n.id === nodeId);
  const next = currentNodeIndex(nodes, {
    currentNodeIndex: Math.max(0, idx + 1),
    completedNodeIds,
  });
  return { currentNodeIndex: next === -1 ? nodes.length : next, completedNodeIds };
}

/** Nodes grouped by week in path order; a week is a deload week when any node says so. */
export function groupNodesByWeek(course: Course): WeekGroup[] {
  const groups: WeekGroup[] = [];
  course.nodes.forEach((node, index) => {
    let g = groups.find((x) => x.week === node.week);
    if (!g) {
      g = { week: node.week, deload: false, nodes: [] };
      groups.push(g);
    }
    g.nodes.push({ node, index });
    if (node.deload) g.deload = true;
  });
  return groups.sort((a, b) => a.week - b.week);
}
