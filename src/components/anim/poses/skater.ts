/**
 * Skater jumps — front view, one leap each way per cycle.
 * Land on the right leg (knee soft, trunk leaning into it) with the left leg trailing behind and
 * across, arms swinging opposite as on skates → push off and fly to the left → land on the left
 * leg mirrored → fly back to the right.
 *
 * The root travels ±17 units sideways so the bound reads as lateral, not vertical; landings are
 * planted on the support foot, flights lift the root.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const base = basePose('front');

// Landing on the right foot (screen right): support leg slightly abducted with the shin
// vertical, trailing left leg crossed behind it, left arm across the body, right arm out.
const landR: Pose = plant(
  {
    ...base,
    torso: 6,
    head: -6,
    shoulderL: -35,
    elbowL: 10,
    shoulderR: 60,
    elbowR: 25,
    hipR: 12,
    kneeR: 12,
    ankleR: 0,
    hipL: -22,
    kneeL: 45,
    ankleL: 0,
  },
  'front',
  { leg: 'R', x: 130, y: GROUND_Y },
);

const landL: Pose = plant(
  {
    ...base,
    torso: -6,
    head: 6,
    shoulderR: -35,
    elbowR: 10,
    shoulderL: 60,
    elbowL: 25,
    hipL: 12,
    kneeL: 12,
    ankleL: 0,
    hipR: -22,
    kneeR: 45,
    ankleR: 0,
  },
  'front',
  { leg: 'L', x: 70, y: GROUND_Y },
);

// Flight: centred, root up, legs gathered with soft knees, arms swinging through.
const flight: Pose = {
  ...base,
  rootX: 100,
  rootY: base.rootY - 12,
  torso: 0,
  head: 0,
  shoulderL: 22,
  elbowL: 20,
  shoulderR: 22,
  elbowR: 20,
  hipL: 10,
  hipR: 10,
  kneeL: 15,
  kneeR: 15,
  ankleL: 0,
  ankleR: 0,
};

export const skater: PoseSet = {
  id: 'skater',
  view: 'front',
  loop: 'cycle',
  durationMs: 1000,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: landR, ease: 'in' },
    { t: 0.25, pose: flight, ease: 'out' },
    { t: 0.5, pose: landL, ease: 'in' },
    { t: 0.75, pose: flight, ease: 'out' },
  ],
};
