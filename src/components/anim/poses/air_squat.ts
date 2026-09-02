/**
 * Air squat — side view, one repetition per cycle.
 * Top → bottom (hips back and down, knees over the toes, torso ~30° forward, arms rise to
 * horizontal for balance) → top, with a short pause standing tall.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const top: Pose = plant(basePose('side'), 'side', { leg: 'R', x: 100 });

const bottomJoints: Pose = {
  ...top,
  torso: 32,
  head: -22,
  hipL: 105,
  hipR: 105,
  kneeL: 112,
  kneeR: 112,
  // Flat foot: ankle = knee − hip + torso
  ankleL: 112 - 105 + 32,
  ankleR: 112 - 105 + 32,
  // Upper arm horizontal forward: shoulder = 90 + torso. The far arm sits a few degrees lower
  // so the lighter far limb peeks out from behind the near one (depth cue).
  shoulderL: 116,
  shoulderR: 122,
  elbowL: 10,
  elbowR: 10,
};
const bottom = plant(bottomJoints, 'side', { leg: 'R', x: 100 });

export const air_squat: PoseSet = {
  id: 'air_squat',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.5, pose: bottom, ease: 'inOut' },
    { t: 0.88, pose: top, ease: 'inOut' },
  ],
};
