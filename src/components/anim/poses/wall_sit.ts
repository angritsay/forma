/**
 * Wall sit — side view, isometric hold with a slow breathing sway.
 * Back flat against a wall (a tall narrow box prop behind the athlete), thighs horizontal, shins
 * vertical, arms held straight out in front. Pingpong between two near-identical poses.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 125;
// Thigh horizontal (hip 90) + shin vertical (knee 90): the hip sits 34 behind the foot at x 91.
// The torso stroke is 13 wide, so the wall face is at 91 − 6.5 ≈ 84; the wall box is 12 wide.
const WALL_X = 78;

const sit: Pose = plant(
  {
    ...basePose('side'),
    torso: 0,
    head: 0,
    hipL: 86,
    hipR: 90,
    kneeL: 86,
    kneeR: 90,
    ankleL: 0,
    ankleR: 0,
    shoulderL: 80,
    shoulderR: 86,
    elbowL: 6,
    elbowR: 6,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Inhale: arms lift a few degrees, chin up a touch. The back stays on the wall.
const breathe: Pose = {
  ...sit,
  head: -3,
  shoulderL: 84,
  shoulderR: 90,
};

export const wall_sit: PoseSet = {
  id: 'wall_sit',
  view: 'side',
  loop: 'pingpong',
  durationMs: 3000,
  pivot: 'ankleR',
  poster: 0,
  props: [{ kind: 'floor' }, { kind: 'box', height: 150, width: 12, x: WALL_X }],
  keyframes: [
    { t: 0, pose: sit },
    { t: 1, pose: breathe, ease: 'inOut' },
  ],
};
