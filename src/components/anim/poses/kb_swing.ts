/**
 * Kettlebell swing (Russian, to chest height) — side view, one swing per cycle.
 * Top: standing tall, hips locked, straight arms horizontal with the bell floating at chest
 * height → the bell falls while the hips push back late → bottom: hinge ~50° forward on soft
 * knees, arms swung back between the legs with the bell behind the thighs → hip snap: the trunk
 * is upright before the arms are, and the bell floats forward and up on straight arms.
 *
 * The bell continues the forearm line (`inline`), so at the bottom it sits behind the legs and
 * at the top it points forward. The far arm is 3–6° lower than the near one for depth.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const top: Pose = plant(
  { ...basePose('side'), shoulderL: 86, shoulderR: 92, elbowL: 0, elbowR: 0 },
  'side',
  { leg: 'R', x: 100 },
);

// Bell falling, hips only starting to move back.
const fall: Pose = plant(
  {
    ...top,
    torso: 10,
    head: -7,
    shoulderL: 45,
    shoulderR: 50,
    hipL: 16,
    hipR: 16,
    kneeL: 10,
    kneeR: 10,
    ankleL: 4,
    ankleR: 4,
  },
  'side',
  { leg: 'R', x: 100 },
);

// Bottom: arms 35° behind the vertical, hands high in the groin, flat feet.
const bottom: Pose = plant(
  {
    ...top,
    torso: 50,
    head: -35,
    shoulderL: 12,
    shoulderR: 15,
    hipL: 80,
    hipR: 80,
    kneeL: 40,
    kneeR: 40,
    ankleL: 10,
    ankleR: 10,
  },
  'side',
  { leg: 'R', x: 100 },
);

// Hips nearly locked while the arms are still low: the snap leads, the bell follows.
const drive: Pose = plant(
  {
    ...top,
    torso: 8,
    head: -6,
    shoulderL: 35,
    shoulderR: 40,
    hipL: 12,
    hipR: 12,
    kneeL: 8,
    kneeR: 8,
    ankleL: 4,
    ankleR: 4,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const kb_swing: PoseSet = {
  id: 'kb_swing',
  view: 'side',
  loop: 'cycle',
  durationMs: 1000,
  pivot: 'ankleR',
  poster: 0,
  props: [{ kind: 'floor' }, { kind: 'kettlebell', grip: 'inline' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.25, pose: fall, ease: 'in' },
    { t: 0.5, pose: bottom, ease: 'out' },
    { t: 0.72, pose: drive, ease: 'out' },
    { t: 0.92, pose: top, ease: 'out' },
  ],
};
