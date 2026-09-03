/**
 * `is_admin()` for the signed-in user, cached per user id for the life of the page so the
 * Profile link and the Admin guard share one RPC. `null` while the answer is not known yet.
 */
import { useEffect, useState } from 'react';
import { isAdmin } from '@/lib/api/admin';
import { useSession } from '@/app/store/session';

const cache = new Map<string, boolean>();
const inflight = new Map<string, Promise<boolean>>();

function check(userId: string): Promise<boolean> {
  const cached = cache.get(userId);
  if (cached !== undefined) return Promise.resolve(cached);
  let p = inflight.get(userId);
  if (!p) {
    p = isAdmin()
      .catch(() => false)
      .then((value) => {
        cache.set(userId, value);
        return value;
      })
      .finally(() => {
        inflight.delete(userId);
      });
    inflight.set(userId, p);
  }
  return p;
}

export function useIsAdmin(): boolean | null {
  const userId = useSession((s) => s.user?.id ?? null);
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
    let alive = true;
    setAdmin(null);
    void check(userId).then((value) => {
      if (alive) setAdmin(value);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  return admin;
}
