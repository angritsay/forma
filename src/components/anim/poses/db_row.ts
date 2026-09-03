/**
 * Bent-over dumbbell row — side view, one repetition per cycle.
 * Hinged ~65° forward on soft knees, the far hand braced on a low box under the chest, the near
 * arm hanging with the dumbbell → the elbow drives back and up past the ribs, pulling the
 * dumbbell to the hip → lower under control to a straight arm.
 *
 * Geometry: feet at x 84, shoulders at (122, 88). The support arm is straight (11° forward) to a
 * box top at y 143, so its dumbbell — the prop draws one at every wrist — lies flat on the box
 * under the hand. Row top: upper arm pointing straight back (elbow 11 above the back line),
 * forearm angled down to the wrist at the lower ribs.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 65;
const FOOT_X = 84;

const hang: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -45,
    // Support arm to the box; working arm hanging 10° behind the vertical.
    shoulderL: T + 11,
    elbowL: 0,
    shoulderR: T - 10,
    elbowR: 0,
    hipL: 75,
    hipR: 75,
    kneeL: 18,
    kneeR: 18,
    ankleL: 8,
    ankleR: 8,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

const row: Pose = { ...hang, shoulderR: -28.4, elbowR: 128.9 };

export const db_row: PoseSet = {
  id: 'db_row',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'box', height: 34, width: 26, x: 132 }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: hang },
    { t: 0.42, pose: row, ease: 'inOut' },
    { t: 0.55, pose: row, ease: 'linear' },
    { t: 0.92, pose: hang, ease: 'inOut' },
  ],
};
