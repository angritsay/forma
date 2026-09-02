/**
 * Tuck jump — side view, one repetition per cycle.
 * Stand → quick dip with the arms back → extension onto the toes → apex with both knees pulled
 * to the chest and the hands meeting the knees → soft landing → stand.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const stand: Pose = plant(basePose('side'), 'side', { leg: 'R', x: 100 });

const dip: Pose = plant(
  {
    ...stand,
    torso: 20,
    head: -14,
    hipL: 50,
    hipR: 50,
    kneeL: 55,
    kneeR: 55,
    ankleL: 55 - 50 + 20,
    ankleR: 55 - 50 + 20,
    shoulderL: -34,
    shoulderR: -28,
    elbowL: 20,
    elbowR: 20,
  },
  'side',
  { leg: 'R', x: 100 },
);

// Extended on the toes, arms swinging forward. Toe tip on the ground → ankle ≈ 7 above it.
const takeoff: Pose = plant(
  {
    ...stand,
    torso: 8,
    head: -6,
    hipL: 8,
    hipR: 8,
    kneeL: 0,
    kneeR: 0,
    ankleL: -25,
    ankleR: -25,
    shoulderL: 96,
    shoulderR: 104,
    elbowL: 10,
    elbowR: 10,
  },
  'side',
  { leg: 'R', x: 100, y: GROUND_Y - 7 },
);

// Apex: root up 26 units, knees to the chest, feet tucked under, hands at the knees.
const tuck: Pose = {
  ...stand,
  rootY: stand.rootY - 26,
  torso: 15,
  head: -10,
  hipL: 112,
  hipR: 118,
  kneeL: 125,
  kneeR: 125,
  ankleL: -20,
  ankleR: -20,
  shoulderL: 64,
  shoulderR: 70,
  elbowL: 62,
  elbowR: 62,
};

const landing: Pose = plant(
  {
    ...stand,
    torso: 22,
    head: -15,
    hipL: 56,
    hipR: 56,
    kneeL: 62,
    kneeR: 62,
    ankleL: 62 - 56 + 22,
    ankleR: 62 - 56 + 22,
    shoulderL: 50,
    shoulderR: 58,
    elbowL: 25,
    elbowR: 25,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const tuck_jump: PoseSet = {
  id: 'tuck_jump',
  view: 'side',
  loop: 'cycle',
  durationMs: 900,
  poster: 0.55,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand },
    { t: 0.25, pose: dip, ease: 'inOut' },
    { t: 0.38, pose: takeoff, ease: 'in' },
    { t: 0.55, pose: tuck, ease: 'out' },
    { t: 0.72, pose: landing, ease: 'in' },
    { t: 0.9, pose: stand, ease: 'out' },
  ],
};
