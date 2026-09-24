/**
 * The device's copy of the explanation counts: merged with the server by the larger count, the
 * only answer when the server fails or is slow, bumped at once on a view.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrescribedWorkout } from '@/lib/training/types';

const listMyIntroViews = vi.fn<() => Promise<Record<string, number>>>();
const markIntroSeen = vi.fn<(id: string) => Promise<number>>();
vi.mock('@/lib/api/introViews', () => ({
  listMyIntroViews: () => listMyIntroViews(),
  markIntroSeen: (id: string) => markIntroSeen(id),
}));

const introTiersFor = vi.fn((_p: PrescribedWorkout, views: Record<string, number>) =>
  Object.fromEntries(Object.entries(views).map(([id]) => [id, 'brief' as const])),
);
vi.mock('@/lib/training/intro', () => ({
  introTiersFor: (p: PrescribedWorkout, v: Record<string, number>) => introTiersFor(p, v),
}));

class FakeStorage {
  map = new Map<string, string>();
  broken = false;
  getItem(k: string): string | null {
    if (this.broken) throw new Error('blocked');
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.broken) throw new Error('blocked');
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
}

let storage: FakeStorage;
const mod = await import('./introViews');

beforeEach(() => {
  storage = new FakeStorage();
  vi.stubGlobal('localStorage', storage);
  listMyIntroViews.mockReset();
  markIntroSeen.mockReset();
  markIntroSeen.mockResolvedValue(1);
  introTiersFor.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const mirror = () => JSON.parse(storage.map.get(mod.INTRO_VIEWS_KEY) ?? '{}') as unknown;

describe('loadIntroViews', () => {
  it('merges the server into the copy by the larger count and writes it back', async () => {
    storage.map.set(mod.INTRO_VIEWS_KEY, JSON.stringify({ a: 2, b: 1 }));
    listMyIntroViews.mockResolvedValue({ a: 1, b: 3, c: 1 });
    expect(await mod.loadIntroViews()).toEqual({ a: 2, b: 3, c: 1 });
    expect(mirror()).toEqual({ a: 2, b: 3, c: 1 });
  });

  it('answers from the copy when the server fails', async () => {
    storage.map.set(mod.INTRO_VIEWS_KEY, JSON.stringify({ a: 2 }));
    listMyIntroViews.mockRejectedValue(new Error('offline'));
    expect(await mod.loadIntroViews()).toEqual({ a: 2 });
  });

  it('survives blocked storage and a corrupt copy', async () => {
    storage.map.set(mod.INTRO_VIEWS_KEY, '{not json');
    listMyIntroViews.mockResolvedValue({ a: 1 });
    expect(await mod.loadIntroViews()).toEqual({ a: 1 });
    storage.broken = true;
    expect(await mod.loadIntroViews()).toEqual({ a: 1 });
    listMyIntroViews.mockRejectedValue(new Error('offline'));
    expect(await mod.loadIntroViews()).toEqual({});
  });
});

describe('bumpIntroViews', () => {
  it('counts on the device at once and tells the server, ignoring its failure', async () => {
    storage.map.set(mod.INTRO_VIEWS_KEY, JSON.stringify({ a: 1 }));
    markIntroSeen.mockRejectedValue(new Error('offline'));
    mod.bumpIntroViews('a');
    mod.bumpIntroViews('b');
    expect(mirror()).toEqual({ a: 2, b: 1 });
    expect(markIntroSeen.mock.calls.map((c) => c[0])).toEqual(['a', 'b']);
    await Promise.resolve();
  });

  it('never throws with storage blocked', () => {
    storage.broken = true;
    expect(() => mod.bumpIntroViews('a')).not.toThrow();
    expect(markIntroSeen).toHaveBeenCalledWith('a');
  });
});

describe('withIntros', () => {
  const p = { workoutId: 'w', blocks: [] } as unknown as PrescribedWorkout;

  it('writes the tiers for the merged counts onto the prescription', async () => {
    listMyIntroViews.mockResolvedValue({ a: 1 });
    const out = await mod.withIntros(p);
    expect(out).toEqual({ ...p, intros: { a: 'brief' } });
    expect(p).not.toHaveProperty('intros');
  });

  it('does not wait on a slow server past the bound: the copy decides', async () => {
    vi.useFakeTimers();
    storage.map.set(mod.INTRO_VIEWS_KEY, JSON.stringify({ local: 1 }));
    listMyIntroViews.mockReturnValue(new Promise(() => undefined));
    const pending = mod.withIntros(p, 1500);
    await vi.advanceTimersByTimeAsync(1500);
    expect(await pending).toEqual({ ...p, intros: { local: 'brief' } });
  });
});
