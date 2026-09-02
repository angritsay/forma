/**
 * Jumping jacks — front view, one jump out + one jump in per cycle.
 * Feet together, arms by the sides → jump: feet spread just wider than the shoulders while the
 * straight arms swing out and overhead → jump back together. Grounded keyframes are planted;
 * the airborne ones lift the root.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const together: Pose = plant(
  {
    ...basePose('front'),
    shoulderL: 8,
    shoulderR: 8,
    elbowL: 4,
    elbowR: 4,
    hipL: 4,
    hipR: 4,
    kneeL: 0,
    kneeR: 0,
    ankleL: 0,
    ankleR: 0,
  },
  'front',
  { leg: 'R', y: GROUND_Y },
);

// Feet wide, hands meeting overhead (abduction past vertical brings them together).
const apart: Pose = plant(
  { ...together, shoulderL: 186, shoulderR: 186, hipL: 28, hipR: 28 },
  'front',
  { leg: 'R', y: GROUND_Y },
);

// Airborne midpoints: legs and arms halfway, root lifted.
const flightOut: Pose = {
  ...together,
  rootY: together.rootY - 9,
  shoulderL: 95,
  shoulderR: 95,
  hipL: 16,
  hipR: 16,
};
const flightIn: Pose = { ...flightOut, shoulderL: 100, shoulderR: 100 };

export const jumping_jack: PoseSet = {
  id: 'jumping_jack',
  view: 'front',
  loop: 'cycle',
  durationMs: 800,
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: together, ease: 'in' },
    { t: 0.25, pose: flightOut, ease: 'out' },
    { t: 0.5, pose: apart, ease: 'in' },
    { t: 0.75, pose: flightIn, ease: 'out' },
  ],
};
