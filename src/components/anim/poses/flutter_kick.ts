/**
 * Flutter kicks — side view, one scissor (both legs swap) per cycle.
 * Lying on the back (head to the left) with the head and shoulders slightly lifted, arms by the
 * sides on the floor, straight legs hovering: short quick alternating kicks, toes pointed, feet
 * never touching the floor.
 *
 * Geometry: the hip stays on the floor; torso −80 (shoulders 10° up), arms along the floor
 * (absolute 90 → shoulder 10). Legs alternate between 28° and 10° above the floor.
 */
import { GROUND_Y, basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const HIGH = 38; // hip for a leg 28° above the floor (thigh abs 118 with torso −80)
const LOW = 20; // 10° above the floor

const kickR: Pose = {
  ...basePose('side'),
  rootX: 96,
  rootY: GROUND_Y - 2,
  torso: -80,
  head: 32,
  shoulderL: 10,
  shoulderR: 10,
  elbowL: 0,
  elbowR: 0,
  hipL: LOW,
  hipR: HIGH,
  kneeL: 0,
  kneeR: 0,
  ankleL: -35,
  ankleR: -35,
};

const kickL: Pose = { ...kickR, hipL: HIGH, hipR: LOW };

export const flutter_kick: PoseSet = {
  id: 'flutter_kick',
  view: 'side',
  loop: 'cycle',
  durationMs: 600,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: kickR },
    { t: 0.5, pose: kickL, ease: 'inOut' },
  ],
};
