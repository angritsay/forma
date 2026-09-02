/**
 * Pike push-up — side view, one repetition per cycle.
 * Inverted V: hands on the floor in front, feet on the toes behind, hips high, arms and back in
 * one line → the elbows bend and the top of the head lowers to just above the floor between the
 * hands (a tripod) → press back up with the hips staying high.
 *
 * Geometry: the ankle is pinned at (48, 161.6) so the toes (30° from the vertical) rest on the
 * floor; legs straight at 40° from the vertical put the hip at (90, 111). The torso continues
 * down-forward at 130.4° and the straight arms continue that line to the wrists on the ground
 * at x 162. At the bottom the shoulder drops to (138, 146); the hands stay put, the forearms end
 * vertical with the elbows above the wrists. The rig has no forearm rotation, so with the palms
 * planted fingers-forward the elbows bend toward the athlete's back, which is the negative
 * direction of `elbow` here (−90°).
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 48, y: GROUND_Y - 12 * Math.cos((30 * Math.PI) / 180) };

const top: Pose = plant(
  {
    ...basePose('side'),
    torso: 130.4,
    head: 0,
    shoulderL: 180,
    shoulderR: 180,
    elbowL: 0,
    elbowR: 0,
    hipL: 90.4,
    hipR: 90.4,
    kneeL: 0,
    kneeR: 0,
    ankleL: -20,
    ankleR: -20,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

const bottom: Pose = plant(
  {
    ...top,
    torso: 122.7,
    head: -2.7,
    shoulderL: 208.1,
    shoulderR: 208.1,
    elbowL: -90,
    elbowR: -90,
    hipL: 69.3,
    hipR: 69.3,
    ankleL: -6.6,
    ankleR: -6.6,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

export const pike_push_up: PoseSet = {
  id: 'pike_push_up',
  view: 'side',
  loop: 'cycle',
  durationMs: 2200,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.5, pose: bottom, ease: 'inOut' },
    { t: 0.88, pose: top, ease: 'inOut' },
  ],
};
