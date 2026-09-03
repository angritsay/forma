/**
 * Strict overhead press — side view, one repetition per cycle.
 * Standing tall with the dumbbells at the shoulders (front rack, elbows forward) → press straight
 * up past a mid position with the elbows forward-up and the forearms vertical → full lockout with
 * the biceps by the ears → lower under control. The legs never move.
 */
import { basePose, plant } from '../rig';
import { FRONT_RACK } from './db_front_squat';
import type { Pose, PoseSet } from './types';

const rack: Pose = plant({ ...basePose('side'), ...FRONT_RACK }, 'side', { leg: 'R', x: 100 });

const mid: Pose = { ...rack, shoulderL: 116, shoulderR: 120, elbowL: 60, elbowR: 60 };

const top: Pose = { ...rack, head: -4, shoulderL: 172, shoulderR: 176, elbowL: 4, elbowR: 4 };

export const overhead_press: PoseSet = {
  id: 'overhead_press',
  view: 'side',
  loop: 'cycle',
  durationMs: 2000,
  poster: 0.46,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: rack },
    { t: 0.24, pose: mid, ease: 'in' },
    { t: 0.42, pose: top, ease: 'out' },
    { t: 0.52, pose: top, ease: 'linear' },
    { t: 0.72, pose: mid, ease: 'inOut' },
    { t: 0.9, pose: rack, ease: 'inOut' },
  ],
};
