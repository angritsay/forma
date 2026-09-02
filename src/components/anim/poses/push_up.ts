/**
 * Push-up — side view, one repetition per cycle.
 * High plank (straight line from the shoulders to the toes, arms vertical) → chest lowered to
 * ~22 units above the floor with the elbows travelling back → press back up, short pause on top.
 *
 * Geometry: the ankle is pinned 11 units above the ground so the toe tip (foot at ~24° to the
 * vertical) rests on the floor; the torso angle was solved so the wrists land exactly on the
 * ground line. The far arm and leg coincide with the near ones (both hands / both feet on the
 * floor) — that is the expected silhouette for a bilateral floor move.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 46, y: GROUND_Y - 11 };

// Top: body line 69.2° from the vertical, arms straight down (shoulder = torso → vertical arm).
const top: Pose = plant(
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

// Bottom: shoulders 22 above the floor, upper arms pointing back (−75° absolute), forearms
// angled forward-down to the planted hands (elbow flexion ≈ 125°).
const bottom: Pose = plant(
  {
    ...top,
    torso: 84.3,
    shoulderL: 9.3,
    shoulderR: 9.3,
    elbowL: 125.5,
    elbowR: 125.5,
    ankleL: 17.9,
    ankleR: 17.9,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

export const push_up: PoseSet = {
  id: 'push_up',
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
