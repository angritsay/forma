/**
 * Incline push-up — side view, one repetition per cycle.
 * Hands on a box (40 high, in front), body in a straight line down to the toes on the floor.
 * Chest lowers toward the box edge with the elbows travelling back, then presses up.
 *
 * Geometry: the wrists sit on the box top (x 130, y 132); the ankle is pinned 11 above the
 * ground so the toe tip rests on it. Torso angles were solved for both contacts.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 53.5, y: GROUND_Y - 11 };

// Top: body line 44.1° from the vertical, arms vertical onto the box.
const top: Pose = plant(
  {
    ...basePose('side'),
    torso: 44.1,
    head: -10,
    shoulderL: 44.1,
    shoulderR: 44.1,
    elbowL: 0,
    elbowR: 0,
    hipL: 0,
    hipR: 0,
    kneeL: 0,
    kneeR: 0,
    ankleL: -22.3,
    ankleR: -22.3,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

// Bottom: shoulders 24 above the box top, upper arms horizontal back, forearms to the hands.
const bottom: Pose = plant(
  {
    ...top,
    torso: 61.2,
    shoulderL: -27,
    shoulderR: -27,
    elbowL: 103.1,
    elbowR: 103.1,
    ankleL: -5.2,
    ankleR: -5.2,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

export const incline_push_up: PoseSet = {
  id: 'incline_push_up',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'box', height: 40, width: 44, x: 130 }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.5, pose: bottom, ease: 'inOut' },
    { t: 0.88, pose: top, ease: 'inOut' },
  ],
};
