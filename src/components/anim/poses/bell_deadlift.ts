/**
 * Kettlebell deadlift — side view, one repetition per cycle.
 * Start hinged over the bell on the floor (hips back, knees bent, flat back ~54° forward,
 * shoulders over the bell, arms straight) → stand up by extending knees and hips together, the
 * bell travelling straight up to hang at arm's length → short squeeze tall → lower along the same
 * path and pause with the bell on the floor.
 *
 * Geometry: bottom solved by IK so a vertical arm from the shoulder puts the wrists at (120, 147)
 * — the bell body (15.5 below the hands) then rests on the floor just in front of the toes. Thigh
 * 55° forward, knee 77°, flat feet.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 54;

const floor: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -38,
    shoulderL: T,
    shoulderR: T,
    elbowL: 0,
    elbowR: 0,
    hipL: 108.9,
    hipR: 108.9,
    kneeL: 77.3,
    kneeR: 77.3,
    ankleL: 22.4,
    ankleR: 22.4,
  },
  'side',
  { leg: 'R', x: 100 },
);

const top: Pose = plant(
  { ...basePose('side'), shoulderL: 4, shoulderR: 4, elbowL: 0, elbowR: 0 },
  'side',
  { leg: 'R', x: 100 },
);

export const bell_deadlift: PoseSet = {
  id: 'bell_deadlift',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 0,
  props: [{ kind: 'floor' }, { kind: 'kettlebell', grip: 'inline' }],
  keyframes: [
    { t: 0, pose: floor },
    { t: 0.42, pose: top, ease: 'out' },
    { t: 0.56, pose: top, ease: 'linear' },
    { t: 0.92, pose: floor, ease: 'inOut' },
  ],
};
