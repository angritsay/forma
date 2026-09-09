/**
 * Hip circles — front view, one circle per cycle.
 * Hands on the hips, feet shoulder-width, the pelvis draws a slow circle while the feet stay
 * planted. From the front the circle reads as the pelvis sweeping left and right with a slight
 * counter-lean of the trunk; the legs adjust their abduction so the feet do not travel.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const centre: Pose = plant(
  {
    ...basePose('front'),
    shoulderL: 30,
    shoulderR: 30,
    elbowL: 110,
    elbowR: 110,
    hipL: 12,
    hipR: 12,
  },
  'front',
  { leg: 'R', y: GROUND_Y },
);

// Pelvis to the left (screen left): the left leg straightens under the hip, the right abducts.
const left: Pose = { ...centre, rootX: centre.rootX - 7, torso: 6, hipL: 5, hipR: 19 };
const right: Pose = { ...centre, rootX: centre.rootX + 7, torso: -6, hipL: 19, hipR: 5 };
const forward: Pose = { ...centre, rootY: centre.rootY - 2 };
const back: Pose = { ...centre, rootY: centre.rootY + 2 };

export const hip_circles: PoseSet = {
  id: 'hip_circles',
  view: 'front',
  loop: 'cycle',
  durationMs: 2000,
  poster: 0.25,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: left, ease: 'linear' },
    { t: 0.25, pose: forward, ease: 'inOut' },
    { t: 0.5, pose: right, ease: 'inOut' },
    { t: 0.75, pose: back, ease: 'inOut' },
  ],
};
