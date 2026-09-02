/**
 * World's greatest stretch — side view, one cycle = the three positions on one side.
 * Deep lunge with both hands on the floor either side of the front foot, back leg straight on
 * the toes → the near elbow drops toward the instep (chest onto the thigh, far hand stays on the
 * floor) → hand back to the floor → chest rotates and the near arm reaches to the ceiling, eyes
 * following the hand → back to the hands-down lunge. The front foot is the pivot at x 128.
 *
 * Geometry: front shin vertical, thigh 8° above horizontal (hip at (94, 145), 27 above the
 * floor); the straight rear leg runs 77° back to an ankle 11 above the ground with the toes on
 * it. Torso 55° forward puts the shoulder 52 above the floor so the straight arms reach the
 * ground beside the foot. Rotation cannot be drawn in profile, so the reach is the arm sweeping
 * from the floor to 150° from the vertical (up and slightly forward).
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 128;

const lunge: Pose = plant(
  {
    ...basePose('side'),
    torso: 55,
    head: -38,
    shoulderR: 55,
    shoulderL: 51,
    elbowR: 0,
    elbowL: 0,
    hipR: 153,
    kneeR: 98,
    ankleR: 0,
    hipL: -20.6,
    kneeL: 0,
    ankleL: 10.6,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Elbow to the instep: chest dips onto the front thigh, near forearm low and forward.
const elbowDown: Pose = plant(
  {
    ...lunge,
    torso: 72,
    head: -50,
    shoulderR: 72,
    elbowR: 80,
    shoulderL: 22.6,
    elbowL: 53.2,
    hipR: 170,
    hipL: -3.6,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Reach: the near arm points at the ceiling, the head follows the hand.
const reach: Pose = { ...lunge, head: -55, shoulderR: 205, elbowR: 0 };

export const worlds_greatest_stretch: PoseSet = {
  id: 'worlds_greatest_stretch',
  view: 'side',
  loop: 'cycle',
  durationMs: 3000,
  pivot: 'ankleR',
  poster: 0.75,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: lunge },
    { t: 0.22, pose: elbowDown, ease: 'inOut' },
    { t: 0.3, pose: elbowDown, ease: 'linear' },
    { t: 0.45, pose: lunge, ease: 'inOut' },
    { t: 0.7, pose: reach, ease: 'inOut' },
    { t: 0.82, pose: reach, ease: 'linear' },
  ],
};
