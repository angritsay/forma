/**
 * Why a segment did not reach the server, in words the owner can act on.
 *
 * Every failure on the way — reading the file, cutting the piece, the TUS upload, registering the
 * clip — folds into one {@link UploadErrorKind}, and each kind has its own line of copy
 * (`app.studioErr*`). «Something went wrong» is not one of them: the point is to say whether to
 * wait for signal, film again, trim the piece or ask for access.
 *
 * Pure and structural (no runtime import of tus-js-client or mediabunny), so it is tested with
 * plain objects.
 */
import { isAppError } from '@/lib/api/errors';
import type { TKey } from '@/i18n/index';

export type UploadErrorKind =
  /** No connection, or it dropped and the retries ran out. */
  | 'offline'
  /** The piece is bigger than the bucket (or the project) takes. */
  | 'too_large'
  /** The file is not a video the cutter can read (or it has no picture track). */
  | 'unsupported'
  /** The piece could not be cut without re-encoding (codec, broken file). */
  | 'remux'
  /** The file has no keyframe near the start mark. */
  | 'keyframe'
  /** Signed out, or not an admin any more. */
  | 'permission'
  /** The clip is being rendered right now; edits wait for the worker. */
  | 'busy'
  /** The server refused the clip's data (span, crop, exercise). */
  | 'invalid'
  /** Anything else the server answered. */
  | 'server';

export const UPLOAD_ERROR_KEY: Record<UploadErrorKind, TKey> = {
  offline: 'app.studioErrOffline',
  too_large: 'app.studioErrTooLarge',
  unsupported: 'app.studioErrUnsupported',
  remux: 'app.studioErrRemux',
  keyframe: 'app.studioErrKeyframe',
  permission: 'app.studioErrPermission',
  busy: 'app.studioErrBusy',
  invalid: 'app.studioErrInvalid',
  server: 'app.studioErrServer',
};

/** An error the cutter raises itself, already classified. */
export class StudioError extends Error {
  readonly kind: UploadErrorKind;
  constructor(kind: UploadErrorKind, message: string = kind) {
    super(message);
    this.name = 'StudioError';
    this.kind = kind;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** The HTTP status a tus-js-client `DetailedError` carries, if any. */
export function tusStatus(e: unknown): number | null {
  if (!isRecord(e)) return null;
  const res = e.originalResponse;
  if (!isRecord(res) || typeof res.getStatus !== 'function') return null;
  const s: unknown = (res.getStatus as () => unknown)();
  return typeof s === 'number' && s > 0 ? s : null;
}

const INVALID_CODES = new Set([
  'invalid_crop',
  'invalid_grade',
  'invalid_span',
  'invalid_raw_path',
  'unknown_exercise',
  'unknown_source',
  'clip_conflict',
  'not_found',
  'invalid_title',
  'invalid_duration',
  'too_many',
  'invalid_id',
]);

/**
 * The kind of any failure. `online` is `navigator.onLine` at the moment of the failure: a fetch
 * that failed while the phone says it is offline is the signal, not the server.
 */
export function classifyUploadError(e: unknown, online = true): UploadErrorKind {
  if (e instanceof StudioError) return e.kind;
  if (isRecord(e) && e.name === 'StudioError' && typeof e.kind === 'string') {
    return e.kind as UploadErrorKind;
  }
  if (!online) return 'offline';
  if (isAppError(e)) {
    if (e.code === 'network') return 'offline';
    if (e.code === 'auth' || e.code === 'forbidden') return 'permission';
    if (e.message === 'clip_busy') return 'busy';
    if (e.code === 'validation' || INVALID_CODES.has(e.message)) return 'invalid';
    return 'server';
  }
  const status = tusStatus(e);
  if (status !== null) {
    if (status === 413) return 'too_large';
    if (status === 401 || status === 403) return 'permission';
    // Storage answers a too-big object with a 400 whose body names the size.
    if (status === 400 && /size|too large|exceed/i.test(errorText(e))) return 'too_large';
    return 'server';
  }
  // tus-js-client without a response: the request never completed.
  if (isRecord(e) && 'originalRequest' in e) return 'offline';
  if (e instanceof TypeError && /fetch|network|load/i.test(e.message)) return 'offline';
  return 'server';
}

function errorText(e: unknown): string {
  if (!isRecord(e)) return '';
  const res = e.originalResponse;
  const body =
    isRecord(res) && typeof res.getBody === 'function' ? (res.getBody as () => unknown)() : '';
  return `${typeof e.message === 'string' ? e.message : ''} ${typeof body === 'string' ? body : ''}`;
}

/**
 * A retry is worth offering for these; for the others the same tap fails the same way until
 * something else changes (the file, the access, the piece's length).
 */
export function isRetryable(kind: UploadErrorKind): boolean {
  return kind === 'offline' || kind === 'server' || kind === 'busy';
}
