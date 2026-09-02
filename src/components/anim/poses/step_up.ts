/**
 * Step-up — side view, one repetition per cycle (the near leg works).
 * Standing behind a low box with the near (right) foot flat on top, knee over the heel → press
 * through that foot to stand tall on the box while the free knee drives up → lower the free foot
 * back to the floor under control. The box foot stays planted (pivot); the free leg passes
 * through a tucked keyframe both ways so it clears the box edge.
 *
 * Geometry: box 26 high at x 132 (spans 110..154); the working ankle sits on its top at
 * (126, 146). Start: hip at (93, 108) — the working knee bends 81° with a vertical shin, the
 * bottom leg is slightly bent with a flat foot at x 92. Top: working leg straight, head 17 from
 * the top edge of the tile.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const BOX_HEIGHT = 26;
const FOOT = { x: 126, y: GROUND_Y - BOX_HEIGHT };

const start: Pose = plant(
  {
    ...basePose('side'),
    torso: 10,
    head: -6,
    shoulderR: 24,
    shoulderL: 30,
    elbowR: 35,
    elbowL: 35,
    // Working leg on the box: thigh 79.8° forward, shin vertical, flat foot (solved by IK).
    hipR: 89.8,
    kneeR: 80.7,
    ankleR: 0.8,
    // Bottom leg on the floor at x 92: soft knee, weight on the heel.
    hipL: 22.8,
    kneeL: 28.2,
    ankleL: 15.5,
  },
  'side',
  { leg: 'R', x: FOOT.x, y: FOOT.y },
);

// Free foot tucked up behind the box edge (ankle at x ≈ 98, 30 above the floor).
const lift: Pose = plant(
  {
    ...start,
    torso: 8,
    head: -5,
    shoulderR: 40,
    shoulderL: 8,
    elbowR: 60,
    elbowL: 35,
    hipR: 60,
    kneeR: 52,
    ankleR: 52 - 60 + 8,
    hipL: 55,
    kneeL: 105,
    ankleL: -20,
  },
  'side',
  { leg: 'R', x: FOOT.x, y: FOOT.y },
);

const top: Pose = plant(
  {
    ...start,
    torso: 4,
    head: -2,
    shoulderR: 60,
    shoulderL: -20,
    elbowR: 90,
    elbowL: 40,
    hipR: 6,
    kneeR: 4,
    ankleR: 2,
    hipL: 75,
    kneeL: 95,
    ankleL: -15,
  },
  'side',
  { leg: 'R', x: FOOT.x, y: FOOT.y },
);

export const step_up: PoseSet = {
  id: 'step_up',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 0.45,
  props: [{ kind: 'floor' }, { kind: 'box', height: BOX_HEIGHT, width: 44, x: 132 }],
  keyframes: [
    { t: 0, pose: start },
    { t: 0.18, pose: lift, ease: 'out' },
    { t: 0.42, pose: top, ease: 'inOut' },
    { t: 0.55, pose: top, ease: 'linear' },
    { t: 0.76, pose: lift, ease: 'inOut' },
    { t: 0.94, pose: start, ease: 'out' },
  ],
};
