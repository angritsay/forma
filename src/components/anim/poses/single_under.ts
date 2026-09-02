/**
 * Single under (jump rope) — front view, one rope pass per cycle.
 * Small bounces on the balls of the feet, feet together, elbows tucked with the hands at hip
 * height turning the rope from the wrists. The rope prop sweeps under the feet at t ≈ 0, so the
 * jump apex sits at t = 0 and the landing at t = 0.5 (rope overhead).
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ground: Pose = plant(
  {
    ...basePose('front'),
    // Hands at hip height, a little out from the body, forearms angled out and down.
    shoulderL: 22,
    shoulderR: 22,
    elbowL: 62,
    elbowR: 62,
    hipL: 5,
    hipR: 5,
    kneeL: 0,
    kneeR: 0,
  },
  'front',
  { leg: 'R', y: GROUND_Y },
);

const apex: Pose = { ...ground, rootY: ground.rootY - 11, elbowL: 68, elbowR: 68 };

export const single_under: PoseSet = {
  id: 'single_under',
  view: 'front',
  loop: 'cycle',
  durationMs: 520,
  poster: 0,
  props: [{ kind: 'floor' }, { kind: 'rope' }],
  keyframes: [
    { t: 0, pose: apex, ease: 'out' },
    { t: 0.5, pose: ground, ease: 'in' },
  ],
};
