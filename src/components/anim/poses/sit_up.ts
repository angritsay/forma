/**
 * Sit-up — side view, one repetition per cycle.
 * Lying on the back (head to the left) with the knees bent and the feet flat, arms reaching
 * forward → curl up to sitting with the chest toward the knees and the hands reaching for the
 * shins → lower back down.
 *
 * Geometry: legs as in the glute bridge start (feet flat, planted at x = 126, the pivot); the
 * hip stays on the floor. Bottom: torso −90 (flat), head resting on the floor (head 25), arms
 * pointing up and slightly forward. Top: torso 25° forward of vertical, arms out to the shins.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 126;

const down: Pose = plant(
  {
    ...basePose('side'),
    torso: -90,
    head: 25,
    shoulderL: 66,
    shoulderR: 72,
    elbowL: 0,
    elbowR: 0,
    hipL: 55,
    hipR: 55,
    kneeL: 129.6,
    kneeR: 129.6,
    ankleL: -15.4,
    ankleR: -15.4,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

const up: Pose = plant(
  {
    ...down,
    torso: 25,
    head: -6,
    shoulderL: 82,
    shoulderR: 88,
    elbowL: 12,
    elbowR: 12,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

export const sit_up: PoseSet = {
  id: 'sit_up',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: down },
    { t: 0.42, pose: up, ease: 'inOut' },
    { t: 0.55, pose: up, ease: 'linear' },
    { t: 0.92, pose: down, ease: 'inOut' },
  ],
};
