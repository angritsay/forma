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

  const blob = await deps.cut(plan, (f) => onProgress('cutting', f), signal);
  if (blob.size > (deps.sizeLimit ?? RAW_FILE_SIZE_LIMIT)) throw new StudioError('too_large');

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
  const clip = await deps.register({
    id: seg.id,
    sourceId,
    rawPath: path,
    rawOffsetS: plan.rawOffsetS,
    startS: seg.startS,
    endS: seg.endS,
    exerciseId: seg.exerciseId,
    crop: seg.crop,
  });
  onProgress('done', 1);
  return clip;
}
