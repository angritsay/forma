/**
 * Russian twist — side view, two touches (one per side) per cycle.
 * Seated with the straight trunk leaning back ~45°, knees bent and feet lifted: the hands sweep
 * from the floor beside one hip, up through the centre in front of the chest, down to the floor
 * beside the other hip.
 *
 * The rig has no rotation axis, so the twist is expressed by what the profile actually shows:
 * the hands dropping to the floor beside the hip and rising through the centre, the trunk
 * leaning back a little further at each touch, and the near/far arms swapping their lead (the
 * far arm reaches further when rotating away from the viewer).
 */
import { GROUND_Y, basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const seat: Pose = {
  ...basePose('side'),
  rootX: 100,
  rootY: GROUND_Y - 4,
  torso: -40,
  head: 25,
  shoulderL: 50,
  shoulderR: 50,
  elbowL: 20,
  elbowR: 20,
  // Thighs 50° above the floor (hip 100 with torso −40), shins folded down (knee 90), feet up.
  hipL: 100,
  hipR: 100,
  kneeL: 90,
  kneeR: 90,
  ankleL: -40,
  ankleR: -40,
};

// Touch beside the near hip: hands low, trunk a touch further back, far arm leading.
const touchNear: Pose = { ...seat, torso: -44, head: 28, shoulderR: 12, shoulderL: 24 };
// Through the centre: hands in front of the chest.
const centre: Pose = { ...seat, torso: -38, head: 23 };
// Touch beside the far hip: near arm leading.
const touchFar: Pose = { ...seat, torso: -44, head: 28, shoulderR: 24, shoulderL: 12 };

export const russian_twist: PoseSet = {
  id: 'russian_twist',
  view: 'side',
  loop: 'cycle',
  durationMs: 1500,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: touchNear },
    { t: 0.25, pose: centre, ease: 'inOut' },
    { t: 0.5, pose: touchFar, ease: 'inOut' },
    { t: 0.75, pose: centre, ease: 'inOut' },
  ],
};
