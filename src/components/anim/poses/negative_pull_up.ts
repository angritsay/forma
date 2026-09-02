/**
 * Negative pull-up — side view, one repetition per cycle.
 * Starts at the top (chin over the bar, after jumping or stepping up), lowers slowly and under
 * control through the halfway point to a dead hang, pauses, then quickly returns to the top
 * (the jump back up happens in the wrap from the last keyframe to t = 0).
 *
 * Geometry: the near wrist is pinned to the bar at (HAND_X, BAR_Y) on every keyframe and the root
 * moves; a mid keyframe keeps the hands on the bar between the two extremes.
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

// Top: chin over the bar, elbows low and forward, slight lean back, feet tucked behind.
const top: Pose = onBar({
  ...basePose('side'),
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
  ankleL: -18,
  ankleR: -20,
});

// Halfway: shoulders 30 below the bar.
const mid: Pose = onBar({
  ...top,
  torso: -4,
  head: -8,
  shoulderL: 118.3,
  shoulderR: 112.3,
  elbowL: 103.3,
  elbowR: 103.3,
  hipL: 24,
  hipR: 27,
  kneeL: 90,
  kneeR: 95,
});

// Dead hang: arms long, knees bent ~90°.
const hang: Pose = onBar({
  ...mid,
  torso: 0,
  head: -4,
  shoulderL: 176,
  shoulderR: 180,
  elbowL: 0,
  elbowR: 0,
  hipL: 22,
  hipR: 25,
});

export const negative_pull_up: PoseSet = {
  id: 'negative_pull_up',
  view: 'side',
  loop: 'cycle',
  durationMs: 3200,
  poster: 0.35,
  props: [{ kind: 'bar' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.1, pose: top, ease: 'linear' },
    { t: 0.42, pose: mid, ease: 'linear' },
    { t: 0.74, pose: hang, ease: 'out' },
    { t: 0.84, pose: hang, ease: 'linear' },
  ],
};
