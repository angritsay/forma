/**
 * Bench (chair) dip — side view, one repetition per cycle.
 * Hands gripping the front edge of a chair seat behind the athlete, hips off the seat, knees
 * bent with the feet flat in front → elbows bend straight back until the upper arms are close
 * to parallel with the floor, hips lowering beside the seat → press back up. The feet stay
 * planted (pivot); the hands hold the seat edge at (78, 120).
 *
 * Geometry: chair at x 60 (seat 40..80, top face at y 125). Top: hip at (91, 118), arms almost
 * straight and angled back to the seat. Bottom: hip at (85, 134), elbows ≈ 100° with the upper
 * arm 21° below horizontal. Leg angles were solved by IK from the hip to the ankle at x 120.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE_X = 120;

const top: Pose = plant(
  {
    ...basePose('side'),
    torso: 4,
    head: 0,
    shoulderR: -28.2,
    shoulderL: -31.2,
    elbowR: 27,
    elbowL: 27,
    hipR: 53.3,
    hipL: 53.3,
    kneeR: 43.6,
    kneeL: 43.6,
    ankleR: -5.8,
    ankleL: -5.8,
  },
  'side',
  { leg: 'R', x: ANKLE_X },
);

const bottom: Pose = plant(
  {
    ...top,
    torso: 6,
    shoulderR: -62.9,
    shoulderL: -65.9,
    elbowR: 100.7,
    elbowL: 100.7,
    hipR: 85.8,
    hipL: 85.8,
    kneeR: 77,
    kneeL: 77,
    ankleR: -2.8,
    ankleL: -2.8,
  },
  'side',
  { leg: 'R', x: ANKLE_X },
);

export const chair_dip: PoseSet = {
  id: 'chair_dip',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'chair', x: 60 }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.5, pose: bottom, ease: 'inOut' },
    { t: 0.88, pose: top, ease: 'inOut' },
  ],
};
