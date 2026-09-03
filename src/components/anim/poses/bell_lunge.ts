/**
 * Dumbbell reverse lunge — side view, one repetition per cycle (the far leg steps back).
 * Standing tall with a dumbbell hanging quietly at each side → the far leg swings back through
 * the air → long step back to the bottom: front thigh horizontal over a vertical shin, rear knee
 * hovering just above the floor, torso upright, dumbbells still at the sides → push through the
 * front heel back to standing. The near foot stays planted at x 116 (pivot).
 *
 * Leg geometry is shared with the bodyweight reverse lunge; the arms hang straight (the far one
 * 3° behind the near one so both dumbbells show).
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 116;

const arms = { shoulderL: 2, shoulderR: 5, elbowL: 0, elbowR: 0 };

const stand: Pose = plant({ ...basePose('side'), ...arms }, 'side', { leg: 'R', x: FOOT_X });

const step: Pose = plant(
  {
    ...stand,
    torso: 4,
    head: -3,
    hipR: 12,
    kneeR: 15,
    ankleR: 15 - 12 + 4,
    hipL: -12,
    kneeL: 40,
    ankleL: -10,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

const bottom: Pose = plant(
  {
    ...stand,
    torso: 6,
    head: -4,
    hipR: 96,
    kneeR: 90,
    ankleR: 0,
    hipL: -36.7,
    kneeL: 53.4,
    ankleL: 36.1,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

const recover: Pose = plant(
  {
    ...stand,
    torso: 4,
    head: -3,
    hipR: 30,
    kneeR: 34,
    ankleR: 34 - 30 + 4,
    hipL: 10,
    kneeL: 45,
    ankleL: -12,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

export const bell_lunge: PoseSet = {
  id: 'bell_lunge',
  view: 'side',
  loop: 'cycle',
  durationMs: 2200,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: stand },
    { t: 0.16, pose: step, ease: 'out' },
    { t: 0.45, pose: bottom, ease: 'inOut' },
    { t: 0.56, pose: bottom, ease: 'linear' },
    { t: 0.74, pose: recover, ease: 'inOut' },
    { t: 0.9, pose: stand, ease: 'out' },
  ],
};
