/**
 * Standing hamstring stretch — side view, isometric hold with a slow breathing sway.
 * The near (right) heel is planted forward with the toes pulled up and the leg straight; the far
 * (left) supporting knee is softened and the hips hinge back with a flat back; both hands rest
 * on the front thigh. Pingpong between the hold and a slightly deeper fold on the exhale.
 *
 * Geometry: supporting foot (pivot) at x 88, hip at (84, 109.5) so the support knee bends 37°;
 * the straight front leg reaches the floor 19° ahead of the vertical, ankle at the dorsiflexion
 * limit (35°) so the toes point up. Torso 42° forward; the arms hang to the thigh at (92, 122).
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const SUPPORT_X = 88;

const hold: Pose = plant(
  {
    ...basePose('side'),
    torso: 42,
    head: -29,
    shoulderR: 16.5,
    shoulderL: 12.5,
    elbowR: 0.2,
    elbowL: 0.2,
    hipR: 60.7,
    kneeR: 2,
    ankleR: 35,
    hipL: 63.5,
    kneeL: 36.8,
    ankleL: 15.3,
  },
  'side',
  { leg: 'L', x: SUPPORT_X },
);

// Exhale: fold a few degrees deeper, elbows soften as the hands stay on the thigh.
const deeper: Pose = plant(
  {
    ...hold,
    torso: 45,
    head: -31,
    shoulderR: 8.3,
    shoulderL: 4.3,
    elbowR: 18.4,
    elbowL: 18.4,
    hipR: 63.7,
    hipL: 66.5,
  },
  'side',
  { leg: 'L', x: SUPPORT_X },
);

export const hamstring_stretch: PoseSet = {
  id: 'hamstring_stretch',
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
