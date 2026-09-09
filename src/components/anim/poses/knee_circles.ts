/**
 * Knee circles — side view, pingpong (0 = knees soft, 1 = knees bent).
 * Feet together, hands resting on the knees, the knees draw small circles. In profile the circle
 * reads as the knees bending and straightening a little while the hands ride along; the feet stay
 * flat and planted.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const SUPPORT_X = 100;

// Torso 40° forward, arms reaching down to the knees. Ankle = knee − hip + torso keeps the foot flat.
const soft: Pose = plant(
  {
    ...basePose('side'),
    torso: 40,
    head: -22,
    shoulderL: 56,
    shoulderR: 56,
    elbowL: 6,
    elbowR: 6,
    hipL: 52,
    hipR: 52,
    kneeL: 22,
    kneeR: 22,
    ankleL: 10,
    ankleR: 10,
  },
  'side',
  { leg: 'R', x: SUPPORT_X },
);

const bent: Pose = plant(
  {
    ...soft,
    shoulderL: 70,
    shoulderR: 70,
    hipL: 68,
    hipR: 68,
    kneeL: 38,
    kneeR: 38,
  },
  'side',
  { leg: 'R', x: SUPPORT_X },
);

export const knee_circles: PoseSet = {
  id: 'knee_circles',
  view: 'side',
  loop: 'pingpong',
  durationMs: 1200,
  pivot: 'ankleR',
  poster: 1,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: soft },
    { t: 1, pose: bent, ease: 'inOut' },
  ],
};
