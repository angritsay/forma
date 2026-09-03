/**
 * One-arm dumbbell snatch — side view, one repetition per cycle.
 * Hinged over the dumbbell on the floor (flat back ~78° forward, shoulder over the bell) →
 * powerful leg and hip extension onto the toes with the arm still straight → turnover: elbow
 * high and forward, punching under the dumbbell with a soft knee bend → full lockout overhead
 * standing tall → lower to the shoulder, to the hip, and back to the floor.
 *
 * Both arms share the same angles so the far arm hides behind the near one and a single
 * dumbbell is visible — the rig draws a dumbbell at every wrist. Start geometry solved by IK: the
 * wrist lands at (116, 162), plates 4 above the floor just in front of the toes.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const oneArm = (shoulder: number, elbow: number) => ({
  shoulderL: shoulder,
  shoulderR: shoulder,
  elbowL: elbow,
  elbowR: elbow,
});

const floor: Pose = plant(
  {
    ...basePose('side'),
    torso: 78,
    head: -55,
    ...oneArm(68, 0),
    hipL: 132.9,
    hipR: 132.9,
    kneeL: 72.2,
    kneeR: 72.2,
    ankleL: 17.2,
    ankleR: 17.2,
  },
  'side',
  { leg: 'R', x: 100 },
);

// Triple extension: tall, slight lean back, on the toes (foot 74° → toe tip 3.3 below the ankle).
const extension: Pose = plant(
  {
    ...basePose('side'),
    torso: -4,
    head: 3,
    ...oneArm(8, 0),
    ankleL: -20,
    ankleR: -20,
  },
  'side',
  { leg: 'R', x: 100, y: GROUND_Y - 3.3 },
);

// Turnover: elbow forward-up, hand above the shoulder, knees softening to receive.
const turnover: Pose = plant(
  {
    ...basePose('side'),
    ...oneArm(120, 100),
    hipL: 20,
    hipR: 20,
    kneeL: 24,
    kneeR: 24,
    ankleL: 4,
    ankleR: 4,
  },
  'side',
  { leg: 'R', x: 100 },
);

const lockout: Pose = plant(
  { ...basePose('side'), head: -4, ...oneArm(178, 0) },
  'side',
  { leg: 'R', x: 100 },
);

const rack: Pose = { ...lockout, head: 0, ...oneArm(47, 140) };
const hip: Pose = { ...lockout, head: 0, ...oneArm(8, 0) };

export const bell_snatch: PoseSet = {
  id: 'bell_snatch',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 0.56,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: floor },
    { t: 0.28, pose: extension, ease: 'in' },
    { t: 0.4, pose: turnover, ease: 'out' },
    { t: 0.5, pose: lockout, ease: 'out' },
    { t: 0.62, pose: lockout, ease: 'linear' },
    { t: 0.76, pose: rack, ease: 'inOut' },
    { t: 0.86, pose: hip, ease: 'inOut' },
  ],
};
