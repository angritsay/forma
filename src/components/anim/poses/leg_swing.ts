/**
 * Leg swings — side view, pingpong (0 = backswing, 1 = forward swing).
 * Standing on the far leg (knee soft), the near leg swings straight like a pendulum from behind
 * the hip to hip height in front; trunk upright and still. The far hand rests forward at
 * shoulder height as on a wall (the wall itself is beside the athlete and not drawn), the near
 * hand sits on the hip.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const SUPPORT_X = 96;

const backswing: Pose = plant(
  {
    ...basePose('side'),
    torso: 0,
    head: 0,
    // Far hand forward on the (undrawn) wall; near hand on the hip.
    shoulderL: 88,
    elbowL: 4,
    shoulderR: -26,
    elbowR: 72,
    // Support leg: soft knee, flat foot (ankle = knee − hip + torso).
    hipL: 4,
    kneeL: 8,
    ankleL: 4,
    hipR: -32,
    kneeR: 10,
    ankleR: -10,
  },
  'side',
  { leg: 'L', x: SUPPORT_X },
);

const forward: Pose = plant(
  { ...backswing, torso: -3, head: 3, hipR: 72, kneeR: 4, ankleR: 8 },
  'side',
  { leg: 'L', x: SUPPORT_X },
);

export const leg_swing: PoseSet = {
  id: 'leg_swing',
  view: 'side',
  loop: 'pingpong',
  durationMs: 1100,
  pivot: 'ankleL',
  poster: 1,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: backswing },
    { t: 1, pose: forward, ease: 'inOut' },
  ],
};
