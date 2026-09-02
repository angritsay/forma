/**
 * Arm circles — front view, one circle per cycle.
 * Standing tall with the straight arms out to the sides at shoulder height, drawing circles.
 * Seen from the front a forward circle projects onto the frontal plane as the hands rising and
 * falling around shoulder height (the forward/back component is perpendicular to the view), so
 * the arms sweep ±14° of abduction around horizontal with the trunk perfectly still.
 */
import { basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const level: Pose = {
  ...basePose('front'),
  shoulderL: 90,
  shoulderR: 90,
  elbowL: 0,
  elbowR: 0,
  hipL: 10,
  hipR: 10,
};
const high: Pose = { ...level, shoulderL: 104, shoulderR: 104 };
const low: Pose = { ...level, shoulderL: 76, shoulderR: 76 };

export const arm_circles: PoseSet = {
  id: 'arm_circles',
  view: 'front',
  loop: 'cycle',
  durationMs: 900,
  poster: 0,
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: level, ease: 'linear' },
    { t: 0.25, pose: high, ease: 'out' },
    { t: 0.5, pose: level, ease: 'in' },
    { t: 0.75, pose: low, ease: 'out' },
  ],
};
