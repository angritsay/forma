/**
 * Hollow hold — side view, static hold with a subtle breathing motion.
 * Lying on the back (head to the left), lower back pressed into the floor: shoulders and straight
 * legs hover above the floor, arms extended overhead beside the ears, chin tucked, toes pointed.
 *
 * Geometry: the hip rests on the floor; the torso points up-left 20° above the floor
 * (torso −70), the legs 15° above it (hip 35 → thigh abs 105). Arms continue the torso line
 * (shoulder 180 = overhead). The pointed-toe look is limited by the rig's ankle range.
 */
import { GROUND_Y, basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const hold: Pose = {
  ...basePose('side'),
  rootX: 110,
  rootY: GROUND_Y - 2,
  torso: -70,
  head: 30,
  shoulderL: 176,
  shoulderR: 182,
  elbowL: 0,
  elbowR: 0,
  hipL: 35,
  hipR: 35,
  kneeL: 0,
  kneeR: 0,
  ankleL: -38,
  ankleR: -38,
};

// Breath: the boat rocks ~2° — shoulders and legs rise together and settle back.
const breathe: Pose = {
  ...hold,
  torso: -68,
  head: 31,
  shoulderL: 178,
  shoulderR: 184,
  hipL: 38,
  hipR: 38,
};

export const hollow_hold: PoseSet = {
  id: 'hollow_hold',
  view: 'side',
  loop: 'pingpong',
  durationMs: 3000,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: hold },
    { t: 1, pose: breathe, ease: 'inOut' },
  ],
};
