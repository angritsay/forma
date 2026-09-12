/**
 * The session outliving a Telegram launch is the whole point, so the two cases that decide it are
 * tested against a fake CloudStorage: a session too long for one entry, and localStorage coming
 * back empty the way it does on a fresh webview.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** A stand-in for Telegram's callback-based, 4096-character-capped per-user store. */
class FakeCloud {
  readonly map = new Map<string, string>();
  setItem(key: string, value: string, cb?: (err: string | null, ok?: boolean) => void): void {
    if (value.length > 4096) {
      cb?.('VALUE_TOO_LONG');
      return;
    }
    this.map.set(key, value);
    cb?.(null, true);
  }
  getItem(key: string, cb: (err: string | null, value?: string) => void): void {
    cb(null, this.map.get(key) ?? '');
  }
  removeItem(key: string, cb?: (err: string | null, ok?: boolean) => void): void {
    this.map.delete(key);
    cb?.(null, true);
  }
  getKeys(cb: (err: string | null, keys?: string[]) => void): void {
    cb(null, [...this.map.keys()]);
  }
}

class FakeLocal implements Storage {
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
  key(i: number): string | null {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const cloud = new FakeCloud();
const local = new FakeLocal();
let inTelegram = true;

vi.mock('@/lib/telegram/webapp', () => ({
  telegram: () => (inTelegram ? { CloudStorage: cloud } : null),
}));

const { sessionStorageAdapter, __test } = await import('./sessionStorage');

const KEY = 'forma.auth';
/** Longer than one CloudStorage entry, the way a real session with a long JWT is. */
const LONG = JSON.stringify({ access_token: 'a'.repeat(9000), refresh_token: 'r'.repeat(60) });

/** setItem does not await the round trip on purpose; the test does. */
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  cloud.map.clear();
  local.clear();
  inTelegram = true;
  globalThis.localStorage = local;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('inside Telegram', () => {
  it('survives the webview losing its storage', async () => {
    const store = sessionStorageAdapter();
    store.setItem(KEY, LONG);
    await settle();

    // What Telegram does between launches, and what started all this.
    local.clear();

    expect(await store.getItem(KEY)).toBe(LONG);
  });

  it('splits a session too long for one entry, and puts it back together', async () => {
    const store = sessionStorageAdapter();
    store.setItem(KEY, LONG);
    await settle();

    const head = cloud.map.get(__test.safeKey(KEY));
    expect(head).toBe(`${__test.CHUNK_PREFIX}${Math.ceil(LONG.length / __test.CHUNK)}`);
    // Nothing written is over Telegram's cap — FakeCloud refuses those outright.
    for (const value of cloud.map.values()) expect(value.length).toBeLessThanOrEqual(4096);

    local.clear();
    expect(await store.getItem(KEY)).toBe(LONG);
  });

  it('reads a short session back without chunking it', async () => {
    const store = sessionStorageAdapter();
    store.setItem(KEY, 'small');
    await settle();
    expect(cloud.map.get(__test.safeKey(KEY))).toBe('small');
    local.clear();
    expect(await store.getItem(KEY)).toBe('small');
  });

  it('treats a half-evicted session as no session, never as broken JSON', async () => {
    const store = sessionStorageAdapter();
    store.setItem(KEY, LONG);
    await settle();
    cloud.map.delete(`${__test.safeKey(KEY)}_1`);
    local.clear();
    expect(await store.getItem(KEY)).toBeNull();
  });

  it('signing out clears the cloud copy too, chunks and all', async () => {
    const store = sessionStorageAdapter();
    store.setItem(KEY, LONG);
    await settle();
    store.removeItem(KEY);
    await settle();
    expect(cloud.map.size).toBe(0);
    expect(await store.getItem(KEY)).toBeNull();
  });

  it('does not leave chunks behind when a long session is replaced by a short one', async () => {
    const store = sessionStorageAdapter();
    store.setItem(KEY, LONG);
    await settle();
    store.setItem(KEY, 'small');
    await settle();
    expect([...cloud.map.keys()]).toEqual([__test.safeKey(KEY)]);
  });

  it('uses a key Telegram accepts', () => {
    // CloudStorage keys are /^[A-Za-z0-9_-]{1,128}$/, and the storage key has a dot in it.
    expect(__test.safeKey('forma.auth')).toBe('forma_auth');
    expect(__test.safeKey('forma.auth')).toMatch(/^[A-Za-z0-9_-]{1,128}$/);
  });
});

describe('on the open web', () => {
  it('is localStorage and nothing else', async () => {
    inTelegram = false;
    const store = sessionStorageAdapter();
    store.setItem(KEY, LONG);
    await settle();
    expect(cloud.map.size).toBe(0);
    expect(local.getItem(KEY)).toBe(LONG);
    expect(await store.getItem(KEY)).toBe(LONG);
  });

  it('returns nothing rather than throwing when storage is blocked', async () => {
    inTelegram = false;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    const store = sessionStorageAdapter();
    expect(() => store.setItem(KEY, 'x')).not.toThrow();
    expect(await store.getItem(KEY)).toBeNull();
  });
});
