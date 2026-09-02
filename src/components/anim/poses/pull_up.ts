/**
 * Pull-up — side view, one repetition per cycle.
 * Dead hang (arms long, knees bent and feet tucked behind) → fast pull until the chin clears the
 * bar (elbows driven down and forward, slight lean back) → short hold → slow lower → hang.
 *
 * Geometry: the near wrist is pinned to the bar at (HAND_X, BAR_Y) on every keyframe and the
 * root moves (the bar prop is drawn at the wrist, so the hands never leave it). A mid keyframe
 * on the way up and down keeps the wrist from drifting off the bar between poses (the arm's
 * reach is nonlinear in the joint angles). The far hand sits 5 units behind the near one along
 * the bar so the lighter far arm peeks out.
 */
import { basePose, solve } from '../rig';
import type { Pose, PoseSet } from './types';

const BAR_Y = 28;
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

// Dead hang: arms vertical overhead, knees bent ~90°, toes pointed.
const hang: Pose = onBar({
  ...basePose('side'),
  torso: 0,
  head: -4,
  shoulderL: 176,
  shoulderR: 180,
  elbowL: 0,
  elbowR: 0,
  hipL: 22,
  hipR: 25,
  kneeL: 90,
  kneeR: 95,
  ankleL: -18,
  ankleR: -20,
});

// Halfway: shoulders 30 below the bar, hands 8 in front of the shoulder line.
const mid: Pose = onBar({
  ...hang,
  torso: -4,
  head: -8,
  shoulderL: 118.3,
  shoulderR: 112.3,
  elbowL: 103.3,
  elbowR: 103.3,
  hipL: 24,
  hipR: 27,
});

// Top: chin over the bar — shoulders 8 below the bar, elbows low and forward, slight lean back.
const top: Pose = onBar({
  ...hang,
  torso: -8,
  head: -12,
  shoulderL: 55.9,
  shoulderR: 49.9,
  elbowL: 146.8,
  elbowR: 146.8,
  hipL: 26,
  hipR: 30,
  kneeL: 95,
  kneeR: 100,
});

export const pull_up: PoseSet = {
  id: 'pull_up',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  poster: 0.42,
  props: [{ kind: 'bar' }],
  keyframes: [
    { t: 0, pose: hang },
    { t: 0.2, pose: mid, ease: 'in' },
    { t: 0.38, pose: top, ease: 'out' },
    { t: 0.5, pose: top, ease: 'linear' },
    { t: 0.7, pose: mid, ease: 'inOut' },
    { t: 0.9, pose: hang, ease: 'out' },
  ],
};
