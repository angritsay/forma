/**
 * Dumbbell push press — side view, one repetition per cycle.
 * Front rack standing → quick shallow dip (knees ~26°, torso upright, heels down) → explosive
 * leg drive that launches the dumbbells past the mid position to a full overhead lockout → lower
 * back to the shoulders, absorbing with a slight knee bend, and stand tall.
 */
import { basePose, plant } from '../rig';
import { FRONT_RACK } from './db_front_squat';
import type { Pose, PoseSet } from './types';

const rack: Pose = plant({ ...basePose('side'), ...FRONT_RACK }, 'side', { leg: 'R', x: 100 });

// Dip: flat feet, ankle = knee − hip + torso.
const dip: Pose = plant(
  { ...rack, head: 0, hipL: 22, hipR: 22, kneeL: 26, kneeR: 26, ankleL: 4, ankleR: 4 },
  'side',
  { leg: 'R', x: 100 },
);

const drive: Pose = { ...rack, shoulderL: 116, shoulderR: 120, elbowL: 60, elbowR: 60 };

const lockout: Pose = { ...rack, head: -4, shoulderL: 172, shoulderR: 176, elbowL: 4, elbowR: 4 };

// Catch: dumbbells back at the shoulders with soft knees.
const absorb: Pose = plant(
  { ...rack, hipL: 10, hipR: 10, kneeL: 12, kneeR: 12, ankleL: 2, ankleR: 2 },
  'side',
  { leg: 'R', x: 100 },
);

export const db_push_press: PoseSet = {
  id: 'db_push_press',
  view: 'side',
  loop: 'cycle',
  durationMs: 1500,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: rack },
    { t: 0.24, pose: dip, ease: 'in' },
    { t: 0.36, pose: drive, ease: 'out' },
    { t: 0.46, pose: lockout, ease: 'out' },
    { t: 0.6, pose: lockout, ease: 'linear' },
    { t: 0.76, pose: absorb, ease: 'in' },
    { t: 0.9, pose: rack, ease: 'out' },
  ],
};
