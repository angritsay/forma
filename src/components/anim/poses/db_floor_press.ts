/**
 * Dumbbell floor press — side view, one repetition per cycle.
 * Lying on the back (head to the left), knees bent, feet flat, dumbbells locked out over the
 * chest → elbows bend and travel down until the upper arms rest on the floor beside the ribs,
 * forearms vertical → short pause → press back to lockout.
 *
 * Geometry: legs as in the glute-bridge start (feet planted at x 126, the pivot), torso flat
 * (−90) with the chin tucked so the head rests on the floor. Top: arms 10° toward the feet from
 * vertical. Bottom: upper arm along the floor toward the feet (elbow on the floor, y 169) with
 * the forearm straight up, so the dumbbell hovers 24 above the elbow.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 126;

const top: Pose = plant(
  {
    ...basePose('side'),
    torso: -90,
    head: 25,
    shoulderL: 76,
    shoulderR: 80,
    elbowL: 0,
    elbowR: 0,
    hipL: 55,
    hipR: 55,
    kneeL: 129.6,
    kneeR: 129.6,
    ankleL: -15.4,
    ankleR: -15.4,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

const bottom: Pose = { ...top, shoulderL: -3, shoulderR: 0, elbowL: 90, elbowR: 90 };

export const db_floor_press: PoseSet = {
  id: 'db_floor_press',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.45, pose: bottom, ease: 'inOut' },
    { t: 0.55, pose: bottom, ease: 'linear' },
    { t: 0.92, pose: top, ease: 'inOut' },
  ],
};
