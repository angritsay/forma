/**
 * Demo mode switch (docs/SETUP.md §10, docs/SPEC.md §8).
 *
 * Demo mode swaps the Supabase backend for a browser-local one so the whole product can be
 * walked through before a project is provisioned. It is a testing feature, never a fallback:
 *
 *   * `PUBLIC_DEMO_MODE=true` at build time forces it (a demo build);
 *   * otherwise it is only available when Supabase is NOT configured, and only after the
 *     visitor turns it on from the setup screen (flag in localStorage under `forma.demo`).
 *
 * When Supabase is configured and the build flag is absent, `isDemo()` returns false before it
 * touches storage, no demo module is ever imported (the implementation is a lazy chunk, see
 * `demo/load.ts`) and every API function keeps its Supabase path.
 */
import { isConfigured } from './client';

/** localStorage key holding the visitor's on/off choice. */
export const DEMO_FLAG_KEY = 'forma.demo';
/** Every demo row lives under this prefix; `resetDemo()` wipes exactly these keys. */
export const DEMO_DATA_PREFIX = 'forma.demo.';

const FLAG_ON = 'on';

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    /* Storage blocked by the browser: demo mode simply stays off. */
    return null;
  }
}

/**
 * The build-time flag alone. Stable between the server render and the browser, so components
 * that render on both sides can use it for their first paint and re-check `isDemo()` in an effect.
 */
export function isDemoEnv(): boolean {
  return import.meta.env.PUBLIC_DEMO_MODE === 'true';
}

/** True when API calls must go to the browser-local demo backend. */
export function isDemo(): boolean {
  if (isDemoEnv()) return true;
  // A configured backend wins: the visitor flag is not even read, so demo mode is inert.
  if (isConfigured()) return false;
  return storage()?.getItem(DEMO_FLAG_KEY) === FLAG_ON;
}

/** True when the build forces demo mode, so the visitor cannot leave it from the UI. */
export function isDemoForced(): boolean {
  return isDemoEnv();
}

export function enableDemo(): void {
  try {
    storage()?.setItem(DEMO_FLAG_KEY, FLAG_ON);
  } catch {
    /* Nothing to do: without storage the choice cannot be remembered. */
  }
}

export function disableDemo(): void {
  try {
    storage()?.removeItem(DEMO_FLAG_KEY);
  } catch {
    /* ignore */
  }
}

/** Remove every `forma.demo.*` row. The on/off flag itself is kept. */
export function clearDemoData(): void {
  const s = storage();
  if (!s) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i += 1) {
      const key = s.key(i);
      if (key !== null && key.startsWith(DEMO_DATA_PREFIX)) keys.push(key);
    }
    for (const key of keys) s.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Wipe all demo data and reload, so the app boots on a fresh, signed-out demo. */
export function resetDemo(): void {
  clearDemoData();
  if (typeof window !== 'undefined') window.location.reload();
}
