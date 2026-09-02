/**
 * Squat to stand — side view, one repetition per cycle.
 * Stand → fold forward with almost straight legs and grab the toes → holding the feet, drop the
 * hips into a deep squat with the chest lifted and the arms straight down inside the knees →
 * lift the hips and straighten the legs again (hamstring stretch) → stand. The feet stay flat
 * at x 100 (pivot).
 *
 * Geometry: fold — torso 116° (26° past horizontal, chest toward the shins), knees 8°, straight
 * arms reach the toes at (112, 167). Squat — hip 34 above the floor, torso 38° forward, knees
 * 110° with the shins 33° forward (ankle at the dorsiflexion limit), arms hanging to the feet.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const stand: Pose = plant(basePose('side'), 'side', { leg: 'R', x: 100 });

const fold: Pose = plant(
  {
    ...stand,
    torso: 116,
    head: 8,
    shoulderR: 73,
    shoulderL: 69,
    elbowR: 22.8,
    elbowL: 22.8,
    hipR: 121.2,
    hipL: 121.2,
    kneeR: 8,
    kneeL: 8,
    ankleR: 2.8,
    ankleL: 2.8,
  },
  'side',
  { leg: 'R', x: 100 },
);

const squat: Pose = plant(
  {
    ...stand,
    torso: 38,
    head: -26,
    shoulderR: 44,
    shoulderL: 40,
    elbowR: 5,
    elbowL: 5,
    hipR: 115,
    hipL: 115,
    kneeR: 110,
    kneeL: 110,
    ankleR: 110 - 115 + 38, // flat foot: knee − hip + torso
    ankleL: 110 - 115 + 38,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const squat_to_stand: PoseSet = {
  id: 'squat_to_stand',
  view: 'side',
  loop: 'cycle',
  durationMs: 2600,
  pivot: 'ankleR',
  poster: 0.55,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand },
    { t: 0.28, pose: fold, ease: 'inOut' },
    { t: 0.52, pose: squat, ease: 'inOut' },
    { t: 0.62, pose: squat, ease: 'linear' },
    { t: 0.82, pose: fold, ease: 'inOut' },
  ],
};
