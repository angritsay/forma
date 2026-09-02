/**
 * V-up — side view, one repetition per cycle.
 * Lying on the back (head to the left) with the arms overhead and the legs straight, both
 * hovering just above the floor → straight legs and trunk fold toward each other into a V
 * balanced on the hips, hands reaching the shins → lower together under control.
 *
 * Geometry: the hip stays on the floor. Flat: torso −90, arms 10° above the floor overhead,
 * legs 5° up, toes pointed. V: torso 50° above the floor (−40), legs 60° above it
 * (hip 110 → thigh abs 150), arms pointing at the shins (shoulder 71).
 */
import { GROUND_Y, basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const flat: Pose = {
  ...basePose('side'),
  rootX: 108,
  rootY: GROUND_Y - 2,
  torso: -90,
  head: 25,
  shoulderL: 168,
  shoulderR: 172,
  elbowL: 0,
  elbowR: 0,
  hipL: 5,
  hipR: 5,
  kneeL: 0,
  kneeR: 0,
  ankleL: -35,
  ankleR: -35,
};

const fold: Pose = {
  ...flat,
  torso: -40,
  head: 15,
  shoulderL: 68,
  shoulderR: 74,
  hipL: 108,
  hipR: 112,
};

export const v_up: PoseSet = {
  id: 'v_up',
  view: 'side',
  loop: 'cycle',
  durationMs: 1600,
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: flat },
    { t: 0.42, pose: fold, ease: 'inOut' },
    { t: 0.52, pose: fold, ease: 'linear' },
    { t: 0.92, pose: flat, ease: 'inOut' },
  ],
};
