/**
 * Renegade row — side view, two pulls (near arm, then far arm) per cycle.
 * High plank gripping two dumbbells on the floor, body in a straight line → one arm rows its
 * dumbbell to the hip, elbow driving up past the back, while the other arm keeps supporting →
 * lower to the floor → repeat with the other arm.
 *
 * Geometry: push-up plank with the wrists 4 above the floor (dumbbell handles) — body line 67°
 * from the vertical, arms vertical, toe tips on the floor (ankle pinned at (46, 161)). Row top:
 * upper arm pointing back-up 112° so the elbow sits 20 above the back, forearm vertical with the
 * dumbbell beside the ribs.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 67;
const ANKLE = { x: 46, y: GROUND_Y - 11 };

const plank: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -12,
    shoulderL: T,
    shoulderR: T,
    elbowL: 0,
    elbowR: 0,
    hipL: 0,
    hipR: 0,
    kneeL: 0,
    kneeR: 0,
    ankleL: 1,
    ankleR: 1,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

const rowR: Pose = { ...plank, shoulderR: -45.4, elbowR: 107.7 };
const rowL: Pose = { ...plank, shoulderL: -45.4, elbowL: 107.7 };

export const renegade_row: PoseSet = {
  id: 'renegade_row',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 0.24,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: plank },
    { t: 0.2, pose: rowR, ease: 'inOut' },
    { t: 0.28, pose: rowR, ease: 'linear' },
    { t: 0.45, pose: plank, ease: 'inOut' },
    { t: 0.65, pose: rowL, ease: 'inOut' },
    { t: 0.73, pose: rowL, ease: 'linear' },
    { t: 0.92, pose: plank, ease: 'inOut' },
  ],
};
