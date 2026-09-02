/**
 * Media references → playable URLs.
 *   'storage:videos/start/air_squat.ru.mp4' → signed URL (private bucket, RLS-checked)
 *   'https://…'                              → unchanged
 *   undefined                                → undefined
 */
import { supabase } from './client';
import { guard } from './internal';
import { parseStorageRef } from './mappers';

export const SIGNED_URL_TTL_SEC = 3600;
/** Re-sign a little before expiry so a URL handed to a <video> never dies mid-playback. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

const cache = new Map<string, { url: string; expiresAt: number }>();

/** Drop cached signed URLs (call on sign-out; entitlements may differ for the next user). */
export function clearMediaUrlCache(): void {
  cache.clear();
}

/** Resolve a content media reference to a URL the browser can load. */
export async function resolveMediaUrl(ref: string | undefined): Promise<string | undefined> {
  if (!ref) return undefined;
  const trimmed = ref.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const parsed = parseStorageRef(trimmed);
  // Not a storage ref: treat as a site-relative path and leave it to the caller.
  if (!parsed) return trimmed;

  const hit = cache.get(trimmed);
  if (hit && hit.expiresAt - REFRESH_MARGIN_MS > Date.now()) return hit.url;

  return guard(async () => {
    const { data, error } = await supabase()
      .storage.from(parsed.bucket)
      .createSignedUrl(parsed.path, SIGNED_URL_TTL_SEC);
    if (error) throw error;
    cache.set(trimmed, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_URL_TTL_SEC * 1000 });
    return data.signedUrl;
  });
}
