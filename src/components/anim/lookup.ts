/**
 * Animation id → pose set, with a safe fallback for unknown ids (never throws).
 * Kept apart from poses/index.ts so that file stays a plain, merge-friendly registry.
 */
import { POSES } from './poses/index';
import type { PoseSet } from './poses/types';
import { basePose } from './rig';

/** Rendered for unknown ids: a relaxed standing athlete, side view. */
export const STANDING_SET: PoseSet = {
  id: 'standing',
  view: 'side',
  loop: 'cycle',
  durationMs: 1000,
  keyframes: [{ t: 0, pose: basePose('side') }],
  props: [{ kind: 'floor' }],
};

const warned = new Set<string>();

export function hasAnimation(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(POSES, id);
}

/** Pose set for an animation id; unknown ids warn once and fall back to `STANDING_SET`. */
export function getPoseSet(id: string): PoseSet {
  const set = hasAnimation(id) ? POSES[id] : undefined;
  if (set) return set;
  if (!warned.has(id)) {
    warned.add(id);
    console.warn(`[anim] unknown animation "${id}" — rendering the standing pose`);
  }
  return STANDING_SET;
}

/** Test hook: forget which ids already warned. */
export function resetAnimationWarnings(): void {
  warned.clear();
}
