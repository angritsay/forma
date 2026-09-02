/**
 * Bird dog — side view, two alternating reps per cycle.
 * All fours (hands under the shoulders, knees under the hips, back flat) → the near arm reaches
 * forward while the opposite (far) leg extends back, both in line with the trunk → back to all
 * fours → the other pair.
 *
 * Geometry: shoulders 50 above the floor (arms vertical), hips 34 above it (thighs vertical), so
 * the trunk rises 16 units over 44 → torso 68.7°. Shins rest on the floor pointing back with the
 * ankle 4 units up so the pointed foot lies flat. Extended arm: 10° above horizontal
 * (shoulder 100 + torso); extended leg: horizontal (hip = torso − 90).
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const ANKLE = { x: 56, y: GROUND_Y - 4 };
const T = 68.7;

const quadruped: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -10,
    // Arms vertical: shoulder = torso.
    shoulderL: T,
    shoulderR: T,
    elbowL: 0,
    elbowR: 0,
    // Thighs vertical (hip = torso); shin absolute −97 → knee 97; foot lying back (ankle −40).
    hipL: T,
    hipR: T,
    kneeL: 97,
    kneeR: 97,
    ankleL: -40,
    ankleR: -40,
  },
  'side',
  { leg: 'R', x: ANKLE.x, y: ANKLE.y },
);

// Near arm forward + far leg back.
const reachR: Pose = {
  ...quadruped,
  shoulderR: 100 + T,
  hipL: T - 90,
  kneeL: 0,
  ankleL: -40,
};

// Far arm forward + near leg back.
const reachL: Pose = {
  ...quadruped,
  shoulderL: 100 + T,
  hipR: T - 90,
  kneeR: 0,
  ankleR: -40,
};

export const bird_dog: PoseSet = {
  id: 'bird_dog',
  view: 'side',
  loop: 'cycle',
  durationMs: 3200,
  poster: 0.25,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: quadruped },
    { t: 0.22, pose: reachR, ease: 'inOut' },
    { t: 0.32, pose: reachR, ease: 'linear' },
    { t: 0.5, pose: quadruped, ease: 'inOut' },
    { t: 0.72, pose: reachL, ease: 'inOut' },
    { t: 0.82, pose: reachL, ease: 'linear' },
  ],
};
