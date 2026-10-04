/**
 * Resumable upload of a cut piece into the private `raw` bucket (0060), over Supabase Storage's
 * TUS endpoint (`/storage/v1/upload/resumable`).
 *
 * A plain `storage.upload()` sends the piece in one request: on a phone that walks out of Wi-Fi
 * mid-way, a 200 MB piece starts again from zero. TUS sends 6 MB chunks (the size Supabase
 * requires), retries a dropped chunk by itself, and remembers the upload's URL in localStorage
 * (tus-js-client's default URL storage) under a fingerprint of the piece, so a reload of the page
 * picks up at the last chunk the server has.
 *
 * Why resuming across a reload is safe although the piece is cut again: the cutter writes MP4 with
 * the index at the end (`fastStart: false`), so every byte before the index is the same on every
 * cut of the same marks. The only bytes that differ are the creation time inside that index, and
 * any value there is valid. The fingerprint carries the piece's size and its cut points, so a
 * piece cut from moved marks never resumes an old upload.
 *
 * tus-js-client is loaded on first use: only the admin's studio chunk pays for it.
 */
import { supabase, projectUrl } from './client';
import { AppError } from './errors';
import { RAW_BUCKET, RAW_FILE_SIZE_LIMIT } from './mediaStudio';
import { isDemo } from './mode';

/** A TUS chunk. Supabase's resumable endpoint takes exactly 6 MB (the last chunk may be less). */
export const RAW_CHUNK_SIZE = 6 * 1024 * 1024;

/** Waits between retries of a failed chunk, ms; after the last one the upload fails. */
export const RAW_RETRY_DELAYS: readonly number[] = [0, 3000, 5000, 10000, 20000];

/** The TUS endpoint of a Supabase project. */
export function tusEndpoint(project: string): string {
  return `${project.replace(/\/+$/, '')}/storage/v1/upload/resumable`;
}

/** Whether a piece fits the bucket's own per-file ceiling (the project-wide one may be lower). */
export function fitsRawLimit(bytes: number, limit: number = RAW_FILE_SIZE_LIMIT): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= limit;
}

/**
 * The key a piece's upload URL is remembered under. The same object, the same size and the same
 * cut points — and only then — resume each other.
 */
export function rawFingerprint(path: string, size: number, cut: string): string {
  return `forma-raw:${RAW_BUCKET}/${path}:${size}:${cut}`;
}

export interface RawUploadInput {
  /** The object inside {@link RAW_BUCKET} (`rawClipPath`). */
  path: string;
  blob: Blob;
  /** The cut points, for the fingerprint (`<start>-<end>`). */
  cut: string;
  /** 0…1. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/** Thrown when the caller aborted; not an error to show. */
export class UploadAbortedError extends Error {
  constructor() {
    super('aborted');
    this.name = 'UploadAbortedError';
  }
}

/** Upload one piece; resolves once Storage holds the whole object. */
export async function uploadRawPiece(input: RawUploadInput): Promise<void> {
  if (!fitsRawLimit(input.blob.size)) throw new AppError('validation', 'too_large');
  if (isDemo()) return demoUpload(input);

  const { Upload } = await import('tus-js-client');
  const client = supabase();
  const { data } = await client.auth.getSession();
  if (!data.session) throw new AppError('auth', 'not_signed_in');

  const fingerprint = rawFingerprint(input.path, input.blob.size, input.cut);

  await new Promise<void>((resolve, reject) => {
    if (input.signal?.aborted) {
      reject(new UploadAbortedError());
      return;
    }
    const upload = new Upload(input.blob, {
      endpoint: tusEndpoint(projectUrl()),
      retryDelays: [...RAW_RETRY_DELAYS],
      chunkSize: RAW_CHUNK_SIZE,
      uploadDataDuringCreation: true,
      storeFingerprintForResuming: true,
      removeFingerprintOnSuccess: true,
      fingerprint: () => Promise.resolve(fingerprint),
      headers: { 'x-upsert': 'true' },
      metadata: {
        bucketName: RAW_BUCKET,
        objectName: input.path,
        contentType: input.blob.type || 'video/mp4',
        cacheControl: '3600',
      },
      /*
       * The token is read fresh before every request: a long upload outlives the access token's
       * hour, and supabase-js refreshes it in the background.
       */
      onBeforeRequest: async (req) => {
        const { data: now } = await client.auth.getSession();
        const token = now.session?.access_token ?? data.session!.access_token;
        req.setHeader('authorization', `Bearer ${token}`);
      },
      onProgress: (sent, total) => {
        if (total > 0) input.onProgress?.(Math.min(1, sent / total));
      },
      onError: (e) => reject(e),
      onSuccess: () => resolve(),
    });

    input.signal?.addEventListener(
      'abort',
      () => {
        // Not terminated: the server keeps the chunks so the next attempt resumes.
        void upload.abort(false).finally(() => reject(new UploadAbortedError()));
      },
      { once: true },
    );

    upload
      .findPreviousUploads()
      .then((previous) => {
        const last = previous[0];
        if (last) upload.resumeFromPreviousUpload(last);
        upload.start();
      })
      .catch(() => upload.start());
  });
}

/** The demo has no storage: the progress bar fills and the piece is forgotten. */
async function demoUpload(input: RawUploadInput): Promise<void> {
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    if (input.signal?.aborted) throw new UploadAbortedError();
    await new Promise((r) => setTimeout(r, 60));
    input.onProgress?.(i / steps);
  }
}
