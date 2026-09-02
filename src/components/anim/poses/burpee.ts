/**
 * Burpee — side view, one repetition per cycle.
 * Stand → squat down with the hands on the floor in front of the feet → hop the feet back
 * (hips up, knees tucked) → high plank → push-up, chest to the floor → plank → hop the feet back
 * in → jump with the arms swinging → airborne, hands together overhead (the clap) → soft landing
 * → stand. No pivot: the feet move, so every grounded keyframe is planted and the flight phase
 * lifts the root.
 *
 * Geometry: feet at x 104, hands at x 136 (32 in front of the feet) — the plank and push-up
 * are the push_up poses shifted so the wrists stay on that spot (ankle at x 33.2). Squat with
 * hands down: hip at (84, 137), torso 72° forward, straight arms angled 10° back to the floor.
 * Hop: hips at (77, 133) with the legs tucked so both feet are ~7 above the floor mid-jump.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 104;
const HAND_X = 136;
const PLANK_ANKLE = { x: HAND_X - 102.8, y: GROUND_Y - 11 };

const stand: Pose = plant(basePose('side'), 'side', { leg: 'R', x: FOOT_X });

const squatHands: Pose = plant(
  {
    ...stand,
    torso: 72,
    head: -45,
    shoulderR: 76.4,
    shoulderL: 72.4,
    elbowR: 15.5,
    elbowL: 15.5,
    // Thigh 80° forward, shin 25° forward (knee over the toes), flat foot.
    hipR: 152,
    hipL: 152,
    kneeR: 105,
    kneeL: 105,
    ankleR: 25,
    ankleL: 25,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Feet in the air between the squat and the plank: hands planted, hips up, knees tucked.
const hop: Pose = {
  ...stand,
  rootX: 76.7,
  rootY: 132.6,
  torso: 80,
  head: -45,
  shoulderR: 92.2,
  shoulderL: 88.2,
  elbowR: 13.7,
  elbowL: 13.7,
  hipR: 110,
  hipL: 110,
  kneeR: 125,
  kneeL: 125,
  ankleR: -10,
  ankleL: -10,
};

const plank: Pose = plant(
  {
    ...stand,
    torso: 69.2,
    head: -12,
    shoulderL: 69.2,
    shoulderR: 69.2,
    elbowL: 0,
    elbowR: 0,
    ankleL: 2.8,
    ankleR: 2.8,
  },
  'side',
  { leg: 'R', x: PLANK_ANKLE.x, y: PLANK_ANKLE.y },
);

const pushBottom: Pose = plant(
  {
    ...plank,
    torso: 84.3,
    shoulderL: 9.3,
    shoulderR: 9.3,
    elbowL: 125.5,
    elbowR: 125.5,
    ankleL: 17.9,
    ankleR: 17.9,
  },
  'side',
  { leg: 'R', x: PLANK_ANKLE.x, y: PLANK_ANKLE.y },
);

// Take-off: fully extended on the toes, arms swinging up past horizontal.
const takeoff: Pose = plant(
  {
    ...stand,
    torso: 10,
    head: -7,
    hipL: 10,
    hipR: 10,
    ankleL: -25,
    ankleR: -25,
    shoulderL: 130,
    shoulderR: 138,
    elbowL: 8,
    elbowR: 8,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y - 7 },
);

// Apex: root 24 above standing, legs long, toes pointed, hands together overhead.
const apex: Pose = {
  ...stand,
  rootY: stand.rootY - 24,
  torso: 4,
  head: -3,
  hipL: 4,
  hipR: 4,
  ankleL: -30,
  ankleR: -30,
  shoulderL: 172,
  shoulderR: 178,
  elbowL: 6,
  elbowR: 6,
};

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
  { leg: 'R', x: FOOT_X },
);

export const burpee: PoseSet = {
  id: 'burpee',
  view: 'side',
  loop: 'cycle',
  durationMs: 1700,
  poster: 0.78,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand, ease: 'out' },
    { t: 0.1, pose: squatHands, ease: 'in' },
    { t: 0.16, pose: hop, ease: 'out' },
    { t: 0.24, pose: plank, ease: 'in' },
    { t: 0.35, pose: pushBottom, ease: 'inOut' },
    { t: 0.46, pose: plank, ease: 'inOut' },
    { t: 0.52, pose: hop, ease: 'out' },
    { t: 0.58, pose: squatHands, ease: 'in' },
    { t: 0.68, pose: takeoff, ease: 'in' },
    { t: 0.78, pose: apex, ease: 'out' },
    { t: 0.9, pose: landing, ease: 'in' },
  ],
};
