/**
 * Farmer carry — side view, one full stride (both feet) per cycle, walking on the spot.
 * Tall posture, shoulders back, arms straight at the sides with a dumbbell in each hand, short
 * even steps: heel strike in front → the support leg passes under the hips while the other foot
 * swings through with a bent knee → heel strike with the other foot.
 *
 * Treadmill-style: the hips stay at x 100 and the feet travel beneath them. Each keyframe is
 * planted on its support foot; the rear toe touches the floor at heel strike and the swing foot
 * clears the floor by ~9 in mid-stride.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 2;
const arms = { shoulderL: 2, shoulderR: 4, elbowL: 0, elbowR: 0 };

// Heel strike in front (dorsiflexed foot), rear leg at toe-off.
const front = { hip: 20, knee: 3, ankle: 6 };
const rear = { hip: -18, knee: 30, ankle: -30 };
// Support leg vertical under the hips, swing leg passing with a bent knee.
const support = { hip: 2, knee: 2, ankle: 1 };
const swing = { hip: 26, knee: 60, ankle: 0 };

const contactR: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -1,
    ...arms,
    hipR: front.hip,
    kneeR: front.knee,
    ankleR: front.ankle,
    hipL: rear.hip,
    kneeL: rear.knee,
    ankleL: rear.ankle,
  },
  'side',
  { leg: 'R' },
);

const passL: Pose = plant(
  {
    ...contactR,
    hipR: support.hip,
    kneeR: support.knee,
    ankleR: support.ankle,
    hipL: swing.hip,
    kneeL: swing.knee,
    ankleL: swing.ankle,
  },
  'side',
  { leg: 'R' },
);

const contactL: Pose = plant(
  {
    ...contactR,
    hipL: front.hip,
    kneeL: front.knee,
    ankleL: front.ankle,
    hipR: rear.hip,
    kneeR: rear.knee,
    ankleR: rear.ankle,
  },
  'side',
  { leg: 'L' },
);

const passR: Pose = plant(
  {
    ...contactR,
    hipL: support.hip,
    kneeL: support.knee,
    ankleL: support.ankle,
    hipR: swing.hip,
    kneeR: swing.knee,
    ankleR: swing.ankle,
  },
  'side',
  { leg: 'L' },
);

export const farmer_carry: PoseSet = {
  id: 'farmer_carry',
  view: 'side',
  loop: 'cycle',
  durationMs: 1200,
  poster: 0,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: contactR, ease: 'linear' },
    { t: 0.25, pose: passL, ease: 'linear' },
    { t: 0.5, pose: contactL, ease: 'linear' },
    { t: 0.75, pose: passR, ease: 'linear' },
  ],
};
