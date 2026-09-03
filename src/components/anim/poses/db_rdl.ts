/**
 * Dumbbell Romanian deadlift — side view, one repetition per cycle.
 * Standing tall with the dumbbells in front of the thighs → hips push back and the flat back
 * hinges to ~62° forward on soft knees, the dumbbells sliding down to just below the knees on
 * hanging arms → glutes squeeze and the hips drive forward back to standing.
 *
 * Geometry at the bottom: thigh 26° forward, shin 8° back (knee 34°), flat feet; arms hang 6°
 * behind the vertical so the dumbbells sit at knee height in front of the shins. The far arm is
 * 3° lower for depth.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 62;

const top: Pose = plant(
  { ...basePose('side'), shoulderL: 4, shoulderR: 6, elbowL: 0, elbowR: 0 },
  'side',
  { leg: 'R', x: 100 },
);

const bottom: Pose = plant(
  {
    ...top,
    torso: T,
    head: -43,
    shoulderL: T - 9,
    shoulderR: T - 6,
    hipL: 88,
    hipR: 88,
    kneeL: 34,
    kneeR: 34,
    ankleL: 34 - 88 + T,
    ankleR: 34 - 88 + T,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const db_rdl: PoseSet = {
  id: 'db_rdl',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.48, pose: bottom, ease: 'inOut' },
    { t: 0.56, pose: bottom, ease: 'linear' },
    { t: 0.92, pose: top, ease: 'inOut' },
  ],
};
