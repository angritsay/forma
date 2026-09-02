/**
 * Dead hang — side view, isometric hold with a slow breathing sway.
 * Hanging from the bar with long arms, the body relaxed and slightly extended, knees soft and
 * toes pointed. Pingpong between two near-identical poses: on the "inhale" the shoulders pack a
 * touch (the body rises ~2 units) and the legs drift forward a couple of degrees.
 *
 * Geometry: the near wrist is pinned to the bar at (HAND_X, BAR_Y); the far hand sits a few
 * units behind it along the bar so the lighter far arm shows.
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

const relaxed: Pose = onBar({
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

// Inhale: shoulders pack (the body rises a touch), legs drift forward two degrees.
const inhale: Pose = onBar({
  ...relaxed,
  torso: -2,
  head: -6,
  shoulderL: 174,
  shoulderR: 178,
  elbowL: 3,
  elbowR: 3,
  hipL: 8,
  hipR: 11,
  kneeL: 20,
  kneeR: 24,
});

export const dead_hang: PoseSet = {
  id: 'dead_hang',
  view: 'side',
  loop: 'pingpong',
  durationMs: 3000,
  poster: 0,
  props: [{ kind: 'bar' }],
  keyframes: [
    { t: 0, pose: relaxed },
    { t: 1, pose: inhale, ease: 'inOut' },
  ],
};
