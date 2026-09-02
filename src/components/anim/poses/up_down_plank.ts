/**
 * Up-down plank — side view, one repetition per cycle (up on the near arm, down on the near arm).
 * Forearm plank (elbows under the shoulders, forearms flat on the floor) → the near hand plants
 * where its elbow was and presses → high plank → the near elbow goes back down → forearm plank.
 * Hips stay square and the feet never move (pivot on the ankle, 11 above the floor, toes down).
 *
 * Geometry: forearm plank — the shoulder is 26 above the elbow on the floor, so the body line is
 * 82.2° from the vertical (shoulder at (149, 146)); the forearms point forward along the ground.
 * High plank — the push-up top (body line 69.2°, wrists on the ground at x 143). Transition —
 * body at 76°, the pressing arm bent 82° to its planted hand, the other arm's elbow 12 above the
 * floor with the forearm still angled down to the ground.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 40, y: GROUND_Y - 11 };

const low: Pose = plant(
  {
    ...basePose('side'),
    torso: 82.2,
    head: -12,
    shoulderL: 82.2,
    shoulderR: 82.2,
    elbowL: 90,
    elbowR: 90,
    hipL: 0,
    hipR: 0,
    kneeL: 0,
    kneeR: 0,
    ankleL: 15.7,
    ankleR: 15.7,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

const high: Pose = plant(
  {
    ...low,
    torso: 69.2,
    shoulderL: 69.2,
    shoulderR: 69.2,
    elbowL: 0,
    elbowR: 0,
    ankleL: 2.8,
    ankleR: 2.8,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

// Pressing up on the near hand, the far forearm lifting off the floor.
const midUp: Pose = plant(
  {
    ...low,
    torso: 76,
    shoulderR: 31.2,
    elbowR: 81.8,
    shoulderL: 76,
    elbowL: 61.1,
    ankleL: 9.6,
    ankleR: 9.6,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

// Lowering onto the near forearm while the far hand still holds the high plank.
const midDown: Pose = {
  ...midUp,
  shoulderL: 31.2,
  elbowL: 81.8,
  shoulderR: 76,
  elbowR: 61.1,
};

export const up_down_plank: PoseSet = {
  id: 'up_down_plank',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 0.45,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: low },
    { t: 0.2, pose: midUp, ease: 'inOut' },
    { t: 0.4, pose: high, ease: 'out' },
    { t: 0.55, pose: high, ease: 'linear' },
    { t: 0.75, pose: midDown, ease: 'inOut' },
    { t: 0.95, pose: low, ease: 'out' },
  ],
};
