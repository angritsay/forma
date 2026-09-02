/**
 * Kneeling hip flexor stretch — side view, isometric hold with a slow breathing sway.
 * Half-kneeling: the far (left) knee on the floor with the shin trailing back and the toes
 * tucked, the near (right) foot flat in front with the knee over the heel, hips pushed forward
 * of the down knee, trunk upright, near arm reaching overhead, far hand resting on the front
 * thigh. Pingpong between the hold and a slightly deeper "exhale" position.
 *
 * Geometry: the down knee rests on the ground line at (72, 167); the rear thigh leans 15° back
 * from the vertical (hip in front of the knee — that is the stretch), the shin runs back to an
 * ankle 6 above the floor so the toe tip touches it. The front foot is the pivot at x 114.3;
 * its leg was solved by IK from the hip at (81, 134).
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 114.3;

const hold: Pose = plant(
  {
    ...basePose('side'),
    torso: -3,
    head: 0,
    shoulderR: 150,
    elbowR: 8,
    shoulderL: 20,
    elbowL: 20,
    hipR: 77.1,
    kneeR: 80.1,
    ankleR: 0,
    hipL: -18,
    kneeL: 85.8,
    ankleL: 10.8,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Exhale: hips shift a little further forward, arm floats up a touch.
const deeper: Pose = plant(
  {
    ...hold,
    torso: -5,
    head: 2,
    shoulderR: 154,
    shoulderL: 22,
    hipR: 75.9,
    kneeR: 84.1,
    ankleR: 3.2,
    hipL: -23,
    kneeL: 82.8,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

export const hip_flexor_stretch: PoseSet = {
  id: 'hip_flexor_stretch',
  view: 'side',
  loop: 'pingpong',
  durationMs: 3000,
  pivot: 'ankleR',
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: hold },
    { t: 1, pose: deeper, ease: 'inOut' },
  ],
};
