/**
 * Glute bridge — side view, one repetition per cycle.
 * Lying on the back (head to the left), knees bent, feet flat: hips drive up until the
 * shoulders, hips and knees form a straight line, short squeeze on top, then lower.
 *
 * Geometry: torso −90 = flat on the floor, head to −x; the shoulders stay at (54, 169) and
 * the near foot is planted at x 126 (the pivot). At the top the torso rises to −112 (22° above
 * the floor) and the thigh continues that line with a vertical shin. The arms lie flat on the
 * floor beside the body (absolute 90 → shoulder = 90 + torso). The chin stays tucked so the
 * head rests on the floor in both keyframes.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 126;

const down: Pose = plant(
  {
    ...basePose('side'),
    torso: -90,
    head: 25,
    shoulderL: 0,
    shoulderR: 0,
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
    torso: -112,
    head: 47,
    shoulderL: -22,
    shoulderR: -22,
    hipL: -0.4,
    hipR: -0.4,
    kneeL: 112.3,
    kneeR: 112.3,
    ankleL: 0.7,
    ankleR: 0.7,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

export const glute_bridge: PoseSet = {
  id: 'glute_bridge',
  view: 'side',
  loop: 'cycle',
  durationMs: 2200,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: down },
    { t: 0.42, pose: up, ease: 'inOut' },
    { t: 0.58, pose: up, ease: 'linear' },
    { t: 0.92, pose: down, ease: 'inOut' },
  ],
};
