/**
 * High knees — side view, one stride (both knees) per cycle.
 * Running in place: each knee drives up to hip height (thigh horizontal) while the other foot
 * lands on the ball of the foot; arms pump opposite to the legs; trunk tall.
 *
 * Geometry: the support foot is planted on its toes (ankle −15 → toe 5 below the ankle), the
 * lifted thigh is horizontal (hip 95 with torso 4), the shin hangs down with the toes pointed.
 * Both keyframes share the root (mirrored legs), so no pivot is needed.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 4;
const lift = { hip: 95, knee: 100, ankle: -20 };
const stand = { hip: 6, knee: 12, ankle: -15 };

const kneeR: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -3,
    // Far arm forward, near arm back (opposite to the lifted near knee).
    shoulderL: 55,
    elbowL: 95,
    shoulderR: -30,
    elbowR: 80,
    hipL: stand.hip,
    kneeL: stand.knee,
    ankleL: stand.ankle,
    hipR: lift.hip,
    kneeR: lift.knee,
    ankleR: lift.ankle,
  },
  'side',
  { leg: 'L', x: 100, y: GROUND_Y - 5.1 },
);

const kneeL: Pose = plant(
  {
    ...kneeR,
    shoulderR: 55,
    elbowR: 95,
    shoulderL: -30,
    elbowL: 80,
    hipR: stand.hip,
    kneeR: stand.knee,
    ankleR: stand.ankle,
    hipL: lift.hip,
    kneeL: lift.knee,
    ankleL: lift.ankle,
  },
  'side',
  { leg: 'R', x: 100, y: GROUND_Y - 5.1 },
);

export const high_knees: PoseSet = {
  id: 'high_knees',
  view: 'side',
  loop: 'cycle',
  durationMs: 560,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: kneeR },
    { t: 0.5, pose: kneeL, ease: 'inOut' },
  ],
};
