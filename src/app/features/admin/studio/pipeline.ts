/**
 * One segment's way to the server: find the keyframe, cut the piece, check its size, upload it,
 * register the clip. The steps are injected so the order and the failure rules are tested with
 * fakes; the screen passes the real reader (`remux.ts`), uploader (`rawUpload.ts`) and API call.
 */
import { RAW_FILE_SIZE_LIMIT, rawClipPath, type AddMediaClipInput } from '@/lib/api/mediaStudio';
import type { MediaClip } from '@/lib/api/mediaStudio';
import { planCut, type CutPlan } from './cutPlan';
import { PIECE_EXT } from './cutDraft';
import type { Segment, SegmentUploadState } from './timeline';
import { StudioError } from './uploadErrors';

export interface PipelineDeps {
  durationS: number | null;
  keyframeAt(t: number): Promise<number | null>;
  cut(plan: CutPlan, onProgress: (f: number) => void, signal?: AbortSignal): Promise<Blob>;
  upload(input: {
    path: string;
    blob: Blob;
    cut: string;
    onProgress: (f: number) => void;
    signal?: AbortSignal;
  }): Promise<void>;
  register(input: AddMediaClipInput): Promise<MediaClip>;
  /** The per-file ceiling to check before uploading. */
  sizeLimit?: number;
  /**
   * The whole video's size, bytes. With it, a piece whose share of the file is plainly over the
   * ceiling is refused before it is cut: the cut is held in memory, and a phone asked to hold a
   * 1.5 GB piece is closed by the system instead of answering «too large».
   */
  sourceBytes?: number;
  /**
   * The piece's label and frame as they are now. She may relabel or reframe a piece while it
   * uploads; the clip is registered with what the screen shows at that moment, not with what it
   * showed when the piece started.
   */
  latest?(id: string): Pick<Segment, 'exerciseId' | 'crop'> | null;
}

/**
 * How far over the ceiling the proportional estimate must be before the piece is refused uncut.
 * A phone's bitrate swings with the scene, so a piece near the line is cut and measured instead.
 */
export const ESTIMATE_MARGIN = 1.25;

/** The bytes a span is expected to take: its share of the whole file. Null when unknown. */
export function estimatePieceBytes(
  sourceBytes: number | undefined,
  durationS: number | null,
  spanS: number,
): number | null {
  if (!sourceBytes || !durationS || !(durationS > 0) || !(spanS > 0)) return null;
  return (sourceBytes * Math.min(spanS, durationS)) / durationS;
}

export type PipelineProgress = (state: SegmentUploadState, progress: number) => void;

/**
 * Run one segment through. Resolves with the registered clip; throws a `StudioError` (or whatever
 * the injected steps throw) on failure, leaving the classification to `classifyUploadError`.
 */
export async function runSegment(
  seg: Pick<Segment, 'id' | 'startS' | 'endS' | 'exerciseId' | 'crop'>,
  sourceId: string,
  deps: PipelineDeps,
  onProgress: PipelineProgress,
  signal?: AbortSignal,
): Promise<MediaClip> {
  onProgress('cutting', 0);
  const keyframeS = await deps.keyframeAt(seg.startS);
  const planned = planCut({
    startS: seg.startS,
    endS: seg.endS,
    keyframeS,
    durationS: deps.durationS,
  });
  if ('problem' in planned) throw new StudioError('keyframe', planned.problem);
  const { plan } = planned;
  const limit = deps.sizeLimit ?? RAW_FILE_SIZE_LIMIT;
  const estimate = estimatePieceBytes(
    deps.sourceBytes,
    deps.durationS,
    plan.cutEndS - plan.cutStartS,
  );
  if (estimate !== null && estimate > limit * ESTIMATE_MARGIN) {
    throw new StudioError('too_large', 'estimate');
  }

  const blob = await deps.cut(plan, (f) => onProgress('cutting', f), signal);
  if (blob.size > limit) throw new StudioError('too_large');

  const path = rawClipPath(sourceId, seg.id, PIECE_EXT);
  onProgress('uploading', 0);
  await deps.upload({
    path,
    blob,
    cut: `${plan.cutStartS}-${plan.cutEndS}`,
    onProgress: (f) => onProgress('uploading', f),
    signal,
  });

  onProgress('registering', 1);
  const now = deps.latest?.(seg.id) ?? seg;
  const clip = await deps.register({
    id: seg.id,
    sourceId,
    rawPath: path,
    rawOffsetS: plan.rawOffsetS,
    startS: seg.startS,
    endS: seg.endS,
    exerciseId: now.exerciseId,
    crop: now.crop,
  });
  onProgress('done', 1);
  return clip;
}
