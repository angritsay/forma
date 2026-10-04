/** «Студия» (0060) over the demo backend: the same rules as the SQL, in memory. */
import { describe, expect, it, vi } from 'vitest';
import { defaultGrade } from '@/lib/media/grade';
import type * as Latency from './latency';

vi.mock('./latency', async (importOriginal) => ({
  ...(await importOriginal<typeof Latency>()),
  delay: () => Promise.resolve(),
}));

class FakeStorage implements Storage {
  private map = new Map<string, string>();
  [name: string]: unknown;
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

globalThis.localStorage = new FakeStorage();

const demo = await import('./index');

const EMAIL = 'coach@example.com';
const SRC = '0b6c1a52-1d8e-4a51-9a3e-2f5b7c9d0e11';
const A = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const B = 'b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

describe('studio in the demo (0060)', () => {
  it('adds, labels, pastes and queues like the server', async () => {
    await demo.requestCode(EMAIL);
    await demo.verifyCode(EMAIL, demo.pendingCode() ?? '');

    expect(await demo.saveMediaSource({ id: SRC, title: 'Съёмка' })).toBe(SRC);
    const piece = { sourceId: SRC, rawOffsetS: 0.2, startS: 0, endS: 10 };
    await demo.addMediaClip({
      ...piece,
      id: A,
      rawPath: `${SRC}/${A}.mp4`,
      exerciseId: 'air_squat',
    });
    await demo.addMediaClip({ ...piece, id: B, rawPath: `${SRC}/${B}.mp4`, startS: 20, endS: 30 });

    const grade = { ...defaultGrade(), exposure: 0.5 };
    await demo.saveMediaClip(A, { grade });
    expect(await demo.pasteMediaSettings([A, B], { grade })).toBe(1);
    expect(await demo.queueMediaClips([A, B])).toBe(1);

    const [a, b] = await demo.listMediaClips(SRC);
    expect(a).toMatchObject({ id: A, status: 'queued', grade });
    expect(b).toMatchObject({ id: B, status: 'draft', grade, exerciseId: null });
    expect((await demo.listMediaSources())[0]).toMatchObject({ id: SRC, clips: 2, queued: 1 });
    expect(await demo.retryMediaClips([A])).toBe(0);
  });
});
