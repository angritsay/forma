/**
 * Knee push-up — side view, one repetition per cycle.
 * Kneeling plank: knees on the floor, shins raised behind at 45° with the feet crossed in the
 * air, straight line from the knees to the shoulders. Chest lowers to ~22 units above the floor
 * with the elbows travelling back, then presses up.
 *
 * Geometry: the knee rests on the ground line (stroke centre 5 above it); the ankle is pinned as
 * the pivot — the shin keeps a fixed angle, so pinning the ankle also pins the knee. The torso
 * angles were solved so the wrists sit exactly on the ground.
 */
import { basePose } from '../rig';
import type { Pose, PoseSet } from './types';

// Top: body line 54.8° from the vertical, arms vertical (shoulder = torso), knee flexed 80°
// so the shin points up-back at 45°; ankle −20 lets the foot hang naturally.
const top: Pose = {
  ...basePose('side'),
  rootX: 87.8,
  rootY: 147.4,
  torso: 54.8,
  head: -12,
  shoulderL: 54.8,
  shoulderR: 54.8,
  elbowL: 0,
  elbowR: 0,
  hipL: 0,
  hipR: 0,
  kneeL: 80.2,
  kneeR: 80.2,
  ankleL: -20,
  ankleR: -20,
};

// Bottom: shoulders 22 above the floor; the knee flexion opens as the body line flattens so the
// shin keeps its 45° angle.
const bottom: Pose = {
  ...top,
  rootX: 93.2,
  rootY: 159.6,
  torso: 77.4,
  shoulderL: -7.8,
  shoulderR: -7.8,
  elbowL: 119.5,
  elbowR: 119.5,
  kneeL: 57.6,
  kneeR: 57.6,
};

export const knee_push_up: PoseSet = {
  id: 'knee_push_up',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.5, pose: bottom, ease: 'inOut' },
    { t: 0.88, pose: top, ease: 'inOut' },
  ],
};
