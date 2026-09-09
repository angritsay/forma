/**
 * Neck circles — front view, pingpong (0 = tilt to the left, 1 = tilt to the right).
 * Standing tall with the hands on the hips, the head rolls slowly from one shoulder to the
 * other. Seen from the front the roll reads as a lateral tilt; the trunk stays perfectly still.
 */
import { basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const left: Pose = {
  ...basePose('front'),
  head: -40,
  shoulderL: 28,
  shoulderR: 28,
  elbowL: 108,
  elbowR: 108,
  hipL: 8,
  hipR: 8,
};
const right: Pose = { ...left, head: 40 };

export const neck_circles: PoseSet = {
  id: 'neck_circles',
  view: 'front',
  loop: 'pingpong',
  durationMs: 1800,
  poster: 1,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: left },
    { t: 1, pose: right, ease: 'inOut' },
  ],
};
