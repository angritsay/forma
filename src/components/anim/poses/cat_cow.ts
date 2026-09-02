/**
 * Cat-cow — side view, pingpong (0 = cow, 1 = cat; one pass each way = one rep).
 * On all fours. Cow: belly drops, chest opens, eyes up, pelvis tilts forward. Cat: back rounds
 * toward the ceiling, pelvis tucks, head drops.
 *
 * The rig's trunk is a rigid segment, so the spinal curve is expressed by what does move in the
 * real movement: the head (up ↔ tucked) and the pelvis rocking over the planted knees — the
 * hips shift forward in the cow and back toward the heels in the cat while the hands stay put
 * (the shoulders pivot over the wrists by the same amount, which keeps the wrists on the floor).
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 56, y: GROUND_Y - 4 };
const T = 68.7;
/** Pelvic rock: thigh tilts ±8° from the vertical over the knee. */
const ROCK = 8;
/** Matching arm tilt that keeps the hands on the floor while the trunk shifts. */
const ARM = 5.4;

const cow: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -45,
    shoulderL: T - ARM,
    shoulderR: T - ARM,
    elbowL: 0,
    elbowR: 0,
    hipL: T - ROCK,
    hipR: T - ROCK,
    kneeL: 97 - ROCK,
    kneeR: 97 - ROCK,
    ankleL: -40,
    ankleR: -40,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

const cat: Pose = plant(
  {
    ...cow,
    head: 38,
    shoulderL: T + ARM,
    shoulderR: T + ARM,
    hipL: T + ROCK,
    hipR: T + ROCK,
    kneeL: 97 + ROCK,
    kneeR: 97 + ROCK,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

export const cat_cow: PoseSet = {
  id: 'cat_cow',
  view: 'side',
  loop: 'pingpong',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 1,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: cow },
    { t: 1, pose: cat, ease: 'inOut' },
  ],
};
