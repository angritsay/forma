/**
 * Media references → playable URLs.
 *   'storage:videos/start/air_squat.ru.mp4' → signed URL (private bucket, RLS-checked)
 *   'storage:images/courses/yoga/cover.jpg' → public URL (public bucket, no signing)
 *   'https://…'                              → unchanged
 *   undefined                                → undefined
 */
import { isConfigured, projectUrl, supabase } from './client';
import { demo } from './demo/load';
import { guard } from './internal';
import { parseStorageRef } from './mappers';
import { isDemo } from './mode';

export const SIGNED_URL_TTL_SEC = 3600;
/** Re-sign a little before expiry so a URL handed to a <video> never dies mid-playback. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
/**
 * Where the signed URLs outlive a reload. Session storage rather than local: a signature is an hour
 * long, and a tab is the unit it makes sense to keep one for — a Mini App that is closed and opened
 * again tomorrow has nothing worth reading back.
 */
export const SIGNED_URL_STORAGE_KEY = 'forma.signedMedia';
/** `createSignedUrls` takes a list; this keeps one request to a size the API is happy with. */
const SIGN_BATCH = 100;

type Signed = { url: string; expiresAt: number };

const cache = new Map<string, Signed>();
/** Signatures being fetched right now, so two asks for one clip share a request. */
const inflight = new Map<string, Promise<string | undefined>>();
let hydrated = false;

function fresh(entry: Signed | undefined, now = Date.now()): entry is Signed {
  return entry !== undefined && entry.expiresAt - REFRESH_MARGIN_MS > now;
}

function sessionStore(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    // A sandboxed frame can throw on the bare property read.
    return null;
  }
}

/** Read back what an earlier page of this tab signed; anything stale or malformed is dropped. */
function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = sessionStore()?.getItem(SIGNED_URL_STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return;
    const now = Date.now();
    for (const [ref, v] of Object.entries(parsed as Record<string, unknown>)) {
      const e = v as Partial<Signed> | null;
      if (typeof e?.url !== 'string' || typeof e.expiresAt !== 'number') continue;
      const entry = { url: e.url, expiresAt: e.expiresAt };
      if (fresh(entry, now) && !cache.has(ref)) cache.set(ref, entry);
    }
  } catch {
    /* A corrupt entry costs one round of signing, nothing more. */
  }
}

