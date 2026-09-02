/** Resolve a content media reference (`storage:` / URL / site path) to something a <video> can play. */
import { useEffect, useState } from 'react';
import { resolveMediaUrl } from '@/lib/api/storage';
import { withBase } from '@/lib/util/paths';

export function useMediaUrl(ref: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setUrl(undefined);
    if (!ref) return;
    resolveMediaUrl(ref)
      .then((resolved) => {
        if (!alive || !resolved) return;
        setUrl(/^https?:\/\//i.test(resolved) ? resolved : withBase(resolved));
      })
      .catch(() => {
        /* No signed URL (offline, no entitlement): the animated figure stays. */
      });
    return () => {
      alive = false;
    };
  }, [ref]);

  return url;
}
