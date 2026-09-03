/**
 * Dumbbell clean — side view, one repetition per cycle.
 * Hinged over the dumbbells beside the feet (flat back ~74° forward, shoulders over the hands)
 * → explosive leg and hip extension onto the toes with straight arms → quick drop under the
 * weight: elbows whip forward and the dumbbells land on the shoulders in a quarter squat →
 * stand tall in the front rack → lower to the thighs and back to the floor.
 *
 * Start geometry solved by IK: arms 18° behind the vertical put the wrists at (110, 160), the
 * dumbbells beside the feet, 8 above the floor.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import { FRONT_RACK } from './db_front_squat';
import type { Pose, PoseSet } from './types';

const floor: Pose = plant(
  {
    ...basePose('side'),
    torso: 74,
    head: -52,
    shoulderL: 53,
    shoulderR: 56,
    elbowL: 0,
    elbowR: 0,
    hipL: 132.4,
    hipR: 132.4,
    kneeL: 80.7,
    kneeR: 80.7,
    ankleL: 22.3,
    ankleR: 22.3,
  },
  'side',
  { leg: 'R', x: 100 },
);

// Triple extension: tall, slight lean back, up on the toes.
const extension: Pose = plant(
  {
    ...basePose('side'),
    torso: -4,
    head: 3,
    shoulderL: 4,
    shoulderR: 7,
    elbowL: 0,
    elbowR: 0,
    ankleL: -20,
    ankleR: -20,
  },
  'side',
  { leg: 'R', x: 100, y: GROUND_Y - 3.3 },
);

// Catch: front rack in a quarter squat, torso slightly forward, flat feet.
const catchPose: Pose = plant(
  {
    ...basePose('side'),
    torso: 6,
    head: -4,
    ...FRONT_RACK,
    hipL: 32,
    hipR: 32,
    kneeL: 38,
    kneeR: 38,
    ankleL: 38 - 32 + 6,
    ankleR: 38 - 32 + 6,
  },
  'side',
  { leg: 'R', x: 100 },
);

const rack: Pose = plant({ ...basePose('side'), ...FRONT_RACK }, 'side', { leg: 'R', x: 100 });

const thighs: Pose = { ...rack, shoulderL: 4, shoulderR: 7, elbowL: 0, elbowR: 0 };

export const bell_clean: PoseSet = {
  id: 'bell_clean',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 0.42,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: floor },
    { t: 0.28, pose: extension, ease: 'in' },
    { t: 0.42, pose: catchPose, ease: 'out' },
    { t: 0.56, pose: rack, ease: 'inOut' },
    { t: 0.66, pose: rack, ease: 'linear' },
    { t: 0.82, pose: thighs, ease: 'inOut' },
  ],
};
