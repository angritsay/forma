/**
 * Superman — side view, one repetition per cycle.
 * Lying face down (head to the right) with the arms extended overhead and the legs straight →
 * arms, chest and legs lift off the floor at the same time, reaching long → pause → lower.
 *
 * Geometry: the hip stays on the floor. Rest: torso 90 (flat), legs 4° up so the pointed toes
 * do not pierce the floor, forehead resting on the floor (head −28). Lift: torso 74 (16° above
 * the floor), legs 13° up (hip −29, i.e. hip extension), arms in line with the torso.
 */
import { GROUND_Y, basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const rest: Pose = {
  ...basePose('side'),
  rootX: 88,
  rootY: GROUND_Y - 2,
  torso: 90,
  head: -28,
  shoulderL: 177,
  shoulderR: 183,
  elbowL: 0,
  elbowR: 0,
  hipL: -4,
  hipR: -4,
  kneeL: 0,
  kneeR: 0,
  ankleL: -35,
  ankleR: -35,
};

const lift: Pose = {
  ...rest,
  torso: 74,
  head: -12,
  shoulderL: 177,
  shoulderR: 185,
  hipL: -29,
  hipR: -31,
  ankleL: -35,
  ankleR: -35,
};

export const superman: PoseSet = {
  id: 'superman',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: rest },
    { t: 0.4, pose: lift, ease: 'inOut' },
    { t: 0.6, pose: lift, ease: 'linear' },
    { t: 0.92, pose: rest, ease: 'inOut' },
  ],
};
