/**
 * Kettlebell halo — front view, one full circle around the head per cycle.
 * Both hands hold the bell by the horns and walk it around the head: right ear → overhead →
 * left ear → back down in front of the chest. Seen from the front, the front/back part of the
 * circle is perpendicular to the view, so the movement reads as the bell orbiting the head while
 * the trunk stays still — the halo is a shoulder mobility drill, not a trunk movement.
 *
 * The arms are deliberately asymmetric: the far arm reaches across the head while the near arm
 * opens out, which is what keeps the bell outside the head silhouette in every frame. The bell
 * continues the forearm line (`inline`), so it points away from the body rather than hanging onto
 * the head.
 */
import { basePose } from '../rig';
import type { Pose, PoseSet } from './types';

const stance: Pose = { ...basePose('front'), hipL: 9, hipR: 9 };

/** Bell out at the right ear: right arm opens out, left arm reaches across the head. */
const right: Pose = {
  ...stance,
  shoulderL: 128,
  elbowL: 116,
  shoulderR: 72,
  elbowR: 128,
  head: 5,
};

/** Bell overhead: both arms high, elbows softly bent, bell projecting up and away. */
const overhead: Pose = {
  ...stance,
  shoulderL: 150,
  elbowL: 96,
  shoulderR: 150,
  elbowR: 96,
  head: 0,
};

/** Bell out at the left ear: mirror of `right`. */
const left: Pose = {
  ...stance,
  shoulderL: 72,
  elbowL: 128,
  shoulderR: 128,
  elbowR: 116,
  head: -5,
};

/** Bell back down in front of the chest, elbows tucked — the start of the next circle. */
const chest: Pose = {
  ...stance,
  shoulderL: 34,
  elbowL: 122,
  shoulderR: 34,
  elbowR: 122,
  head: 0,
};

export const kb_halo: PoseSet = {
  id: 'kb_halo',
  view: 'front',
  loop: 'cycle',
  durationMs: 2400,
  poster: 0.25,
  props: [{ kind: 'floor' }, { kind: 'kettlebell', grip: 'inline' }],
  keyframes: [
    { t: 0, pose: chest, ease: 'linear' },
    { t: 0.25, pose: right, ease: 'linear' },
    { t: 0.5, pose: overhead, ease: 'linear' },
    { t: 0.75, pose: left, ease: 'linear' },
  ],
};