function persist(): void {
  const store = sessionStore();
  if (!store) return;
  const now = Date.now();
  const out: Record<string, Signed> = {};
  for (const [ref, entry] of cache) if (fresh(entry, now)) out[ref] = entry;
  try {
    store.setItem(SIGNED_URL_STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* Quota or a private window: the in-memory copy still works for this page. */
  }
}

function remember(ref: string, url: string, now = Date.now()): void {
  cache.set(ref, { url, expiresAt: now + SIGNED_URL_TTL_SEC * 1000 });
}

/** Drop cached signed URLs (call on sign-out; entitlements may differ for the next user). */
export function clearMediaUrlCache(): void {
  cache.clear();
  inflight.clear();
  hydrated = true;
  try {
    sessionStore()?.removeItem(SIGNED_URL_STORAGE_KEY);
  } catch {
    /* Nothing to clear. */
  }
}

/**
 * The URL for a reference **if it is known right now**, without asking anybody.
 *
 * This is what lets the player hand a clip to a `<video>` on the very render that shows it: a URL
 * the session already signed, a public image, a plain address. Undefined means "ask
 * {@link resolveMediaUrl}", not "there is no clip".
 */
export function cachedMediaUrl(ref: string | undefined): string | undefined {
  const trimmed = ref?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const parsed = parseStorageRef(trimmed);
  if (!parsed) return trimmed;
  // The demo has no buckets at all; `resolveMediaUrl` says the same.
  if (isDemo()) return undefined;
  if (parsed.bucket === PUBLIC_BUCKET) return publicMediaUrl(trimmed);
  hydrate();
  const hit = cache.get(trimmed);
  return fresh(hit) ? hit.url : undefined;
}

/**
 * Sign every clip a workout will need, in as few requests as there are buckets.
 *
 * The player used to sign a clip when it arrived at it — one round trip to Storage, then the
 * download, at the exact moment the athlete was looking at a black rectangle waiting for the
 * movement. A session is known in full when it starts, so the signatures are fetched together then
 * and every step after the first finds its URL already here. Best effort: a clip this fails for is
 * signed on its own when it is reached, as before.
 */
export async function signMediaUrls(refs: readonly (string | undefined)[]): Promise<void> {
  if (isDemo() || !isConfigured()) return;
  hydrate();
  const byBucket = new Map<string, { ref: string; path: string }[]>();
  for (const raw of refs) {
    const ref = raw?.trim();
    if (!ref || inflight.has(ref) || fresh(cache.get(ref))) continue;
    const parsed = parseStorageRef(ref);
    if (!parsed || parsed.bucket === PUBLIC_BUCKET) continue;
    const list = byBucket.get(parsed.bucket) ?? [];
    if (!list.some((e) => e.ref === ref)) list.push({ ref, path: parsed.path });
    byBucket.set(parsed.bucket, list);
  }

  const batches: Promise<void>[] = [];
  const waiting = new Map<string, Promise<string | undefined>>();
  for (const [bucket, entries] of byBucket) {
    for (let i = 0; i < entries.length; i += SIGN_BATCH) {
      const chunk = entries.slice(i, i + SIGN_BATCH);
      const request = supabase()
        .storage.from(bucket)
        .createSignedUrls(
          chunk.map((e) => e.path),
          SIGNED_URL_TTL_SEC,
        )
        .then(({ data, error }) => {
          if (error || !data) return;
          const now = Date.now();
          const byPath = new Map(data.map((d) => [d.path, d]));
          for (const e of chunk) {
            const hit = byPath.get(e.path);
            if (hit && !hit.error && hit.signedUrl) remember(e.ref, hit.signedUrl, now);
          }
        })
        .catch(() => undefined);
      // Individual asks for these refs wait for the batch rather than signing them a second time.
      for (const e of chunk) {
        const wait = request.then(() => {
          const hit = cache.get(e.ref);
          return fresh(hit) ? hit.url : undefined;
        });
        waiting.set(e.ref, wait);
        inflight.set(e.ref, wait);
      }
      batches.push(request);
    }
  }
  await Promise.all(batches);
  for (const [ref, wait] of waiting) if (inflight.get(ref) === wait) inflight.delete(ref);
  persist();
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

  hydrate();
  const hit = cache.get(trimmed);
  if (fresh(hit)) return hit.url;

  // A batch already on its way covers this one; if it came back without it, sign it alone.
  const pending = inflight.get(trimmed);
  if (pending) {
    const url = await pending;
    if (url) return url;
  }

  const single = guard(async () => {
    const { data, error } = await supabase()
      .storage.from(parsed.bucket)
      .createSignedUrl(parsed.path, SIGNED_URL_TTL_SEC);
    if (error) throw error;
    remember(trimmed, data.signedUrl);
    persist();
    return data.signedUrl;
  });
  inflight.set(trimmed, single);
  try {
    return await single;
  } finally {
    if (inflight.get(trimmed) === single) inflight.delete(trimmed);
  }
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
  // Built by hand rather than through `supabase().storage`: this runs during the static build as
  // well as in the browser, and there a Supabase client would be an auth store and a refresh timer
  // created to concatenate a string. The address is the one Storage documents and never varies.
  const base = projectUrl();
  if (!base) return ref;
  return `${base}/storage/v1/object/public/${parsed.bucket}/${parsed.path}`;
}

/**
 * Where a still from an exercise's clip lives, by convention.
 *
 * `images/exercises/<id>.jpg` in the public bucket, written by scripts/media/upload-videos.mjs
 * next to the clip it came from. Derived rather than stored on the exercise: the path is already
 * deterministic, and making it a content field would mean editing every exercise file each time a
 * batch of clips is uploaded — for a value that can only ever be this one string.
 *
 * Empty when Supabase is not configured (the demo, a build with no backend): there is no bucket to
 * point at, and nothing is drawn — see `ExerciseStill`.
 */
export function exerciseStillUrl(exerciseId: string): string | undefined {
  if (!isConfigured() || isDemo()) return undefined;
  return publicMediaUrl(`storage:${PUBLIC_BUCKET}/exercises/${exerciseId}.jpg`);
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
    persist();
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
    persist();
  });
}
