/**
 * Side plank — side view (the athlete's chest faces the viewer, head to the right), static hold
 * with a subtle breathing motion. Supported on the near forearm (elbow under the shoulder,
 * forearm along the floor) and the outer edge of the feet; body in one straight line; the top
 * (far) arm reaches for the ceiling.
 *
 * Geometry: shoulders 26 above the floor (upper arm vertical), ankles 12 above it (feet drawn as
 * a short vertical stub standing on their edge), so the 110-unit body line rises 14 units →
 * torso 82.7° from the vertical. The rig has no abduction axis in the side view, so the top arm
 * is expressed as 180° of extension (shoulder = torso − 180) — visually straight up.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 32, y: GROUND_Y - 12 };
const T = 82.7;

const hold: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -4,
    // Near arm: vertical upper arm, forearm forward along the floor.
    shoulderR: T,
    elbowR: 90,
    // Far (top) arm: straight up.
    shoulderL: T - 180,
    elbowL: 0,
    hipL: 0,
    hipR: 0,
    kneeL: 0,
    kneeR: 0,
    // Foot straight down (foot abs 0): ankle = −shin abs − 90 = T − 90.
    ankleL: T - 90,
    ankleR: T - 90,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

// Breath: hips dip a hair and the top arm drifts a few degrees.
const breathe: Pose = plant(
  {
    ...hold,
    torso: T - 0.6,
    shoulderR: T - 0.6,
    shoulderL: T - 180 + 5,
    hipL: 1.2,
    hipR: 1.2,
    head: -1,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

export const side_plank: PoseSet = {
  id: 'side_plank',
  view: 'side',
  loop: 'pingpong',
  durationMs: 3000,
  pivot: 'ankleR',
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: hold },
    { t: 1, pose: breathe, ease: 'inOut' },
  ],
};
