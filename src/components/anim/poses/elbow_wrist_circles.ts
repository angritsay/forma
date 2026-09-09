/**
 * Elbow and wrist circles — front view, one circle per cycle.
 * Upper arms held out at shoulder height, elbows bent, the forearms draw circles. From the front
 * a circle projects as the forearm rising and falling around the vertical, with a small sweep of
 * the upper arm; the trunk is still.
 */
import { basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const mid: Pose = {
  ...basePose('front'),
  shoulderL: 88,
  shoulderR: 88,
  elbowL: 90,
  elbowR: 90,
  hipL: 10,
  hipR: 10,
};
const up: Pose = { ...mid, shoulderL: 96, shoulderR: 96, elbowL: 118, elbowR: 118 };
const down: Pose = { ...mid, shoulderL: 80, shoulderR: 80, elbowL: 62, elbowR: 62 };

export const elbow_wrist_circles: PoseSet = {
  id: 'elbow_wrist_circles',
  view: 'front',
  loop: 'cycle',
  durationMs: 1000,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: mid, ease: 'linear' },
    { t: 0.25, pose: up, ease: 'out' },
    { t: 0.5, pose: mid, ease: 'in' },
    { t: 0.75, pose: down, ease: 'out' },
  ],
};
