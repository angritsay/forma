/**
 * Suitcase carry — side view, one full stride per cycle, walking on the spot.
 * Tall posture, shoulders level, the kettlebell hanging from one straight arm like a suitcase,
 * short even steps without leaning toward or away from the bell.
 *
 * The walk cycle matches the farmer carry. Both arms share identical angles so the far arm hides
 * behind the near one and the bell — anchored between the wrists by the rig — hangs from what
 * reads as a single hand.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 2;
const arm = { shoulderL: 4, shoulderR: 4, elbowL: 0, elbowR: 0 };

const front = { hip: 20, knee: 3, ankle: 6 };
const rear = { hip: -18, knee: 30, ankle: -30 };
const support = { hip: 2, knee: 2, ankle: 1 };
const swing = { hip: 26, knee: 60, ankle: 0 };

const contactR: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -1,
    ...arm,
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

export const suitcase_carry: PoseSet = {
  id: 'suitcase_carry',
  view: 'side',
  loop: 'cycle',
  durationMs: 1200,
  poster: 0,
  props: [{ kind: 'floor' }, { kind: 'kettlebell', grip: 'hang' }],
  keyframes: [
    { t: 0, pose: contactR, ease: 'linear' },
    { t: 0.25, pose: passL, ease: 'linear' },
    { t: 0.5, pose: contactL, ease: 'linear' },
    { t: 0.75, pose: passR, ease: 'linear' },
  ],
};
