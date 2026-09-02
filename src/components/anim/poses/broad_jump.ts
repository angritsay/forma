/**
 * Standing broad jump — side view, one jump per cycle.
 * Stand on the left of the tile → hinge back with the arms behind → drive forward and up onto the
 * toes with the arms swinging through → flight, legs reaching forward → squat landing on the right
 * → stand. The last keyframe sits at t = 1 so the loop cuts back to the start instead of sliding.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const START_X = 60;
const LAND_X = 134;

const stand: Pose = plant(basePose('side'), 'side', { leg: 'R', x: START_X });

// Counter-movement: hips back, torso ~45°, arms swung well behind.
const load: Pose = plant(
  {
    ...stand,
    torso: 45,
    head: -32,
    hipL: 85,
    hipR: 85,
    kneeL: 72,
    kneeR: 72,
    ankleL: 72 - 85 + 45,
    ankleR: 72 - 85 + 45,
    shoulderL: -52,
    shoulderR: -46,
    elbowL: 12,
    elbowR: 12,
  },
  'side',
  { leg: 'R', x: START_X },
);

// Take-off: body extended along a forward lean, toes on the ground, arms swinging up.
const takeoff: Pose = plant(
  {
    ...stand,
    torso: 30,
    head: -20,
    hipL: 30,
    hipR: 30,
    kneeL: 0,
    kneeR: 0,
    ankleL: -30,
    ankleR: -30,
    shoulderL: 126,
    shoulderR: 134,
    elbowL: 10,
    elbowR: 10,
  },
  'side',
  { leg: 'R', x: START_X, y: GROUND_Y - 6 },
);

// Flight: root up and forward, legs swinging through, arms forward.
const flight: Pose = {
  ...stand,
  rootX: (START_X + LAND_X) / 2,
  rootY: stand.rootY - 22,
  torso: 22,
  head: -15,
  hipL: 66,
  hipR: 74,
  kneeL: 48,
  kneeR: 48,
  ankleL: -5,
  ankleR: -5,
  shoulderL: 112,
  shoulderR: 120,
  elbowL: 14,
  elbowR: 14,
};

// Landing squat: feet under the hips, arms forward for balance.
const landing: Pose = plant(
  {
    ...stand,
    torso: 36,
    head: -25,
    hipL: 96,
    hipR: 96,
    kneeL: 100,
    kneeR: 100,
    ankleL: 100 - 96 + 36,
    ankleR: 100 - 96 + 36,
    shoulderL: 96,
    shoulderR: 104,
    elbowL: 18,
    elbowR: 18,
  },
  'side',
  { leg: 'R', x: LAND_X },
);

const standEnd: Pose = plant(stand, 'side', { leg: 'R', x: LAND_X });

export const broad_jump: PoseSet = {
  id: 'broad_jump',
  view: 'side',
  loop: 'cycle',
  durationMs: 1300,
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand },
    { t: 0.24, pose: load, ease: 'inOut' },
    { t: 0.36, pose: takeoff, ease: 'in' },
    { t: 0.52, pose: flight, ease: 'out' },
    { t: 0.68, pose: landing, ease: 'in' },
    { t: 0.86, pose: standEnd, ease: 'out' },
    { t: 1, pose: standEnd, ease: 'linear' },
  ],
};
