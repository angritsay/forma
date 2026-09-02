/**
 * Double under (jump rope) — front view.
 * A higher, longer bounce than the single under with the body long and the hands low and close
 * to the hips, the rope spun from the wrists. The rope prop passes once per animation cycle
 * (under the feet at t ≈ 0), so the second rotation of a real double under cannot be drawn —
 * the higher flight and quicker wrists are what distinguish it from the single under.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ground: Pose = plant(
  {
    ...basePose('front'),
    shoulderL: 16,
    shoulderR: 16,
    elbowL: 55,
    elbowR: 55,
    hipL: 5,
    hipR: 5,
    kneeL: 0,
    kneeR: 0,
  },
  'front',
  { leg: 'R', y: GROUND_Y },
);

const apex: Pose = { ...ground, rootY: ground.rootY - 22, elbowL: 66, elbowR: 66 };
const rising: Pose = { ...ground, rootY: ground.rootY - 9, elbowL: 60, elbowR: 60 };

export const double_under: PoseSet = {
  id: 'double_under',
  view: 'front',
  loop: 'cycle',
  durationMs: 640,
  poster: 0,
  props: [{ kind: 'floor' }, { kind: 'rope' }],
  keyframes: [
    { t: 0, pose: apex, ease: 'out' },
    { t: 0.35, pose: rising, ease: 'in' },
    { t: 0.5, pose: ground, ease: 'in' },
    { t: 0.65, pose: rising, ease: 'out' },
  ],
};
