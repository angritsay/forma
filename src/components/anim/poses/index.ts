/**
 * Pose-set registry. To add an animation: create `poses/<id>.ts` exporting `const <id>: PoseSet`,
 * add one import line below and one entry in `POSES` — keep both lists sorted alphabetically,
 * one per line, so parallel additions merge cleanly.
 */
import type { PoseSet } from './types';
import { air_squat } from './air_squat';

export const POSES: Record<string, PoseSet> = {
  air_squat,
};

/** Registered animation ids, sorted. */
export const ANIMATION_IDS: readonly string[] = Object.keys(POSES).sort();

export type { Ease, Keyframe, Pose, PoseKey, PoseSet, Prop, View } from './types';
