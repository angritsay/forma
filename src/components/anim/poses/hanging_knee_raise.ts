/**
 * Hanging knee raise — side view, one repetition per cycle.
 * Dead hang with long legs → knees pulled up to hip height with a posterior pelvic tilt (the
 * torso leans back a few degrees, chin slightly down) → short squeeze → controlled lower.
 *
 * Geometry: the near wrist is pinned to the bar at (HAND_X, BAR_Y) on every keyframe and the
 * root follows; the arms stay vertical in the world (shoulder = 180 + torso).
 */
import { basePose, solve } from '../rig';
import type { Pose, PoseSet } from './types';

const BAR_Y = 16;
const HAND_X = 100;

/** Shift the root so the near wrist sits on the bar. */
const onBar = (pose: Pose): Pose => {
  const { joints } = solve(pose, 'side');
  return {
    ...pose,
    rootX: pose.rootX + (HAND_X - joints.wristR.x),
    rootY: pose.rootY + (BAR_Y - joints.wristR.y),
  };
};

const hang: Pose = onBar({
  ...basePose('side'),
  torso: 0,
  head: -4,
  shoulderL: 176,
  shoulderR: 180,
  elbowL: 0,
  elbowR: 0,
  hipL: 6,
  hipR: 9,
  kneeL: 18,
  kneeR: 22,
  ankleL: -25,
  ankleR: -28,
});

// Knees at hip height, shins hanging, pelvis tucked (torso −12 keeps the arms vertical via
// shoulder = 180 + torso).
const raised: Pose = onBar({
  ...hang,
  torso: -12,
  head: 6,
  shoulderL: 164,
  shoulderR: 168,
  hipL: 104,
  hipR: 110,
  kneeL: 112,
  kneeR: 118,
  ankleL: -20,
  ankleR: -22,
});

export const hanging_knee_raise: PoseSet = {
  id: 'hanging_knee_raise',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  poster: 0.45,
  props: [{ kind: 'bar' }],
  keyframes: [
    { t: 0, pose: hang },
    { t: 0.4, pose: raised, ease: 'inOut' },
    { t: 0.52, pose: raised, ease: 'linear' },
    { t: 0.9, pose: hang, ease: 'inOut' },
  ],
};
