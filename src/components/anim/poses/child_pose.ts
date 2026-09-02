/**
 * Child's pose — side view, static hold with a slow breathing motion.
 * Kneeling with the hips sitting back toward the heels, trunk folded forward over the thighs,
 * forehead on the floor, arms stretched forward along the floor.
 *
 * Geometry: knees on the floor at x ≈ 89 with the shins pointing back (ankle 4 up so the pointed
 * foot lies flat); thighs fold 43.6° from the vertical so the hip sits over the heels 25 above
 * the floor; the trunk slopes 25° below horizontal down to the shoulders resting on the floor
 * (torso 115); the neck bends back (head −40) so the head rests on the floor in front of the
 * shoulders; arms continue forward, slightly down, to the hands on the floor.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 57, y: GROUND_Y - 4 };
const T = 115;
const THIGH = 43.6; // thigh absolute angle (from the vertical, knee forward of the hip)
const SHIN = -97.2; // shin absolute angle (pointing back, ankle slightly raised)

const rest: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -40,
    // Arm absolute 84° (forward, 6° below horizontal) → shoulder = 84 + torso.
    shoulderL: 84 + T,
    shoulderR: 84 + T,
    elbowL: 0,
    elbowR: 0,
    hipL: THIGH + T,
    hipR: THIGH + T,
    kneeL: THIGH - SHIN,
    kneeR: THIGH - SHIN,
    ankleL: -40,
    ankleR: -40,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

// Slow belly breath: the back rises ~2° and settles.
const inhale: Pose = plant(
  { ...rest, torso: T - 2, head: -38, shoulderL: 84 + T - 2, shoulderR: 84 + T - 2 },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

export const child_pose: PoseSet = {
  id: 'child_pose',
  view: 'side',
  loop: 'pingpong',
  durationMs: 3000,
  pivot: 'ankleR',
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: rest },
    { t: 1, pose: inhale, ease: 'inOut' },
  ],
};
