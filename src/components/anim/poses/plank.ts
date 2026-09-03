/**
 * Plank (forearm) — side view, static hold with a subtle breathing motion.
 * Elbows under the shoulders, forearms flat on the floor pointing forward, body in one line from
 * the shoulders to the ankles, toes tucked.
 *
 * Geometry: the ankle is pinned 11 units above the ground (toe tip on the floor, foot ~24° from
 * the vertical); shoulders sit 26 above the floor (upper arm vertical, elbow on the ground) so the
 * body line rises 15 units over its 110-unit length → torso 82.2° from the vertical. The far arm
 * and leg coincide with the near ones (both forearms / both feet on the floor).
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 31, y: GROUND_Y - 11 };
const T = 82.2;

const hold: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -6,
    // Upper arm vertical (shoulder = torso), forearm horizontal forward (elbow 90).
    shoulderL: T,
    shoulderR: T,
    elbowL: 90,
    elbowR: 90,
    hipL: 0,
    hipR: 0,
    kneeL: 0,
    kneeR: 0,
    ankleL: 15.8,
    ankleR: 15.8,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

// Breath: the hips settle ~1° and the head nods a touch; the elbow lifts < 2 px, invisible.
const breathe: Pose = plant(
  {
    ...hold,
    torso: T - 0.6,
    shoulderL: T - 0.6,
    shoulderR: T - 0.6,
    hipL: 1.2,
    hipR: 1.2,
    head: -2,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

export const plank: PoseSet = {
  id: 'plank',
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
