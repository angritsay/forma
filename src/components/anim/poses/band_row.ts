/**
 * Band row — side view, one repetition per cycle.
 * Standing in a slight hinge (knees soft, trunk ~18° forward, back flat) holding a band anchored
 * in front at chest height with the arms extended → the elbows drive back past the ribs,
 * shoulder blades squeezing → return under control.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 18;

const reach: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -12,
    // Arms straight, absolute 72° (forward, slightly below horizontal): shoulder = 72 + torso.
    shoulderL: 72 + T - 3,
    shoulderR: 72 + T + 3,
    elbowL: 4,
    elbowR: 4,
    // Soft knees, flat feet: ankle = knee − hip + torso.
    hipL: 14,
    hipR: 14,
    kneeL: 14,
    kneeR: 14,
    ankleL: T,
    ankleR: T,
  },
  'side',
  { leg: 'R', x: 96 },
);

// Elbows back past the ribs, forearms pointing forward-down to the hands at the waist.
const pull: Pose = plant(
  { ...reach, shoulderL: -28, shoulderR: -22, elbowL: 108, elbowR: 108 },
  'side',
  { leg: 'R', x: 96 },
);

export const band_row: PoseSet = {
  id: 'band_row',
  view: 'side',
  loop: 'cycle',
  durationMs: 1800,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'band', anchor: 'front' }],
  keyframes: [
    { t: 0, pose: reach },
    { t: 0.42, pose: pull, ease: 'inOut' },
    { t: 0.55, pose: pull, ease: 'linear' },
    { t: 0.92, pose: reach, ease: 'inOut' },
  ],
};
