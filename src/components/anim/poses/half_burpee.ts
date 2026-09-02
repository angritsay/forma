/**
 * Half burpee — side view, one repetition per cycle. A burpee without the push-up and the jump:
 * stand → squat down with the hands on the floor → hop the feet back into a high plank → short
 * hold → hop the feet back in → stand all the way up. Same geometry as `burpee` (feet at x 104,
 * hands at x 136, the plank is the push_up top shifted so the wrists stay on the hands' spot);
 * no pivot because the feet travel.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 104;
const HAND_X = 136;
const PLANK_ANKLE = { x: HAND_X - 102.8, y: GROUND_Y - 11 };

const stand: Pose = plant(basePose('side'), 'side', { leg: 'R', x: FOOT_X });

const squatHands: Pose = plant(
  {
    ...stand,
    torso: 72,
    head: -45,
    shoulderR: 76.4,
    shoulderL: 72.4,
    elbowR: 15.5,
    elbowL: 15.5,
    hipR: 152,
    hipL: 152,
    kneeR: 105,
    kneeL: 105,
    ankleR: 25,
    ankleL: 25,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

// Feet in the air: hands planted, hips up, knees tucked.
const hop: Pose = {
  ...stand,
  rootX: 76.7,
  rootY: 132.6,
  torso: 80,
  head: -45,
  shoulderR: 92.2,
  shoulderL: 88.2,
  elbowR: 13.7,
  elbowL: 13.7,
  hipR: 110,
  hipL: 110,
  kneeR: 125,
  kneeL: 125,
  ankleR: -10,
  ankleL: -10,
};

const plank: Pose = plant(
  {
    ...stand,
    torso: 69.2,
    head: -12,
    shoulderL: 69.2,
    shoulderR: 69.2,
    elbowL: 0,
    elbowR: 0,
    ankleL: 2.8,
    ankleR: 2.8,
  },
  'side',
  { leg: 'R', x: PLANK_ANKLE.x, y: PLANK_ANKLE.y },
);

export const half_burpee: PoseSet = {
  id: 'half_burpee',
  view: 'side',
  loop: 'cycle',
  durationMs: 1300,
  poster: 0.45,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stand, ease: 'out' },
    { t: 0.18, pose: squatHands, ease: 'in' },
    { t: 0.27, pose: hop, ease: 'out' },
    { t: 0.38, pose: plank, ease: 'in' },
    { t: 0.5, pose: plank, ease: 'linear' },
    { t: 0.62, pose: hop, ease: 'out' },
    { t: 0.72, pose: squatHands, ease: 'in' },
    { t: 0.92, pose: stand, ease: 'out' },
  ],
};
