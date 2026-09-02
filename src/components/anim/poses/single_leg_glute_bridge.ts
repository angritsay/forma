/**
 * Single-leg glute bridge — side view, one repetition per cycle.
 * Same as the glute bridge, but the far leg stays straight and raised in the air the whole
 * time (foot flexed); only the near foot is planted and drives the hips up.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 126;

// Lying flat: near leg bent with the foot flat, far leg straight at 45° above the floor.
const down: Pose = plant(
  {
    ...basePose('side'),
    torso: -90,
    head: 25,
    shoulderL: 0,
    shoulderR: 0,
    elbowL: 0,
    elbowR: 0,
    hipR: 55,
    kneeR: 129.6,
    ankleR: -15.4,
    hipL: 45,
    kneeL: 0,
    ankleL: -30,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

// Top: shoulders–hips–knee in a line, the raised leg continues that line.
const up: Pose = plant(
  {
    ...down,
    torso: -112,
    head: 47,
    shoulderL: -22,
    shoulderR: -22,
    hipR: -0.4,
    kneeR: 112.3,
    ankleR: 0.7,
    hipL: 6,
    kneeL: 0,
    ankleL: -30,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

export const single_leg_glute_bridge: PoseSet = {
  id: 'single_leg_glute_bridge',
  view: 'side',
  loop: 'cycle',
  durationMs: 2200,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: down },
    { t: 0.42, pose: up, ease: 'inOut' },
    { t: 0.58, pose: up, ease: 'linear' },
    { t: 0.92, pose: down, ease: 'inOut' },
  ],
};
