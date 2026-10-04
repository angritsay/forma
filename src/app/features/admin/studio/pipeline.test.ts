import { describe, expect, it, vi } from 'vitest';
import type { AddMediaClipInput, MediaClip } from '@/lib/api/mediaStudio';
import { fitsRawLimit, rawFingerprint, tusEndpoint } from '@/lib/api/rawUpload';
import { estimatePieceBytes, runSegment, type PipelineDeps } from './pipeline';
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

  it('refuses a piece plainly over the limit before cutting it into memory', async () => {
    // 20.5 s of a 100 s, 10 000-byte file ≈ 2 050 bytes against a 1 000-byte ceiling.
    const { d, calls } = deps({ sizeLimit: 1000, sourceBytes: 10_000 });
    await expect(runSegment(SEG, SRC, d, () => undefined)).rejects.toMatchObject({
      kind: 'too_large',
    });
    expect(calls).toEqual(['keyframe']);
  });

  it('cuts and measures a piece whose estimate is only near the limit', async () => {
    // ≈ 1 025 bytes estimated against 1 000: inside the margin, so it is cut; the real piece fits.
    const { d, calls } = deps({ sizeLimit: 1000, sourceBytes: 5_000 });
    await runSegment(SEG, SRC, d, () => undefined);
    expect(calls).toEqual(['keyframe', 'cut', 'upload', 'register']);
  });

  it('registers the label and frame the piece has when its upload ends', async () => {
    const crop = { x: 0, y: 0, w: 0.5, h: 0.5 };
    const { d, registered } = deps({ latest: () => ({ exerciseId: 'vypad', crop }) });
    await runSegment(SEG, SRC, d, () => undefined);
    expect(registered[0]).toMatchObject({ exerciseId: 'vypad', crop });
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

describe('estimatePieceBytes', () => {
  it("is the span's share of the file", () => {
    expect(estimatePieceBytes(1000, 100, 10)).toBe(100);
    expect(estimatePieceBytes(1000, 100, 500)).toBe(1000);
  });

  it('is unknown without a size or a duration', () => {
    expect(estimatePieceBytes(undefined, 100, 10)).toBeNull();
    expect(estimatePieceBytes(1000, null, 10)).toBeNull();
    expect(estimatePieceBytes(1000, 0, 10)).toBeNull();
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
