import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * The player's clips are behind signed URLs. They used to be signed one at a time, as each step
 * arrived, and forgotten on reload — a round trip in front of every movement. These pin down the
 * cache that replaced that: one request for the whole session, answers kept until shortly before
 * they expire, and kept across a reload of the tab.
 */

const createSignedUrls = vi.fn();
const createSignedUrl = vi.fn();

vi.mock('./client', () => ({
  isConfigured: () => true,
  projectUrl: () => 'https://project.example',
  supabase: () => ({
    storage: { from: () => ({ createSignedUrls, createSignedUrl }) },
  }),
}));
vi.mock('./mode', () => ({ isDemo: () => false }));

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const SQUAT = 'storage:videos/shared/air_squat.ru.mp4';
const PUSH = 'storage:videos/shared/push_up.ru.mp4';

/** A fresh copy of the module, so its in-memory cache starts empty the way a reload's does. */
async function load() {
  vi.resetModules();
  return import('./storage');
}

beforeEach(() => {
  vi.stubGlobal('sessionStorage', new MemoryStorage());
  createSignedUrls.mockReset();
  createSignedUrl.mockReset();
  createSignedUrls.mockImplementation(async (paths: string[]) => ({
    data: paths.map((path) => ({ path, signedUrl: `https://signed/${path}?t=1`, error: null })),
    error: null,
  }));
  createSignedUrl.mockImplementation(async (path: string) => ({
    data: { signedUrl: `https://single/${path}` },
    error: null,
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('signMediaUrls', () => {
  it('signs a whole session in one request, and the player finds every URL already there', async () => {
    const s = await load();
    await s.signMediaUrls([SQUAT, PUSH, SQUAT, undefined]);
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls.mock.calls[0]?.[0]).toEqual([
      'shared/air_squat.ru.mp4',
      'shared/push_up.ru.mp4',
    ]);
    expect(s.cachedMediaUrl(SQUAT)).toBe('https://signed/shared/air_squat.ru.mp4?t=1');
    expect(await s.resolveMediaUrl(PUSH)).toBe('https://signed/shared/push_up.ru.mp4?t=1');
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it('does not sign again what it already holds', async () => {
    const s = await load();
    await s.signMediaUrls([SQUAT]);
    await s.signMediaUrls([SQUAT]);
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
  });

  it('lets a clip the batch missed be signed on its own when it is reached', async () => {
    createSignedUrls.mockImplementation(async (paths: string[]) => ({
      data: paths.map((path) => ({ path, signedUrl: '', error: 'Object not found' })),
      error: null,
    }));
    const s = await load();
    await s.signMediaUrls([SQUAT]);
    expect(s.cachedMediaUrl(SQUAT)).toBeUndefined();
    expect(await s.resolveMediaUrl(SQUAT)).toBe('https://single/shared/air_squat.ru.mp4');
  });
});

describe('the signed-URL cache', () => {
  it('re-signs a URL that is about to expire rather than hand it to a video', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T10:00:00Z'));
    const s = await load();
    await s.signMediaUrls([SQUAT]);
    // 56 minutes on: inside the five-minute margin before the hour runs out.
    vi.setSystemTime(new Date('2026-09-23T10:56:00Z'));
    expect(s.cachedMediaUrl(SQUAT)).toBeUndefined();
    expect(await s.resolveMediaUrl(SQUAT)).toBe('https://single/shared/air_squat.ru.mp4');
  });

  it('survives a reload of the tab, and is gone after sign-out', async () => {
    const first = await load();
    await first.signMediaUrls([SQUAT]);
    const reloaded = await load();
    expect(reloaded.cachedMediaUrl(SQUAT)).toBe('https://signed/shared/air_squat.ru.mp4?t=1');
    reloaded.clearMediaUrlCache();
    const afterSignOut = await load();
    expect(afterSignOut.cachedMediaUrl(SQUAT)).toBeUndefined();
  });

  it('answers public images and plain addresses without asking anybody', async () => {
    const s = await load();
    expect(s.cachedMediaUrl('storage:images/exercises/air_squat.jpg')).toBe(
      'https://project.example/storage/v1/object/public/images/exercises/air_squat.jpg',
    );
    expect(s.cachedMediaUrl('https://cdn.example/a.mp4')).toBe('https://cdn.example/a.mp4');
    expect(s.cachedMediaUrl(undefined)).toBeUndefined();
  });
});
