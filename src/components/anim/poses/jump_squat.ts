/**
 * Jump squat — side view, one repetition per cycle.
 * Stand → squat with the arms swung back (counter-movement) → explosive extension onto the toes
 * with the arms driving forward → airborne, legs long, arms overhead → soft squat landing → stand.
 * No pivot: the root rises during the flight phase; grounded keyframes are planted.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const stand: Pose = plant(basePose('side'), 'side', { leg: 'R', x: 100 });

// Counter-movement squat: hips back, torso ~35° forward, arms swung behind the hips.
const squat: Pose = plant(
  {
    ...stand,
    torso: 35,
    head: -25,
    hipL: 100,
    hipR: 100,
    kneeL: 105,
    kneeR: 105,
    ankleL: 105 - 100 + 35, // flat foot: knee − hip + torso
    ankleR: 105 - 100 + 35,
    shoulderL: -40,
    shoulderR: -34,
    elbowL: 15,
    elbowR: 15,
  },
  'side',
  { leg: 'R', x: 100 },
);

// Take-off: body fully extended on the toes, arms swinging up past horizontal.
// Toes pointed (ankle −25 with the shin ~10° back): the toe tip stays on the ground, so the ankle
// sits 12·cos(55°) ≈ 7 above the ground line.
const takeoff: Pose = plant(
  {
    ...stand,
    torso: 10,
    head: -7,
    hipL: 10,
    hipR: 10,
    kneeL: 0,
    kneeR: 0,
    ankleL: -25,
    ankleR: -25,
    shoulderL: 130,
    shoulderR: 138,
    elbowL: 8,
    elbowR: 8,
  },
  'side',
  { leg: 'R', x: 100, y: GROUND_Y - 7 },
);

// Apex: the root rises 26 units, legs long, toes pointed, arms overhead.
const apex: Pose = {
  ...takeoff,
  rootY: stand.rootY - 26,
  torso: 5,
  head: -3,
  hipL: 6,
  hipR: 6,
  ankleL: -30,
  ankleR: -30,
  shoulderL: 156,
  shoulderR: 164,
  elbowL: 6,
  elbowR: 6,
};

// Landing: soft quarter squat, arms swinging forward for balance.
const landing: Pose = plant(
  {
    ...stand,
    torso: 24,
    head: -17,
    hipL: 68,
    hipR: 68,
    kneeL: 72,
    kneeR: 72,
    ankleL: 72 - 68 + 24,
    ankleR: 72 - 68 + 24,
    shoulderL: 84,
    shoulderR: 92,
    elbowL: 18,
    elbowR: 18,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const jump_squat: PoseSet = {
  id: 'jump_squat',
  view: 'side',
  loop: 'cycle',
  durationMs: 1000,
  poster: 0.6,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand },
    { t: 0.3, pose: squat, ease: 'inOut' },
    { t: 0.45, pose: takeoff, ease: 'in' },
    { t: 0.6, pose: apex, ease: 'out' },
    { t: 0.78, pose: landing, ease: 'in' },
    { t: 0.92, pose: stand, ease: 'out' },
  ],
};
