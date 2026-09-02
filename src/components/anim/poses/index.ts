/**
 * Pose-set registry. To add an animation: create `poses/<id>.ts` exporting `const <id>: PoseSet`,
 * add one import line below and one entry in `POSES` — keep both lists sorted alphabetically,
 * one per line, so parallel additions merge cleanly.
 */
import type { PoseSet } from './types';
import { air_squat } from './air_squat';
import { dead_bug } from './dead_bug';
import { flutter_kick } from './flutter_kick';
import { hollow_hold } from './hollow_hold';
import { leg_raise } from './leg_raise';
import { plank } from './plank';
import { side_plank } from './side_plank';
import { sit_up } from './sit_up';
import { superman } from './superman';
import { v_up } from './v_up';

export const POSES: Record<string, PoseSet> = {
  air_squat,
  dead_bug,
  flutter_kick,
  hollow_hold,
  leg_raise,
  plank,
  side_plank,
  sit_up,
  superman,
  v_up,
};

/** Registered animation ids, sorted. */
export const ANIMATION_IDS: readonly string[] = Object.keys(POSES).sort();

export type { Ease, Keyframe, Pose, PoseKey, PoseSet, Prop, View } from './types';
