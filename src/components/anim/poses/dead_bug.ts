/**
 * Dead bug — side view, two alternating reps per cycle.
 * Lying on the back (head to the left), arms pointing at the ceiling, hips and knees at 90°
 * (tabletop) → the near leg extends until the heel hovers above the floor while the opposite
 * (far) arm lowers overhead → back to tabletop → the other pair.
 *
 * Geometry: the hip stays on the floor. Tabletop: shoulder 90 (arm vertical with torso −90),
 * hip 90 / knee 90 (shin parallel to the floor). Extended: hip 15 (leg 15° above the floor),
 * arm 20° above the floor overhead (shoulder 160).
 */
import { GROUND_Y, basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const tabletop: Pose = {
  ...basePose('side'),
  rootX: 106,
  rootY: GROUND_Y - 2,
  torso: -90,
  head: 25,
  shoulderL: 86,
  shoulderR: 92,
  elbowL: 0,
  elbowR: 0,
  hipL: 88,
  hipR: 92,
  kneeL: 90,
  kneeR: 90,
  ankleL: -30,
  ankleR: -30,
};

// Near (R) leg out, far (L) arm overhead.
const extendR: Pose = {
  ...tabletop,
  hipR: 15,
  kneeR: 0,
  shoulderL: 160,
};

// Far (L) leg out, near (R) arm overhead.
const extendL: Pose = {
  ...tabletop,
  hipL: 15,
  kneeL: 0,
  shoulderR: 160,
};

export const dead_bug: PoseSet = {
  id: 'dead_bug',
  view: 'side',
  loop: 'cycle',
  durationMs: 2800,
  poster: 0.25,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: tabletop },
    { t: 0.25, pose: extendR, ease: 'inOut' },
    { t: 0.5, pose: tabletop, ease: 'inOut' },
    { t: 0.75, pose: extendL, ease: 'inOut' },
  ],
};
