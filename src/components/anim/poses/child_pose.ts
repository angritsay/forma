/**
 * Child's pose — side view, static hold with a slow breathing motion.
 * Kneeling with the hips on the heels, trunk folded forward over the thighs, forehead on the
 * floor, arms stretched forward along the floor.
 *
 * Geometry: knees on the floor at x ≈ 89 with the shins pointing back (ankle 4 up so the pointed
 * foot lies flat); thighs fold 55° from the vertical so the hip sits low over the heels; the
 * trunk slopes 18° below horizontal down to the shoulders resting on the floor (torso 107.9);
 * the neck bends back (head −33) so the head rests on the floor in front of the shoulders;
 * arms continue forward 7° below horizontal to the hands on the floor.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 57, y: GROUND_Y - 4 };
const T = 107.9;

const rest: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -33,
    // Arm absolute 83° (forward, slightly down) → shoulder = 83 + torso.
    shoulderL: 83 + T,
    shoulderR: 83 + T,
    elbowL: 0,
    elbowR: 0,
    // Thigh absolute 55 → hip = 55 + torso; shin absolute −97.2 → knee = 55 + 97.2.
    hipL: 55 + T,
    hipR: 55 + T,
    kneeL: 152.2,
    kneeR: 152.2,
    ankleL: -40,
    ankleR: -40,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

// Slow belly breath: the back rises ~2° and settles.
const inhale: Pose = plant(
  { ...rest, torso: T - 2, head: -31, shoulderL: 83 + T - 2, shoulderR: 83 + T - 2 },
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
