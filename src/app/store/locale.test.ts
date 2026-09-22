/**
 * The language store, tested on the four moments that decide whether anybody is ever asked twice
 * — and on the one that decides whether the bot writes in the right language.
 *
 * The module reads `localStorage` at import time (the store's initial state), so every case
 * re-imports it with `resetModules` after seeding the fake store. That is not ceremony: "what was
 * remembered from last launch" is exactly the thing under test.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALE_STORAGE_KEY } from './locale';

class FakeStorage {
  readonly map = new Map<string, string>();
  /** Set to throw from both methods, the way a private window does. */
  broken = false;
  getItem(k: string): string | null {
    if (this.broken) throw new Error('denied');
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.broken) throw new Error('denied');
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
}

let store: FakeStorage;

async function load() {
  vi.resetModules();
  return import('./locale');
}

beforeEach(() => {
  store = new FakeStorage();
  vi.stubGlobal('localStorage', store);
});

describe('first launch', () => {
  it('has no choice yet, so the first screen asks', async () => {
    const { useLocale } = await load();
    expect(useLocale.getState().chosen).toBe(false);
    expect(useLocale.getState().locale).toBe('ru');
  });

  it('remembers a pick for the next launch', async () => {
    const first = await load();
    first.useLocale.getState().setLocale('en');
    expect(first.useLocale.getState()).toMatchObject({ locale: 'en', chosen: true });
    expect(store.map.get(LOCALE_STORAGE_KEY)).toBe('en');

    // Next launch, same device: the question is settled and the app opens in English.
    const next = await load();
    expect(next.useLocale.getState()).toMatchObject({ locale: 'en', chosen: true });
  });

  it('ignores a language it does not publish', async () => {
    const { useLocale } = await load();
    // @ts-expect-error — the guard exists for values from storage and from a profile row.
    useLocale.getState().setLocale('de');
    expect(useLocale.getState()).toMatchObject({ locale: 'ru', chosen: false });
  });

  it('survives storage that refuses to answer', async () => {
    store.broken = true;
    const { useLocale } = await load();
    expect(useLocale.getState().chosen).toBe(false);
    // The pick still applies to this launch; only its memory is lost.
    expect(() => useLocale.getState().setLocale('en')).not.toThrow();
    expect(useLocale.getState()).toMatchObject({ locale: 'en', chosen: true });
  });
});

describe('adopt — the profile speaking', () => {
  /*
   * Everyone who existed before the language screen shipped carries `profiles.locale = 'ru'`, the
   * column's default since 0001_init.sql. This is the case that keeps them from ever being asked.
   */
  it('settles an existing user without asking them', async () => {
    const { useLocale } = await load();
    useLocale.getState().adopt('ru');
    expect(useLocale.getState()).toMatchObject({ locale: 'ru', chosen: true });
    expect(store.map.get(LOCALE_STORAGE_KEY)).toBe('ru');
  });

  it('does not overwrite a choice made moments earlier on this device', async () => {
    const { useLocale } = await load();
    // Picked English on the first screen, then signed in to an account created in Russian.
    useLocale.getState().setLocale('en');
    useLocale.getState().adopt('ru');
    expect(useLocale.getState().locale).toBe('en');
  });
});
