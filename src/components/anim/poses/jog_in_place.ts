/**
 * Jog in place — side view, one stride (both feet) per cycle.
 * A light run on the spot: one foot lifts at a time with a moderate knee, landing on the ball of
 * the foot; elbows bent, arms swinging as in running; trunk upright, shoulders relaxed.
 *
 * Geometry: support leg soft (hip 14 / knee 16 with torso 6, shin slightly back) on its toes
 * (ankle −15 → toe 4.7 below the ankle); swing leg hip 60 / knee 95 with the foot tucked behind.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 6;
const swing = { hip: 60, knee: 95, ankle: -20 };
const stand = { hip: 14, knee: 16, ankle: -15 };

const strideR: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -4,
    shoulderL: 42,
    elbowL: 95,
    shoulderR: -22,
    elbowR: 90,
    hipL: stand.hip,
    kneeL: stand.knee,
    ankleL: stand.ankle,
    hipR: swing.hip,
    kneeR: swing.knee,
    ankleR: swing.ankle,
  },
  'side',
  { leg: 'L', x: 100, y: GROUND_Y - 4.7 },
);

const strideL: Pose = plant(
  {
    ...strideR,
    shoulderR: 42,
    elbowR: 95,
    shoulderL: -22,
    elbowL: 90,
    hipR: stand.hip,
    kneeR: stand.knee,
    ankleR: stand.ankle,
    hipL: swing.hip,
    kneeL: swing.knee,
    ankleL: swing.ankle,
  },
  'side',
  { leg: 'R', x: 100, y: GROUND_Y - 4.7 },
);

export const jog_in_place: PoseSet = {
  id: 'jog_in_place',
  view: 'side',
  loop: 'cycle',
  durationMs: 640,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: strideR },
    { t: 0.5, pose: strideL, ease: 'inOut' },
  ],
};
