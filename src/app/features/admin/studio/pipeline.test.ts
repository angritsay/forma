import { describe, expect, it, vi } from 'vitest';
import type { AddMediaClipInput, MediaClip } from '@/lib/api/mediaStudio';
import { fitsRawLimit, rawFingerprint, tusEndpoint } from '@/lib/api/rawUpload';
import { runSegment, type PipelineDeps } from './pipeline';
import { StudioError } from './uploadErrors';

const SRC = '11111111-2222-4333-8444-555555555555';
const SEG = {
  id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  startS: 12.5,
  endS: 30,
  exerciseId: 'planka',
  crop: { x: 0.1, y: 0, w: 0.5, h: 1 },
};

function deps(over: Partial<PipelineDeps> = {}) {
  const calls: string[] = [];
  const registered: AddMediaClipInput[] = [];
  const d: PipelineDeps = {
    durationS: 100,
    keyframeAt: async () => {
      calls.push('keyframe');
      return 10;
    },
    cut: async (_plan, onP) => {
      calls.push('cut');
      onP(1);
      return new Blob([new Uint8Array(1000)], { type: 'video/mp4' });
    },
    upload: async ({ onProgress }) => {
      calls.push('upload');
      onProgress(0.5);
      onProgress(1);
    },
    register: async (input) => {
      calls.push('register');
      registered.push(input);
      return { id: input.id } as MediaClip;
    },
    ...over,
  };
  return { d, calls, registered };
}

describe('runSegment', () => {
  it('cuts from the keyframe, uploads, then registers with the offset', async () => {
    const { d, calls, registered } = deps();
    const progress = vi.fn();
    await runSegment(SEG, SRC, d, progress);
    expect(calls).toEqual(['keyframe', 'cut', 'upload', 'register']);
    expect(registered[0]).toEqual({
      id: SEG.id,
      sourceId: SRC,
      rawPath: `${SRC}/${SEG.id}.mp4`,
      rawOffsetS: 2.5,
      startS: 12.5,
      endS: 30,
      exerciseId: 'planka',
      crop: SEG.crop,
    });
    expect(progress.mock.calls.map((c) => c[0])).toEqual([
      'cutting',
      'cutting',
      'uploading',
      'uploading',
      'uploading',
      'registering',
      'done',
    ]);
  });

  it('passes the cut points to the upload for its fingerprint', async () => {
    const seen: string[] = [];
    const { d } = deps({
      upload: async ({ cut }) => {
        seen.push(cut);
      },
    });
    await runSegment(SEG, SRC, d, () => undefined);
    expect(seen).toEqual(['10-30.5']);
  });

  it('stops before uploading a piece that is too big', async () => {
    const { d, calls } = deps({ sizeLimit: 999 });
    await expect(runSegment(SEG, SRC, d, () => undefined)).rejects.toMatchObject({
      kind: 'too_large',
    });
    expect(calls).toEqual(['keyframe', 'cut']);
  });

  it('refuses a file with no keyframe near the start', async () => {
    const { d, calls } = deps({ keyframeAt: async () => null });
    await expect(runSegment(SEG, SRC, d, () => undefined)).rejects.toBeInstanceOf(StudioError);
    expect(calls).toEqual([]);
  });

  it('does not register a piece whose upload failed', async () => {
    const { d, calls } = deps({
      upload: async () => {
        throw new Error('dropped');
      },
    });
    await expect(runSegment(SEG, SRC, d, () => undefined)).rejects.toThrow('dropped');
    expect(calls).not.toContain('register');
  });
});

describe('raw upload helpers', () => {
  it('builds the resumable endpoint', () => {
    expect(tusEndpoint('https://abc.supabase.co/')).toBe(
      'https://abc.supabase.co/storage/v1/upload/resumable',
    );
  });

  it('checks the bucket limit', () => {
    expect(fitsRawLimit(1, 10)).toBe(true);
    expect(fitsRawLimit(10, 10)).toBe(true);
    expect(fitsRawLimit(11, 10)).toBe(false);
    expect(fitsRawLimit(0, 10)).toBe(false);
  });

  it('fingerprints by object, size and cut', () => {
    const a = rawFingerprint('s/c.mp4', 100, '1-2');
    expect(a).toBe(rawFingerprint('s/c.mp4', 100, '1-2'));
    expect(a).not.toBe(rawFingerprint('s/c.mp4', 101, '1-2'));
    expect(a).not.toBe(rawFingerprint('s/c.mp4', 100, '1-3'));
  });
});
