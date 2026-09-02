/**
 * Lying leg raise — side view, one repetition per cycle.
 * Lying on the back (head to the left), arms by the sides with the hands under the glutes,
 * straight legs hovering above the floor → raise to vertical → lower slowly, never touching
 * down.
 *
 * Geometry: the hip stays on the floor; arms along the floor toward the feet (shoulder 0 with
 * torso −90 → absolute 90). Low: legs 10° above the floor. Top: vertical (hip 90).
 */
import { GROUND_Y, basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const low: Pose = {
  ...basePose('side'),
  rootX: 96,
  rootY: GROUND_Y - 2,
  torso: -90,
  head: 25,
  shoulderL: 0,
  shoulderR: 0,
  elbowL: 0,
  elbowR: 0,
  hipL: 10,
  hipR: 10,
  kneeL: 0,
  kneeR: 0,
  ankleL: -35,
  ankleR: -35,
};

const top: Pose = {
  ...low,
  hipL: 88,
  hipR: 92,
};

export const leg_raise: PoseSet = {
  id: 'leg_raise',
  view: 'side',
  loop: 'cycle',
  durationMs: 2200,
  poster: 0.45,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: low },
    { t: 0.4, pose: top, ease: 'inOut' },
    { t: 0.5, pose: top, ease: 'linear' },
    { t: 0.92, pose: low, ease: 'inOut' },
  ],
};
