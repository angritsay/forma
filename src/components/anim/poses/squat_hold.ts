/**
 * Squat hold — side view, isometric bottom position with a slow breathing sway.
 * Same bottom as the air squat: hips below the knees, torso ~30° forward, arms horizontal.
 * Pingpong between two nearly identical poses so the figure does not look frozen.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const hold: Pose = plant(
  {
    ...basePose('side'),
    torso: 30,
    head: -21,
    hipL: 106,
    hipR: 106,
    kneeL: 112,
    kneeR: 112,
    ankleL: 112 - 106 + 30, // flat foot: knee − hip + torso
    ankleR: 112 - 106 + 30,
    shoulderL: 114,
    shoulderR: 120,
    elbowL: 10,
    elbowR: 10,
  },
  'side',
  { leg: 'R', x: 100 },
);

// Inhale: chest lifts a touch, arms drift up a few degrees.
const breathe: Pose = plant(
  {
    ...hold,
    torso: 28,
    head: -19,
    ankleL: 112 - 106 + 28,
    ankleR: 112 - 106 + 28,
    shoulderL: 117,
    shoulderR: 123,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const squat_hold: PoseSet = {
  id: 'squat_hold',
  view: 'side',
  loop: 'pingpong',
  durationMs: 3000,
  pivot: 'ankleR',
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: hold },
    { t: 1, pose: breathe, ease: 'inOut' },
  ],
};
