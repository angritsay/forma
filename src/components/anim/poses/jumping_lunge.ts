/**
 * Jumping lunge — side view, one cycle = two landings (the legs switch twice).
 * Lunge with the near leg forward → drive up off both feet with the arms swinging → airborne,
 * legs scissoring past each other → land in the mirrored lunge → drive → airborne → back to the
 * start. No pivot: grounded keyframes are planted on the front foot (x 124), the flight
 * keyframes lift the root. The arms pump opposite to the front leg.
 *
 * Lunge geometry: front thigh horizontal over a vertical shin (the hip 34 behind the front
 * ankle), rear knee 7 above the floor, rear toes tucked with the toe tip on the ground.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 124;
const base = basePose('side');

// Rear leg in the lunge (torso 4): thigh 42.7° back, shin 96° back, foot 30° from the vertical.
const rear = { hip: -38.7, knee: 53.4, ankle: 36.1 };
// Front leg: thigh horizontal (hip = 90 + torso), shin vertical, flat foot.
const front = { hip: 94, knee: 90, ankle: 0 };

const lungeR: Pose = plant(
  {
    ...base,
    torso: 4,
    head: -3,
    shoulderR: 35,
    shoulderL: -30,
    elbowR: 90,
    elbowL: 90,
    hipR: front.hip,
    kneeR: front.knee,
    ankleR: front.ankle,
    hipL: rear.hip,
    kneeL: rear.knee,
    ankleL: rear.ankle,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

const lungeL: Pose = plant(
  {
    ...base,
    torso: 4,
    head: -3,
    shoulderL: 35,
    shoulderR: -30,
    elbowR: 90,
    elbowL: 90,
    hipL: front.hip,
    kneeL: front.knee,
    ankleL: front.ankle,
    hipR: rear.hip,
    kneeR: rear.knee,
    ankleR: rear.ankle,
  },
  'side',
  { leg: 'L', x: FOOT_X },
);

// Take-off: both legs long, front foot on the toes (ankle 7 above the ground), arms swinging up.
const driveR: Pose = plant(
  {
    ...base,
    torso: 8,
    head: -6,
    shoulderR: 96,
    shoulderL: 90,
    elbowR: 40,
    elbowL: 40,
    hipR: 18,
    kneeR: 8,
    ankleR: -25,
    hipL: -20,
    kneeL: 10,
    ankleL: -20,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y - 7 },
);

const driveL: Pose = plant(
  {
    ...driveR,
    shoulderL: 96,
    shoulderR: 90,
    hipL: 18,
    kneeL: 8,
    ankleL: -25,
    hipR: -20,
    kneeR: 10,
    ankleR: -20,
  },
  'side',
  { leg: 'L', x: FOOT_X, y: GROUND_Y - 7 },
);

// Apex: the root is 20 above standing height, toes pointed, the legs pass each other.
const apexToL: Pose = {
  ...base,
  rootX: FOOT_X - 34,
  rootY: 86,
  torso: 5,
  head: -4,
  shoulderR: 150,
  shoulderL: 144,
  elbowR: 15,
  elbowL: 15,
  hipR: -8,
  kneeR: 12,
  ankleR: -25,
  hipL: 14,
  kneeL: 30,
  ankleL: -25,
};

const apexToR: Pose = {
  ...apexToL,
  shoulderL: 150,
  shoulderR: 144,
  hipL: -8,
  kneeL: 12,
  hipR: 14,
  kneeR: 30,
};

export const jumping_lunge: PoseSet = {
  id: 'jumping_lunge',
  view: 'side',
  loop: 'cycle',
  durationMs: 1100,
  poster: 0.28,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: lungeR, ease: 'in' },
    { t: 0.16, pose: driveR, ease: 'in' },
    { t: 0.28, pose: apexToL, ease: 'out' },
    { t: 0.5, pose: lungeL, ease: 'in' },
    { t: 0.66, pose: driveL, ease: 'in' },
    { t: 0.78, pose: apexToR, ease: 'out' },
  ],
};
