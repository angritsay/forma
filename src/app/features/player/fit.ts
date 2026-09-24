/**
 * The playback rate for a clip in `fit` mode (see `VideoModeSchema`): the clip is stretched over
 * the step rather than looped.
 *
 * A yoga hold is entered once. The coach's clip of entering the pose is ten seconds; the hold is
 * sixty. Looped, the person on screen would sink into the pose six times while the athlete holds
 * it once, so instead the clip is **slowed to fill the step** and then stands on its last frame.
 *
 * Two limits, both deliberate:
 *
 * * **Never sped up.** A clip longer than the step plays at 1× and is simply cut by the next step
 *   — a demonstration that rushes to keep up with the clock stops being a demonstration.
 * * **No slower than 0.5×.** Safari and iOS silently ignore `playbackRate` below 0.5 (and above
 *   some large value), so a rate under it would not slow the clip at all — it would play at 1× and
 *   then loop or freeze early, which is worse than a clip that is a little short of the step.
 */
export const MIN_FIT_RATE = 0.5;

export function fitRate(clipSec: number, stepSec: number): number {
  if (!Number.isFinite(clipSec) || clipSec <= 0) return 1;
  if (!Number.isFinite(stepSec) || stepSec <= 0) return 1;
  return Math.min(1, Math.max(MIN_FIT_RATE, clipSec / stepSec));
}
