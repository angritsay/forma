/**
 * Reading the long video and cutting pieces out of it, on the device, without re-encoding.
 *
 * mediabunny reads the picked `File` with random access (nothing is loaded whole), answers its
 * length, frame rate and keyframes, and copies the packets of one span into a new MP4 — a stream
 * copy, so a phone does it in seconds and the picture is untouched. The span starts on the
 * keyframe at or before the start mark (see `cutPlan.ts`); the worker trims to the marks exactly.
 *
 * The audio is dropped: the clips are silent in the app, and leaving it out keeps the piece
 * smaller and its edges free of audio-packet boundaries.
 *
 * The library is loaded on first use, so only the studio's chunk pays for it.
 */
import type * as MediabunnyModule from 'mediabunny';
import { safeFps } from './timeline';
import { StudioError } from './uploadErrors';
import type { CutPlan } from './cutPlan';

type Mediabunny = typeof MediabunnyModule;
type MbInput = InstanceType<Mediabunny['Input']>;
type MbVideoTrack = NonNullable<Awaited<ReturnType<MbInput['getPrimaryVideoTrack']>>>;

export interface SourceInfo {
  durationS: number;
  fps: number;
  /** As displayed (after the rotation flag). */
  width: number;
  height: number;
  codec: string | null;
}

export interface SourceReader {
  info: SourceInfo;
  /** The time of the last keyframe at or before `t`, or null when there is none. */
  keyframeAt(t: number): Promise<number | null>;
  /** Copy the plan's span into an MP4. `onProgress` gets 0…1. */
  cut(plan: CutPlan, onProgress?: (fraction: number) => void, signal?: AbortSignal): Promise<Blob>;
  dispose(): void;
}

let loading: Promise<Mediabunny> | null = null;

/** The library, loaded once. A failed load is not kept, so a retry with signal back works. */
function mediabunny(): Promise<Mediabunny> {
  loading ??= import('mediabunny').catch((e: unknown) => {
    loading = null;
    throw e;
  });
  return loading;
}

/** Open a picked file. Throws `StudioError('unsupported')` when it is not a readable video. */
export async function openSource(file: File): Promise<SourceReader> {
  let mb: Mediabunny;
  try {
    mb = await mediabunny();
  } catch {
    throw new StudioError('offline', 'module_load');
  }
  const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(file) });
  let track: MbVideoTrack | null;
  let info: SourceInfo;
  try {
    if (!(await input.canRead())) throw new StudioError('unsupported');
    track = await input.getPrimaryVideoTrack();
    if (!track) throw new StudioError('unsupported', 'no_video');
    const [durationS, stats, width, height, codec] = await Promise.all([
      input.computeDuration([track]),
      track.computePacketStats(120).catch(() => null),
      track.getDisplayWidth(),
      track.getDisplayHeight(),
      Promise.resolve(track.codec ?? null),
    ]);
    if (!Number.isFinite(durationS) || durationS <= 0) throw new StudioError('unsupported');
    info = {
      durationS,
      fps: safeFps(stats?.averagePacketRate),
      width,
      height,
      codec,
    };
  } catch (e) {
    input.dispose();
    if (e instanceof StudioError) throw e;
    throw new StudioError('unsupported', 'probe_failed');
  }

  const video = track;
  const packets = new mb.EncodedPacketSink(video);

  return {
    info,
    async keyframeAt(t) {
      try {
        const p = await packets.getKeyPacket(t, { verifyKeyPackets: true });
        return p ? p.timestamp : null;
      } catch {
        return null;
      }
    },
    async cut(plan, onProgress, signal) {
      const output = new mb.Output({
        // The index at the end: everything before it is the same on every cut of the same marks,
        // which is what lets an interrupted upload resume after a reload (see rawUpload.ts).
        format: new mb.Mp4OutputFormat({ fastStart: false }),
        target: new mb.BufferTarget(),
      });
      let conversion: Awaited<ReturnType<Mediabunny['Conversion']['init']>>;
      try {
        conversion = await mb.Conversion.init({
          input,
          output,
          tracks: 'primary',
          audio: { discard: true },
          trim: { start: plan.cutStartS, end: plan.cutEndS },
          // Copy or nothing: a phone re-encoding 4K would take minutes and change the picture.
          copy: { mode: 'forced', boundaryPolicy: 'expand' },
          showWarnings: false,
        });
      } catch {
        throw new StudioError('remux', 'init_failed');
      }
      if (!conversion.isValid || !conversion.utilizedTracks.some((t) => t.isVideoTrack())) {
        throw new StudioError('remux', 'not_copyable');
      }
      if (onProgress) conversion.onProgress = (p) => onProgress(Math.max(0, Math.min(1, p)));
      const onAbort = () => void conversion.cancel();
      signal?.addEventListener('abort', onAbort, { once: true });
      try {
        await conversion.execute();
      } catch (e) {
        if (signal?.aborted) throw e;
        throw new StudioError('remux', 'execute_failed');
      } finally {
        signal?.removeEventListener('abort', onAbort);
      }
      const buffer = output.target.buffer;
      if (!buffer || buffer.byteLength === 0) throw new StudioError('remux', 'empty');
      return new Blob([buffer], { type: 'video/mp4' });
    },
    dispose() {
      input.dispose();
    },
  };
}
