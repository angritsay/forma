/**
 * Band pull-apart — front view, pingpong (0 = band at the chest, 1 = pulled apart).
 * Standing tall holding a band at shoulder height → straight arms open to a T, stretching the
 * band across the chest as the shoulder blades squeeze → return under control.
 *
 * The rig cannot foreshorten arms pointing at the viewer, so the start position (arms forward)
 * is drawn with the elbows folded and the hands just outside the shoulders at chest height; the
 * band (wrist-to-wrist prop) stays at shoulder level throughout.
 */
import { basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const closed: Pose = {
  ...basePose('front'),
  shoulderL: 28,
  shoulderR: 28,
  elbowL: 135,
  elbowR: 135,
  hipL: 10,
  hipR: 10,
};

const open: Pose = { ...closed, shoulderL: 92, shoulderR: 92, elbowL: 0, elbowR: 0 };

export const band_pull_apart: PoseSet = {
  id: 'band_pull_apart',
  view: 'front',
  loop: 'pingpong',
  durationMs: 1600,
  poster: 1,
  props: [{ kind: 'floor' }, { kind: 'band', anchor: 'wrists' }],
  keyframes: [
    { t: 0, pose: closed },
    { t: 1, pose: open, ease: 'inOut' },
  ],
};
