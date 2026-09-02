/**
 * Diamond push-up — side view, one repetition per cycle.
 * Like the push-up but the hands sit together under the chest (8 units behind the shoulder
 * line) and the elbows stay tucked: at the bottom the upper arms point straight back along the
 * body with the forearms angled down to the hands. Straight line from the shoulders to the toes.
 *
 * Geometry: the ankle is pinned 11 above the ground (toe tip on the floor); at the top the
 * straight arms angle 10° back from the vertical, which fixes the body line at 69.7° so the
 * wrists land on the ground. At the bottom the shoulders are 22 above the floor and the elbows
 * are level with them, 26 behind (elbow flexion ≈ 116°).
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 46, y: GROUND_Y - 11 };

const top: Pose = plant(
  {
    ...basePose('side'),
    torso: 69.7,
    head: -12,
    shoulderL: 59.7,
    shoulderR: 59.7,
    elbowL: 0,
    elbowR: 0,
    hipL: 0,
    hipR: 0,
    kneeL: 0,
    kneeR: 0,
    ankleL: 3.2,
    ankleR: 3.2,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

const bottom: Pose = plant(
  {
    ...top,
    torso: 84.3,
    shoulderL: -4.3,
    shoulderR: -4.3,
    elbowL: 115.8,
    elbowR: 115.8,
    ankleL: 17.8,
    ankleR: 17.8,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

export const diamond_push_up: PoseSet = {
  id: 'diamond_push_up',
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
