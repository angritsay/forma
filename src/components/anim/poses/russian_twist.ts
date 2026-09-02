/**
 * Russian twist — side view, two touches (one per side) per cycle.
 * Seated with the straight trunk leaning back ~45°, knees bent and feet lifted: the hands sweep
 * from the floor beside one hip, up through the centre in front of the chest, down to the floor
 * beside the other hip.
 *
 * The rig has no rotation axis, so the twist is expressed by what the profile actually shows:
 * the hands dropping to the floor beside the hip (arm hanging from the shoulder, forearm
 * forward to the floor) and rising through the centre, the trunk leaning back a little further
 * at each touch, and the near/far arms swapping their lead.
 */
import { GROUND_Y, basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const seat: Pose = {
  ...basePose('side'),
  rootX: 100,
  rootY: GROUND_Y - 4,
  torso: -40,
  head: 25,
  // Hands together in front of the chest.
  shoulderL: 38,
  shoulderR: 38,
  elbowL: 42,
  elbowR: 42,
  // Thighs 50° above the floor (hip 100 with torso −40), shins folded down (knee 90), feet up.
  hipL: 100,
  hipR: 100,
  kneeL: 90,
  kneeR: 90,
  ankleL: -40,
  ankleR: -40,
};

// Touch beside the near hip: upper arms hang from the shoulders, forearms reach the floor.
const touchNear: Pose = {
  ...seat,
  torso: -44,
  head: 28,
  shoulderR: -40,
  shoulderL: -30,
  elbowR: 74,
  elbowL: 74,
};
// Through the centre: hands in front of the chest.
const centre: Pose = { ...seat, torso: -38, head: 23 };
// Touch beside the far hip: the near arm leads.
const touchFar: Pose = {
  ...seat,
  torso: -44,
  head: 28,
  shoulderR: -30,
  shoulderL: -40,
  elbowR: 74,
  elbowL: 74,
};

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
