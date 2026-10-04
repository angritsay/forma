/**
 * Where a piece is cut out of the long video, given the keyframe at or before its start.
 *
 * A stream copy can only begin on a keyframe: anything after it decodes from it. So the piece
 * starts at the keyframe at or before the marked start, and the worker is told how far into the
 * piece the marked start sits (`raw_offset_s`) — it seeks there exactly when it encodes. The end
 * gets a small pad past the mark, so the frames the encoder needs up to the mark are all inside
 * (with B-frames, a frame shown just before the end can be stored just after it).
 *
 * Pure: the keyframe time comes from the demuxer (`remux.ts`), everything else is arithmetic.
 */
import { MAX_RAW_OFFSET_SECONDS } from '@/lib/api/mediaStudio';

/** Seconds kept after the marked end. The worker trims to the mark exactly. */
export const END_PAD_SECONDS = 0.5;

export interface CutPlan {
  /** Where the copy begins in the source: the keyframe. */
  cutStartS: number;
  /** Where the copy stops in the source: the marked end plus the pad, inside the video. */
  cutEndS: number;
  /** The marked start inside the piece: `startS − cutStartS`. */
  rawOffsetS: number;
}

export type CutPlanProblem = 'no_keyframe' | 'keyframe_too_far';

const round3 = (v: number): number => Math.round(v * 1000) / 1000;

/**
 * The plan for one segment. `keyframeS` is the demuxer's answer for «the last keyframe at or
 * before `startS`» (null when there is none, which a broken or truncated file can give).
 *
 * A keyframe further back than the server accepts ({@link MAX_RAW_OFFSET_SECONDS}) is refused
 * rather than uploaded: that is a file with almost no keyframes (a screen recording, some action
 * cameras), and the piece would be mostly footage nobody asked for.
 */
export function planCut(input: {
  startS: number;
  endS: number;
  keyframeS: number | null;
  durationS: number | null;
}): { plan: CutPlan } | { problem: CutPlanProblem } {
  const { startS, endS, keyframeS, durationS } = input;
  if (keyframeS === null || !Number.isFinite(keyframeS)) return { problem: 'no_keyframe' };
  // A keyframe «after» the start is a rounding hair of the demuxer; it is the start.
  const key = Math.min(Math.max(0, keyframeS), startS);
  const offset = round3(startS - key);
  if (offset > MAX_RAW_OFFSET_SECONDS) return { problem: 'keyframe_too_far' };
  const limit =
    durationS !== null && Number.isFinite(durationS) && durationS > 0 ? durationS : null;
  const end = endS + END_PAD_SECONDS;
  return {
    plan: {
      cutStartS: key,
      cutEndS: round3(limit === null ? end : Math.min(limit, end)),
      rawOffsetS: offset,
    },
  };
}
