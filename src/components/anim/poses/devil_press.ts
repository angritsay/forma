/**
 * Devil press — side view, one repetition per cycle.
 * Standing with the dumbbells at the sides → hinge and set them on the floor in front of the
 * feet → hop the feet back into a plank on the handles → push-up between the dumbbells → hop
 * the feet back in → flat-back hinge, shoulders over the hands → hips drive and both dumbbells
 * swing up in front to a lockout overhead → lower and repeat.
 *
 * Geometry: feet at x 104, dumbbell handles at (136, 166) — 4 above the floor. The plank and
 * push-up are the renegade-row plank shifted so the wrists stay on the handles (ankle pinned at
 * (34.7, 161)); the hop lifts the tucked legs ~11 above the floor with the hands still on the
 * dumbbells. Hinge solved by IK: torso 80°, arms 4° forward of vertical.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 104;
const PLANK_ANKLE = { x: 34.7, y: GROUND_Y - 11 };

const stand: Pose = plant(
  { ...basePose('side'), shoulderL: 2, shoulderR: 4, elbowL: 0, elbowR: 0 },
  'side',
  { leg: 'R', x: FOOT_X },
);

const hinge: Pose = plant(
  {
    ...stand,
    torso: 80,
    head: -56,
    shoulderL: 84,
    shoulderR: 84,
    hipL: 135.6,
    hipR: 135.6,
    kneeL: 80.2,
    kneeR: 80.2,
    ankleL: 24.6,
    ankleR: 24.6,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Feet in the air between the hinge and the plank: hands on the handles, knees tucked.
const hop: Pose = {
  ...stand,
  rootX: 76.7,
  rootY: 128.6,
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
    torso: 67,
    head: -12,
    shoulderL: 67,
    shoulderR: 67,
    ankleL: 1,
    ankleR: 1,
  },
  'side',
  { leg: 'R', x: PLANK_ANKLE.x, y: PLANK_ANKLE.y },
);

// Chest between the dumbbells: shoulders 22 above the handles, elbows back.
const pushBottom: Pose = plant(
  {
    ...plank,
    torso: 82.2,
    shoulderL: 4.9,
    shoulderR: 4.9,
    elbowL: 124.6,
    elbowR: 124.6,
    ankleL: 15.7,
    ankleR: 15.7,
  },
  'side',
  { leg: 'R', x: PLANK_ANKLE.x, y: PLANK_ANKLE.y },
);

// Hips snapping open, straight arms swinging the dumbbells up in front.
const swing: Pose = plant(
  {
    ...stand,
    torso: 20,
    head: -14,
    shoulderL: 66,
    shoulderR: 70,
    hipL: 30,
    hipR: 30,
    kneeL: 22,
    kneeR: 22,
    ankleL: 22 - 30 + 20,
    ankleR: 22 - 30 + 20,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

const lockout: Pose = { ...stand, head: -3, shoulderL: 174, shoulderR: 178 };

export const devil_press: PoseSet = {
  id: 'devil_press',
  view: 'side',
  loop: 'cycle',
  durationMs: 2200,
  poster: 0.78,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: stand, ease: 'out' },
    { t: 0.1, pose: hinge, ease: 'in' },
    { t: 0.16, pose: hop, ease: 'out' },
    { t: 0.24, pose: plank, ease: 'in' },
    { t: 0.35, pose: pushBottom, ease: 'inOut' },
    { t: 0.45, pose: plank, ease: 'inOut' },
    { t: 0.51, pose: hop, ease: 'out' },
    { t: 0.57, pose: hinge, ease: 'in' },
    { t: 0.68, pose: swing, ease: 'in' },
    { t: 0.78, pose: lockout, ease: 'out' },
    { t: 0.88, pose: lockout, ease: 'linear' },
  ],
};
