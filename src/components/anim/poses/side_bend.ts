/**
 * Side bends — front view, pingpong (0 = bend to the left, 1 = bend to the right).
 * Feet shoulder-width, one arm overhead, the trunk bends sideways from the waist and the hips
 * stay level. The overhead arm swaps with the direction of the bend.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const stance: Pose = plant(
  {
    ...basePose('front'),
    hipL: 14,
    hipR: 14,
    shoulderL: 10,
    shoulderR: 10,
    elbowL: 6,
    elbowR: 6,
  },
  'front',
  { leg: 'R', y: GROUND_Y },
);

// Bend to the left: the right arm reaches overhead, the left hand slides down the thigh.
const left: Pose = { ...stance, torso: -18, head: -4, shoulderR: 172, elbowR: 4, shoulderL: 4 };
const right: Pose = { ...stance, torso: 18, head: 4, shoulderL: 172, elbowL: 4, shoulderR: 4 };

export const side_bend: PoseSet = {
  id: 'side_bend',
  view: 'front',
  loop: 'pingpong',
  durationMs: 1600,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: left },
    { t: 0.5, pose: stance, ease: 'inOut' },
    { t: 1, pose: right, ease: 'inOut' },
  ],
};
