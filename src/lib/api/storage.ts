/**
 * Media references → playable URLs.
 *   'storage:videos/start/air_squat.ru.mp4' → signed URL (private bucket, RLS-checked)
 *   'storage:images/courses/yoga/cover.jpg' → public URL (public bucket, no signing)
 *   'https://…'                              → unchanged
 *   undefined                                → undefined
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard } from './internal';
import { parseStorageRef } from './mappers';
import { isDemo } from './mode';

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
  if (isDemo()) return (await demo()).resolveMediaUrl(ref);
  if (!ref) return undefined;
  const trimmed = ref.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const parsed = parseStorageRef(trimmed);
  // Not a storage ref: treat as a site-relative path and leave it to the caller.
  if (!parsed) return trimmed;

  // The images bucket is public, so it needs no signature — and must not have one. A signed URL
  // expires, and these references end up in static landing pages that are built once.
  if (parsed.bucket === PUBLIC_BUCKET) return publicMediaUrl(trimmed);

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

// --- admin uploads ----------------------------------------------------------

/** The one public bucket: course covers, day pictures, exercise stills (0008_course_builder.sql). */
export const PUBLIC_BUCKET = 'images';
/** The private bucket: the paid content. Reads go through a signed URL and an entitlement check. */
export const PRIVATE_BUCKET = 'videos';

/**
 * The public URL of a `storage:images/…` reference.
 *
 * Synchronous and free — a public bucket serves a stable path — which is what lets a built landing
 * page carry one in an `<img src>`.
 */
export function publicMediaUrl(ref: string): string {
  const parsed = parseStorageRef(ref);
  if (!parsed) return ref;
  return supabase().storage.from(parsed.bucket).getPublicUrl(parsed.path).data.publicUrl;
}

/**
 * Upload a file and return the `storage:<bucket>/<path>` reference to store in content.
 *
 * `upsert` so re-uploading a cover replaces it rather than accumulating orphans; the path is the
 * caller's to make stable (see the naming conventions in 0003_storage.sql and 0008).
 * Admin-only by bucket policy — a non-admin upload fails with a 403 that `guard` maps to
 * `forbidden`.
 */
export async function uploadMedia(bucket: string, path: string, file: Blob): Promise<string> {
  if (isDemo()) return (await demo()).uploadMedia(bucket, path, file);
  return guard(async () => {
    const { error } = await supabase()
      .storage.from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (error) throw error;
    const ref = `storage:${bucket}/${path}`;
    // A replaced file keeps its URL, so a cached signed URL would still point at the old bytes.
    cache.delete(ref);
    return ref;
  });
}

/** Remove an uploaded file. Admin-only by bucket policy. */
export async function deleteMedia(ref: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteMedia(ref);
  const parsed = parseStorageRef(ref);
  if (!parsed) return;
  return guard(async () => {
    const { error } = await supabase().storage.from(parsed.bucket).remove([parsed.path]);
    if (error) throw error;
    cache.delete(ref.trim());
  });
}
