/**
 * Mountain climbers — side view, one full stride (both knees) per cycle.
 * High plank with the hands under the shoulders → the near knee drives toward the chest while
 * the far leg stays long on its toes → legs swap through a low tucked pass → the far knee in.
 *
 * Geometry: ankle of the back leg pinned 11 above the ground (toes on the floor); hips slightly
 * higher than a strict plank (torso 76 → a ~15° pike) so the driving knee has room under the
 * trunk. Knee-in: thigh 53° from the vertical (hip 129), shin folded back (knee 140), foot
 * hovering. The root stays fixed; the back leg is planted on every keyframe.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 46, y: GROUND_Y - 11 };
const T = 76;

// Long back leg: hip 11.5, knee 0, toe on the floor (foot 24° from the vertical).
const back = { hip: 11.5, knee: 0, ankle: -1.5 };
// Knee driven in under the trunk.
const drive = { hip: 129, knee: 140, ankle: -3 };
// Passing position: thigh vertical, shin lifted.
const pass = { hip: 70, knee: 110, ankle: 10 };

const plank: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -14,
    shoulderL: T,
    shoulderR: T,
    elbowL: 0,
    elbowR: 0,
    hipL: back.hip,
    hipR: back.hip,
    kneeL: back.knee,
    kneeR: back.knee,
    ankleL: back.ankle,
    ankleR: back.ankle,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

const driveR: Pose = { ...plank, hipR: drive.hip, kneeR: drive.knee, ankleR: drive.ankle };
const driveL: Pose = { ...plank, hipL: drive.hip, kneeL: drive.knee, ankleL: drive.ankle };
const swap: Pose = {
  ...plank,
  hipL: pass.hip,
  hipR: pass.hip,
  kneeL: pass.knee,
  kneeR: pass.knee,
  ankleL: pass.ankle,
  ankleR: pass.ankle,
};

export const mountain_climber: PoseSet = {
  id: 'mountain_climber',
  view: 'side',
  loop: 'cycle',
  durationMs: 700,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: driveR },
    { t: 0.25, pose: swap, ease: 'inOut' },
    { t: 0.5, pose: driveL, ease: 'inOut' },
    { t: 0.75, pose: swap, ease: 'inOut' },
  ],
};
