/**
 * Resolve a content media reference (`storage:` / URL / site path) to something a <video> can play.
 *
 * A reference the session already knows the URL of — signed in bulk when the workout started, see
 * `signMediaUrls` — is returned on the very first render, so the clip's element gets its `src` in
 * the same frame that shows it. It used to be reset to undefined on every change and fetched
 * again, which put a black frame and a round trip in front of every movement.
 */
import { useEffect, useState } from 'react';
import { cachedMediaUrl, resolveMediaUrl } from '@/lib/api/storage';
import { withBase } from '@/lib/util/paths';

function playable(resolved: string): string {
  return /^https?:\/\//i.test(resolved) ? resolved : withBase(resolved);
}

export function useMediaUrl(ref: string | undefined): string | undefined {
  const cached = cachedMediaUrl(ref);
  const known = cached ? playable(cached) : undefined;
  // Remembered with the ref it belongs to, so a late answer for the last ref is never shown.
  const [resolved, setResolved] = useState<{ ref: string; url: string } | null>(null);

  useEffect(() => {
    if (!ref || known) return;
    let alive = true;
    resolveMediaUrl(ref)
      .then((url) => {
        if (alive && url) setResolved({ ref, url: playable(url) });
      })
      .catch(() => {
        /* No signed URL (offline, no entitlement): the still stays. */
      });
    return () => {
      alive = false;
    };
  }, [ref, known]);

  if (!ref) return undefined;
  return known ?? (resolved?.ref === ref ? resolved.url : undefined);
}
