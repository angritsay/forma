/**
 * Inchworm — side view, one repetition per cycle.
 * Stand → fold and put the hands on the floor in front of the feet → walk the hands out in
 * steps (one hand ahead of the other) into a high plank → short brace → walk the hands back to
 * the feet → stand. The feet stay at x 66 (pivot) so the loop is stationary; walking the feet
 * in would move the athlete across the tile every rep, so the return is done with the hands.
 *
 * Geometry: fold — torso 113°, knees 8°, hands on the floor 18 in front of the toes. Half-way —
 * heels lifted (ankle 6 above the floor), legs straight at 38° from the vertical, torso 104°,
 * one hand planted 24 ahead of the other. Plank — the push_up top with the ankle at x 66.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 66;

const stand: Pose = plant(basePose('side'), 'side', { leg: 'R', x: FOOT_X });

const fold: Pose = plant(
  {
    ...stand,
    torso: 113,
    head: 0,
    shoulderR: 94.4,
    shoulderL: 90.4,
    elbowR: 17,
    elbowL: 17,
    hipR: 118.2,
    hipL: 118.2,
    kneeR: 8,
    kneeL: 8,
    ankleR: 2.8,
    ankleL: 2.8,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Half-way out: the near hand has stepped ahead (wrist at x 164), the far hand trails at 140.
const walkOut: Pose = plant(
  {
    ...stand,
    torso: 104,
    head: -20,
    shoulderR: 114.1,
    elbowR: 14.8,
    shoulderL: 78.4,
    elbowL: 30.2,
    hipR: 66,
    hipL: 66,
    kneeR: 0,
    kneeL: 0,
    ankleR: 8,
    ankleL: 8,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y - 6 },
);

// Half-way back: the far hand leads.
const walkBack: Pose = {
  ...walkOut,
  shoulderL: 114.1,
  elbowL: 14.8,
  shoulderR: 78.4,
  elbowR: 30.2,
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
  { leg: 'R', x: FOOT_X, y: GROUND_Y - 11 },
);

export const inchworm: PoseSet = {
  id: 'inchworm',
  view: 'side',
  loop: 'cycle',
  durationMs: 3000,
  pivot: 'ankleR',
  poster: 0.46,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand },
    { t: 0.14, pose: fold, ease: 'inOut' },
    { t: 0.3, pose: walkOut, ease: 'inOut' },
    { t: 0.46, pose: plank, ease: 'inOut' },
    { t: 0.56, pose: plank, ease: 'linear' },
    { t: 0.72, pose: walkBack, ease: 'inOut' },
    { t: 0.86, pose: fold, ease: 'inOut' },
  ],
};
