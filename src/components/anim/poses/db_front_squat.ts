/**
 * Dumbbell front squat — side view, one repetition per cycle.
 * Standing tall with the dumbbells resting on the front of the shoulders, elbows pointing
 * forward → hips back and down to a deep squat with the torso close to upright (~22°) and the
 * elbows still forward → drive up, short pause standing.
 *
 * Geometry: front rack = upper arm 47° forward, elbow 140° so the hand sits 16 in front and 6
 * above the shoulder joint; the dumbbell (perpendicular to the near-vertical forearm) lies across
 * the shoulder just clear of the chin. Bottom: thigh 78° forward, shin 32° forward, flat feet.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 22;

/** Front-rack arms; the far arm sits 3° lower so it peeks out behind the near one. */
export const FRONT_RACK = { shoulderL: 44, shoulderR: 47, elbowL: 140, elbowR: 140 };

const top: Pose = plant({ ...basePose('side'), ...FRONT_RACK }, 'side', { leg: 'R', x: 100 });

const bottom: Pose = plant(
  {
    ...top,
    torso: T,
    head: -15,
    hipL: 100,
    hipR: 100,
    kneeL: 110,
    kneeR: 110,
    ankleL: 110 - 100 + T,
    ankleR: 110 - 100 + T,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const db_front_squat: PoseSet = {
  id: 'db_front_squat',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.5, pose: bottom, ease: 'inOut' },
    { t: 0.88, pose: top, ease: 'inOut' },
  ],
};
