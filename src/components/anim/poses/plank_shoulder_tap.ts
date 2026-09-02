/**
 * Plank shoulder taps — side view, one cycle = one tap with each hand.
 * High plank (the push-up top: straight line from the shoulders to the toes, arms vertical)
 * → the near hand lifts and touches the opposite shoulder while the hips stay perfectly still
 * → hand back down → the far hand does the same → back to the plank.
 *
 * The tap folds the arm: upper arm swung 25° forward of the torso line, elbow flexed 145°, which
 * puts the wrist 14 below and 5 in front of the shoulder joint — the hand on the opposite
 * shoulder in profile. The root never moves, so the "glass of water on the back" stays level.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 46, y: GROUND_Y - 11 };

const plank: Pose = plant(
  {
    ...basePose('side'),
    torso: 69.2,
    head: -12,
    shoulderL: 69.2,
    shoulderR: 69.2,
    elbowL: 0,
    elbowR: 0,
    hipL: 0,
    hipR: 0,
    kneeL: 0,
    kneeR: 0,
    ankleL: 2.8,
    ankleR: 2.8,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

const tapR: Pose = { ...plank, shoulderR: 25, elbowR: 145 };
const tapL: Pose = { ...plank, shoulderL: 25, elbowL: 145 };

export const plank_shoulder_tap: PoseSet = {
  id: 'plank_shoulder_tap',
  view: 'side',
  loop: 'cycle',
  durationMs: 1600,
  pivot: 'ankleR',
  poster: 0.2,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: plank },
    { t: 0.2, pose: tapR, ease: 'inOut' },
    { t: 0.28, pose: tapR, ease: 'linear' },
    { t: 0.45, pose: plank, ease: 'inOut' },
    { t: 0.65, pose: tapL, ease: 'inOut' },
    { t: 0.73, pose: tapL, ease: 'linear' },
    { t: 0.9, pose: plank, ease: 'inOut' },
  ],
};
