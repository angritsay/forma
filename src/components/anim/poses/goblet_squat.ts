/**
 * Goblet squat — side view, one repetition per cycle.
 * Standing tall with the kettlebell held by the horns against the chest (elbows tucked to the
 * ribs, the bell hanging under the hands) → hips back and down into a deep squat, torso ~24°
 * forward, knees over the toes, elbows travelling between the knees → drive back up, short pause
 * standing tall.
 *
 * Geometry: hands 11 in front and 9 below the shoulder (upper arm 15° behind the torso, elbow
 * 147°) so the bell body hangs at the sternum. Bottom: thigh 78° forward, shin 32° forward, flat
 * feet (ankle = knee − hip + torso). The arms keep their angles relative to the torso, so the bell
 * stays glued to the chest through the squat.
 */
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const T = 24;

const top: Pose = plant(
  { ...basePose('side'), shoulderL: -17, shoulderR: -15, elbowL: 147, elbowR: 147 },
  'side',
  { leg: 'R', x: 100 },
);

const bottom: Pose = plant(
  {
    ...top,
    torso: T,
    head: -17,
    hipL: 102,
    hipR: 102,
    kneeL: 110,
    kneeR: 110,
    ankleL: 110 - 102 + T,
    ankleR: 110 - 102 + T,
  },
  'side',
  { leg: 'R', x: 100 },
);

export const goblet_squat: PoseSet = {
  id: 'goblet_squat',
  view: 'side',
  loop: 'cycle',
  durationMs: 2400,
  pivot: 'ankleR',
  poster: 0.5,
  props: [{ kind: 'floor' }, { kind: 'kettlebell', grip: 'hang' }],
  keyframes: [
    { t: 0, pose: top },
    { t: 0.5, pose: bottom, ease: 'inOut' },
    { t: 0.88, pose: top, ease: 'inOut' },
  ],
};
