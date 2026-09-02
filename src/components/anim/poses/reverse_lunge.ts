/**
 * Reverse lunge — side view, one repetition per cycle (the far leg steps back).
 * Stand → the far (left) leg lifts and swings back through the air → long step back into the
 * bottom: front shin vertical under a horizontal thigh, rear knee hovering just above the floor
 * with the toes tucked, torso upright, hands clasped in front → push through the front heel
 * back to standing. The near (right) foot stays planted at x 116 (pivot).
 *
 * Geometry at the bottom: the hip sits 34 behind and 32 above the front ankle; the rear knee is
 * 7 above the floor and the rear shin runs back almost horizontally to an ankle 10 above the
 * ground, so the pointed rear foot (30° from the vertical) touches the floor with the toe tip.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 116;

// Hands clasped in front of the chest, the far arm a few degrees lower for depth.
const arms = { shoulderL: 34, shoulderR: 40, elbowL: 95, elbowR: 95 };

const stand: Pose = plant({ ...basePose('side'), ...arms }, 'side', { leg: 'R', x: FOOT_X });

// Rear leg lifted and travelling back; the front knee softens to take the weight.
const step: Pose = plant(
  {
    ...stand,
    torso: 4,
    head: -3,
    hipR: 12,
    kneeR: 15,
    ankleR: 15 - 12 + 4, // flat foot: knee − hip + torso
    hipL: -12,
    kneeL: 40,
    ankleL: -10,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

const bottom: Pose = plant(
  {
    ...stand,
    torso: 6,
    head: -4,
    // Front leg: thigh horizontal (hip = 90 + torso), shin vertical, flat foot.
    hipR: 96,
    kneeR: 90,
    ankleR: 0,
    // Rear leg: thigh 42.7° back from the vertical, shin 96° (almost horizontal), toes tucked.
    hipL: -36.7,
    kneeL: 53.4,
    ankleL: 36.1,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Return: the rear leg swings forward with a bent knee so the foot clears the floor.
const recover: Pose = plant(
  {
    ...stand,
    torso: 4,
    head: -3,
    hipR: 30,
    kneeR: 34,
    ankleR: 34 - 30 + 4,
    hipL: 10,
    kneeL: 45,
    ankleL: -12,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

export const reverse_lunge: PoseSet = {
  id: 'reverse_lunge',
  view: 'side',
  loop: 'cycle',
  durationMs: 2200,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand },
    { t: 0.16, pose: step, ease: 'out' },
    { t: 0.45, pose: bottom, ease: 'inOut' },
    { t: 0.56, pose: bottom, ease: 'linear' },
    { t: 0.74, pose: recover, ease: 'inOut' },
    { t: 0.9, pose: stand, ease: 'out' },
  ],
};
