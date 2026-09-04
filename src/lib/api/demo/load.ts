/**
 * Lazy handle on the demo backend.
 *
 * The import is dynamic and memoized: with Supabase configured, `isDemo()` is false at every
 * call site, `demo()` is never reached and the demo chunk is neither fetched nor evaluated.
 */
import type * as DemoApi from './index';

export type DemoApiModule = typeof DemoApi;

let pending: Promise<DemoApiModule> | null = null;

export function demo(): Promise<DemoApiModule> {
  pending ??= import('./index');
  return pending;
}
