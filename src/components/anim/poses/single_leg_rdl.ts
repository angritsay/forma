/**
 * Single-leg Romanian deadlift — side view, pingpong (hinge down, return up).
 * Standing on the near (right) leg with a soft knee, the other foot resting beside it, arms in
 * front → hinge: hips back, flat back to ~12° above horizontal, the free leg extends back in one
 * line with the torso, arms hang toward the floor → squeeze back up. The standing foot is the
 * pivot at x 100.
 *
 * Bottom geometry: torso 78° forward; standing thigh 6° forward with the shin 12° back
 * (flat foot → ankle 12); free leg 6° above the torso line (hip −6), toes pointing down.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const stand: Pose = plant(
  {
    ...basePose('side'),
    shoulderR: 30,
    shoulderL: 26,
    elbowR: 25,
    elbowL: 25,
    hipR: 6,
    kneeR: 8,
    ankleR: 2,
    hipL: 3,
    kneeL: 5,
    ankleL: 2,
  },
  'side',
  { leg: 'R', x: 100 },
);

const hinge: Pose = plant(
  {
    ...stand,
    torso: 78,
    head: -50,
    shoulderR: 86,
    shoulderL: 80,
    elbowR: 8,
    elbowL: 8,
    hipR: 84,
    kneeR: 18,
    ankleR: 12,
    hipL: -6,
    kneeL: 6,
    ankleL: -5,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const single_leg_rdl: PoseSet = {
  id: 'single_leg_rdl',
  view: 'side',
  loop: 'pingpong',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 1,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand },
    { t: 1, pose: hinge, ease: 'inOut' },
  ],
};
