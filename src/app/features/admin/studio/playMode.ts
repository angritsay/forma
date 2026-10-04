/**
 * What a clip's play mode (0061) means on the studio's screens: the still frame chosen by default,
 * and how the «Превью» step plays the clip so it behaves the way the player will.
 *
 * The exercise's `video_mode` the worker sets from it is `videoModeForPlayMode`
 * (`src/lib/api/mediaStudio.ts`).
 */
import type { PlayMode } from '@/lib/api/mediaStudio';

/** The worker's own default still position (STILL_AT in render-clips.mjs), 45% into the clip. */
export const STILL_DEFAULT_AT = 0.45;

/** The still frame a clip gets when «Стоп-кадр» is chosen and none was picked yet, seconds. */
export function stillDefault(durationS: number): number {
  const d = Number.isFinite(durationS) && durationS > 0 ? durationS : 0;
  return Math.round(d * STILL_DEFAULT_AT * 1000) / 1000;
}

/**
 * How the preview plays a clip: `loop` round and round; `once` to the end and held there (what
 * `fit` does in the player, without the slow-down, which depends on the step's length); `hold` on
 * one frame, not playing at all.
 */
export type PreviewPlayback = 'loop' | 'once' | 'hold';

export function previewPlayback(mode: PlayMode): PreviewPlayback {
  return mode === 'still' ? 'hold' : mode;
}
