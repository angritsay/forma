/**
 * Bear crawl — side view, in-place crawl cycle (both diagonal pairs step once per cycle).
 * Hands under the shoulders, knees bent 90° and hovering just above the floor, back flat.
 * Opposite hand and foot step forward together while the other pair slides back under the body
 * (treadmill motion so the athlete stays centred on the tile).
 *
 * Geometry: shoulders 50 above the floor (arms vertical), hips 34 above the knees which hover
 * 11 above the ground; shins horizontal back to the ankles, toes on the floor. Trunk 83.5° from
 * the vertical (nearly flat). A hand step is ±14 units (arm tilt ±16°); a foot step is the thigh
 * tilting ±20° over its hovering knee.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 83.5;

const neutral: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -8,
    shoulderL: 82,
    shoulderR: 82,
    elbowL: 3,
    elbowR: 3,
    hipL: T,
    hipR: T,
    kneeL: 90,
    kneeR: 90,
    ankleL: 20,
    ankleR: 20,
  },
  'side',
  { leg: 'R', x: 70, y: GROUND_Y - 11 },
);

// Hand positions (upper arm tilted, elbow straight): forward, back, mid-swing (lifted).
const handFwd = { shoulder: 99.1, elbow: 0 };
const handBack = { shoulder: 67.8, elbow: 0 };
const handLift = { shoulder: 66, elbow: 50 };
// Foot positions: thigh tilted ±20° with the shin kept horizontal; lifted = shin swung up.
const footFwd = { hip: T + 20, knee: 110, ankle: 20 };
const footBack = { hip: T - 20, knee: 70, ankle: 20 };
const footLift = { hip: T, knee: 110, ankle: 10 };
const footMid = { hip: T, knee: 90, ankle: 20 };

const stepR: Pose = {
  ...neutral,
  shoulderR: handFwd.shoulder,
  elbowR: handFwd.elbow,
  shoulderL: handBack.shoulder,
  elbowL: handBack.elbow,
  hipL: footFwd.hip,
  kneeL: footFwd.knee,
  ankleL: footFwd.ankle,
  hipR: footBack.hip,
  kneeR: footBack.knee,
  ankleR: footBack.ankle,
};

const swingL: Pose = {
  ...neutral,
  shoulderR: neutral.shoulderR,
  elbowR: neutral.elbowR,
  shoulderL: handLift.shoulder,
  elbowL: handLift.elbow,
  hipL: footMid.hip,
  kneeL: footMid.knee,
  ankleL: footMid.ankle,
  hipR: footLift.hip,
  kneeR: footLift.knee,
  ankleR: footLift.ankle,
};

const stepL: Pose = {
  ...neutral,
  shoulderL: handFwd.shoulder,
  elbowL: handFwd.elbow,
  shoulderR: handBack.shoulder,
  elbowR: handBack.elbow,
  hipR: footFwd.hip,
  kneeR: footFwd.knee,
  ankleR: footFwd.ankle,
  hipL: footBack.hip,
  kneeL: footBack.knee,
  ankleL: footBack.ankle,
};

const swingR: Pose = {
  ...neutral,
  shoulderL: neutral.shoulderL,
  elbowL: neutral.elbowL,
  shoulderR: handLift.shoulder,
  elbowR: handLift.elbow,
  hipR: footMid.hip,
  kneeR: footMid.knee,
  ankleR: footMid.ankle,
  hipL: footLift.hip,
  kneeL: footLift.knee,
  ankleL: footLift.ankle,
};

export const bear_crawl: PoseSet = {
  id: 'bear_crawl',
  view: 'side',
  loop: 'cycle',
  durationMs: 1200,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: stepR },
    { t: 0.25, pose: swingL, ease: 'inOut' },
    { t: 0.5, pose: stepL, ease: 'inOut' },
    { t: 0.75, pose: swingR, ease: 'inOut' },
  ],
};
