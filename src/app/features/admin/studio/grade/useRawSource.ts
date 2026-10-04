/**
 * A playable URL for a clip's raw piece: signed from the private `raw` bucket, again on demand (a
 * signed URL expires, and a video that stalls after a long pause is usually that). The demo has no
 * buckets; a refusal is a permission or a missing file.
 *
 * Shared by every studio step that plays a clip (names, colour, preview).
 */
import { useCallback, useEffect, useState } from 'react';
import { isNetworkError } from '@/lib/api/errors';
import { RAW_BUCKET } from '@/lib/api/mediaStudio';
import { isDemo } from '@/lib/api/mode';
import { resolveMediaUrl } from '@/lib/api/storage';
import type { PlaybackProblem } from './studioErrors';

export interface RawSource {
  src: string | null;
  /** Why there is no `src`, when there is none for good. */
  problem: PlaybackProblem | null;
  /** Sign the piece again. */
  retry: () => void;
}

export function useRawSource(rawPath: string | null): RawSource {
  const [src, setSrc] = useState<string | null>(null);
  const [problem, setProblem] = useState<PlaybackProblem | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setSrc(null);
    setProblem(null);
    if (!rawPath) return;
    if (isDemo()) {
      setProblem('demo');
      return;
    }
    resolveMediaUrl(`storage:${RAW_BUCKET}/${rawPath}`)
      .then((url) => {
        if (!alive) return;
        if (url) setSrc(url);
        else setProblem('sign');
      })
      .catch((e: unknown) => {
        if (alive) setProblem(isNetworkError(e) ? 'network' : 'sign');
      });
    return () => {
      alive = false;
    };
  }, [rawPath, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { src, problem, retry };
}
