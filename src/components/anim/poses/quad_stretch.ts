/**
 * Standing quad stretch — side view, isometric hold with a slow breathing sway.
 * Standing on the far leg, the near heel is pulled toward the glute by the near hand while the
 * far hand rests forward at shoulder height as on a wall (not drawn). Knees together, hips
 * pushed gently forward. Pingpong between the hold and a slightly deeper pull on the exhale.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const SUPPORT_X = 96;

const hold: Pose = plant(
  {
    ...basePose('side'),
    torso: -2,
    head: 2,
    // Far hand forward on the wall; near hand reaches back and down to the ankle.
    shoulderL: 88,
    elbowL: 4,
    shoulderR: -48,
    elbowR: 96,
    hipL: 2,
    kneeL: 4,
    ankleL: 2,
    hipR: -10,
    kneeR: 128,
    ankleR: -20,
  },
  'side',
  { leg: 'L', x: SUPPORT_X },
);

const deeper: Pose = plant({ ...hold, torso: -4, hipR: -14, kneeR: 134, shoulderR: -52 }, 'side', {
  leg: 'L',
  x: SUPPORT_X,
});

export const quad_stretch: PoseSet = {
  id: 'quad_stretch',
  view: 'side',
  loop: 'pingpong',
  durationMs: 3000,
  pivot: 'ankleL',
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: hold },
    { t: 1, pose: deeper, ease: 'inOut' },
  ],
};
