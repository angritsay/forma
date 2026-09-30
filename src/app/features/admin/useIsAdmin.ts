/**
 * `is_admin()` for the signed-in user, cached per user id for the life of the page so the
 * Profile link and the Admin guard share one RPC. `null` while the answer is not known yet.
 *
 * **Only an answer is cached (0059).** A failed check used to be stored as `false`: one dropped
 * request and the admin screens redirected the owner to the home page for the rest of the
 * session, with nothing on screen to say it was the network. A failure now stays unknown
 * (`null`), is remembered as a failure, and `useAdminCheck()` offers the retry — `AdminBoot` shows
 * it where the screens used to wait on the loader for good.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { isAdmin } from '@/lib/api/admin';
import { useSession } from '@/app/store/session';

const cache = new Map<string, boolean>();
const inflight = new Map<string, Promise<boolean | null>>();
/** User ids whose last check failed: unknown, and not asked again until somebody retries. */
const failed = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version += 1;
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The answer for this user: `true` / `false`, or `null` when the check failed (not cached). */
export function checkAdmin(userId: string): Promise<boolean | null> {
  const cached = cache.get(userId);
  if (cached !== undefined) return Promise.resolve(cached);
  let p = inflight.get(userId);
  if (!p) {
    p = isAdmin()
      .then((value): boolean | null => {
        cache.set(userId, value);
        failed.delete(userId);
        return value;
      })
      .catch((): null => {
        failed.add(userId);
        return null;
      })
      .finally(() => {
        inflight.delete(userId);
        notify();
      });
    inflight.set(userId, p);
  }
  return p;
}

/** Whether the last check for this user failed. */
export function adminCheckFailed(userId: string): boolean {
  return failed.has(userId);
}

/** Forget a failure, so the next render asks again. */
export function retryAdminCheck(userId: string): void {
  failed.delete(userId);
  notify();
}

export interface AdminCheck {
  /** `true` / `false` once answered; `null` while asking, and after a failed ask. */
  admin: boolean | null;
  /** The last ask failed: `admin` is unknown, not no. */
  failed: boolean;
  /** Ask again. */
  retry: () => void;
}

export function useAdminCheck(): AdminCheck {
  const userId = useSession((s) => s.user?.id ?? null);
  // Re-read the module state whenever any check settles or is retried.
  const tick = useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
  const [admin, setAdmin] = useState<boolean | null>(() =>
    userId ? (cache.get(userId) ?? null) : false,
  );

  useEffect(() => {
    if (!userId) {
      setAdmin(false);
      return;
    }
    const cached = cache.get(userId);
    if (cached !== undefined) {
      setAdmin(cached);
      return;
    }
    setAdmin(null);
    // A failure waits for `retry()`: asking again on every render would hammer a dead network.
    if (failed.has(userId)) return;
    let alive = true;
    void checkAdmin(userId).then((value) => {
      if (alive) setAdmin(value);
    });
    return () => {
      alive = false;
    };
  }, [userId, tick]);

  const retry = useCallback(() => {
    if (userId) retryAdminCheck(userId);
  }, [userId]);

  return { admin, failed: userId !== null && failed.has(userId), retry };
}

export function useIsAdmin(): boolean | null {
  return useAdminCheck().admin;
}
