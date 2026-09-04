/**
 * Sumo deadlift high pull — side view, one repetition per cycle.
 * Deep wide-stance start over the bell on the floor between the feet (torso ~45° forward, knees
 * ~92°, arms straight) → legs and hips extend, the bell rising on straight arms → once the hips
 * are open the elbows drive up and out and the bell finishes just under the chin → lower along
 * the same path, arms first, then hips.
 *
 * The bell hangs straight down from the hands (`hang`), so at the top it sits under the chin
 * and at the bottom on the floor. The pull-top arms are solved by IK: hands 8 in front and 12
 * above the shoulder joint with the elbows high and forward (elbow 147°).
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 45;

const floor: Pose = plant(
  {
    ...basePose('side'),
    torso: T,
    head: -32,
    shoulderL: T,
    shoulderR: T,
    elbowL: 0,
    elbowR: 0,
    hipL: 108.3,
    hipR: 108.3,
    kneeL: 91.8,
    kneeR: 91.8,
    ankleL: 28.5,
    ankleR: 28.5,
  },
  'side',
  { leg: 'R', x: 100 },
);

const stand: Pose = plant(
  { ...basePose('side'), shoulderL: 4, shoulderR: 4, elbowL: 0, elbowR: 0 },
  'side',
  { leg: 'R', x: 100 },
);

const top: Pose = { ...stand, shoulderL: 78, shoulderR: 80.6, elbowL: 146, elbowR: 146.8 };

export const sumo_high_pull: PoseSet = {
  id: 'sumo_high_pull',
  view: 'side',
  loop: 'cycle',
  durationMs: 1400,
  pivot: 'ankleR',
  poster: 0.44,
  props: [{ kind: 'floor' }, { kind: 'kettlebell', grip: 'hang' }],
  keyframes: [
    { t: 0, pose: floor },
    { t: 0.3, pose: stand, ease: 'in' },
    { t: 0.44, pose: top, ease: 'out' },
    { t: 0.54, pose: top, ease: 'linear' },
    { t: 0.7, pose: stand, ease: 'inOut' },
    { t: 0.94, pose: floor, ease: 'inOut' },
  ],
};
