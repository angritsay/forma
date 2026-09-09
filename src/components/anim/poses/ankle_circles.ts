/**
 * Ankle circles — side view, pingpong (0 = toes down, 1 = toes up).
 * Standing on the far leg with the hands on the hips, the near foot is lifted a little forward
 * and the ankle draws circles. In profile the circle reads as the foot pointing and flexing;
 * the rest of the body is still.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const SUPPORT_X = 96;

const toesDown: Pose = plant(
  {
    ...basePose('side'),
    torso: 0,
    head: 0,
    shoulderL: -20,
    shoulderR: -20,
    elbowL: 80,
    elbowR: 80,
    hipL: 2,
    kneeL: 4,
    ankleL: 2,
    hipR: 24,
    kneeR: 18,
    ankleR: -32,
  },
  'side',
  { leg: 'L', x: SUPPORT_X },
);

const toesUp: Pose = plant({ ...toesDown, ankleR: 30 }, 'side', { leg: 'L', x: SUPPORT_X });

export const ankle_circles: PoseSet = {
  id: 'ankle_circles',
  view: 'side',
  loop: 'pingpong',
  durationMs: 900,
  pivot: 'ankleL',
  poster: 1,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: toesDown },
    { t: 1, pose: toesUp, ease: 'inOut' },
  ],
};
