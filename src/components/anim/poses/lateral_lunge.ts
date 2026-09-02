/**
 * Lateral lunge — front view, one lunge to each side per cycle.
 * Standing hip-width → step the right foot wide, sit the hips back and down over it with the
 * knee tracking over the foot while the left leg stays straight → push back to standing → the
 * same to the left.
 *
 * Geometry: the stationary foot stays planted (each keyframe is planted on it); in the lunge the
 * bent thigh is 45° from the vertical with a vertical shin (hip 53 / knee 45 with the trunk
 * leaning 8° into the lunge), the hips drop ~10 units and the straight leg reaches 32° out.
 * Arms reach forward-down for balance (drawn as 30° of abduction).
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const stance: Pose = plant(
  { ...basePose('front'), shoulderL: 10, shoulderR: 10, elbowL: 8, elbowR: 8, hipL: 8, hipR: 8 },
  'front',
  { leg: 'R', y: GROUND_Y },
);
const LEFT_FOOT_X = 84.8; // stance ankle x of the left foot (mirror: 115.2 for the right)

// Right foot lifted, stepping out.
const stepR: Pose = plant(
  { ...stance, shoulderL: 18, shoulderR: 18, elbowL: 0, elbowR: 0, hipR: 32, kneeR: 25 },
  'front',
  { leg: 'L', x: LEFT_FOOT_X, y: GROUND_Y },
);

const lungeR: Pose = plant(
  {
    ...stance,
    torso: 8,
    head: -8,
    shoulderL: 30,
    shoulderR: 30,
    elbowL: 0,
    elbowR: 0,
    hipR: 53,
    kneeR: 45,
    ankleR: 0,
    hipL: 23.9,
    kneeL: 0,
    ankleL: -32,
  },
  'front',
  { leg: 'L', x: LEFT_FOOT_X, y: GROUND_Y },
);

const stepL: Pose = plant(
  { ...stance, shoulderL: 18, shoulderR: 18, elbowL: 0, elbowR: 0, hipL: 32, kneeL: 25 },
  'front',
  { leg: 'R', x: 200 - LEFT_FOOT_X, y: GROUND_Y },
);

const lungeL: Pose = plant(
  {
    ...stance,
    torso: -8,
    head: 8,
    shoulderL: 30,
    shoulderR: 30,
    elbowL: 0,
    elbowR: 0,
    hipL: 53,
    kneeL: 45,
    ankleL: 0,
    hipR: 23.9,
    kneeR: 0,
    ankleR: -32,
  },
  'front',
  { leg: 'R', x: 200 - LEFT_FOOT_X, y: GROUND_Y },
);

export const lateral_lunge: PoseSet = {
  id: 'lateral_lunge',
  view: 'front',
  loop: 'cycle',
  durationMs: 2400,
  poster: 0.3,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stance },
    { t: 0.12, pose: stepR, ease: 'out' },
    { t: 0.3, pose: lungeR, ease: 'inOut' },
    { t: 0.5, pose: stance, ease: 'inOut' },
    { t: 0.62, pose: stepL, ease: 'out' },
    { t: 0.8, pose: lungeL, ease: 'inOut' },
  ],
};
