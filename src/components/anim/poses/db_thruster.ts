/**
 * Dumbbell thruster — side view, one repetition per cycle.
 * Front rack standing → deep front squat (torso ~22°, elbows forward) → drive up and, without a
 * pause, press the dumbbells overhead to a full lockout → lower back to the shoulders and sink
 * straight into the next squat.
 *
 * Geometry: the rack and squat reuse the front-squat numbers; the press passes a mid position
 * with the upper arm 120° forward and the forearm vertical, then locks out with the wrists
 * straight above the shoulders (dumbbells above the head, y ≈ 12).
 */
import { basePose, plant } from '../rig';
import { FRONT_RACK } from './db_front_squat';
import type { Pose, PoseSet } from './types';

const T = 22;

const rack: Pose = plant({ ...basePose('side'), ...FRONT_RACK }, 'side', { leg: 'R', x: 100 });

const bottom: Pose = plant(
  {
    ...rack,
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

// Standing with the dumbbells halfway up: elbows forward-up, forearms vertical.
const drive: Pose = { ...rack, shoulderL: 116, shoulderR: 120, elbowL: 60, elbowR: 60 };

const lockout: Pose = { ...rack, head: -4, shoulderL: 172, shoulderR: 176, elbowL: 4, elbowR: 4 };

export const db_thruster: PoseSet = {
  id: 'db_thruster',
  view: 'side',
  loop: 'cycle',
  durationMs: 1900,
  pivot: 'ankleR',
  poster: 0.62,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: rack },
    { t: 0.34, pose: bottom, ease: 'inOut' },
    { t: 0.5, pose: drive, ease: 'out' },
    { t: 0.62, pose: lockout, ease: 'out' },
    { t: 0.7, pose: lockout, ease: 'linear' },
    { t: 0.88, pose: rack, ease: 'inOut' },
  ],
};
