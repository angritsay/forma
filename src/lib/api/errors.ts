/**
 * AppError — the single error type thrown by src/lib/api.
 *
 * `toAppError` folds every failure mode of supabase-js (PostgREST, Auth, Storage, fetch)
 * into six codes the UI can render: network / auth / not_found / forbidden / validation / unknown.
 * Detection is structural (no runtime import of supabase-js) so this module stays pure.
 *
 * Server-raised validation errors (P0001, see supabase/migrations/0002_functions.sql) keep their
 * short machine message (`invalid_email`, `too_many_pending`, …) so the app can map it to i18n.
 */

export type AppErrorCode =
  'network' | 'auth' | 'not_found' | 'forbidden' | 'validation' | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  override readonly cause: unknown;
  /** HTTP status when the underlying service reported one. */
  readonly status: number | undefined;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown; status?: number }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = options?.cause;
    this.status = options?.status;
  }
}

export function isAppError(e: unknown): e is AppError {
  return (
    e instanceof AppError || (isRecord(e) && e.name === 'AppError' && typeof e.code === 'string')
  );
}

// --- structural detection ---------------------------------------------------

function isRecord(e: unknown): e is Record<string, unknown> {
  return typeof e === 'object' && e !== null;
}

interface PostgrestLike {
  message: string;
  code: string;
  details?: string | null;
  hint?: string | null;
}

/** PostgREST / Postgres error: `{ message, code, details, hint }`. */
function isPostgrestLike(e: unknown): e is PostgrestLike {
  return (
    isRecord(e) &&
    typeof e.message === 'string' &&
    typeof e.code === 'string' &&
    ('details' in e || 'hint' in e)
  );
}

interface AuthLike {
  message: string;
  name?: string;
  status?: number;
  code?: string;
}

/** @supabase/auth-js errors carry a `__isAuthError` marker. */
function isAuthLike(e: unknown): e is AuthLike {
  return isRecord(e) && '__isAuthError' in e && typeof e.message === 'string';
}

interface StorageLike {
  message: string;
  status?: number;
  statusCode?: string;
}

/** @supabase/storage-js errors carry a `__isStorageError` marker. */
function isStorageLike(e: unknown): e is StorageLike {
  return isRecord(e) && '__isStorageError' in e && typeof e.message === 'string';
}

// --- mapping tables ---------------------------------------------------------

/** PostgREST "no rows" for .single(), Postgres no_data_found (our admin RPCs). */
const PG_NOT_FOUND = new Set(['PGRST116', 'P0002']);
/** JWT missing / invalid / expired at the PostgREST layer. */
const PG_AUTH = new Set(['PGRST300', 'PGRST301', 'PGRST302', 'PGRST303']);
/** insufficient_privilege: RLS denied the row, or an RPC raised not_admin. */
const PG_FORBIDDEN = new Set(['42501']);
/** raise_exception (our RPC validations) and Postgres data / constraint errors. */
const PG_VALIDATION = new Set([
  'P0001',
  '23502', // not_null_violation
  '23503', // foreign_key_violation
  '23505', // unique_violation
  '23514', // check_violation
  '22P02', // invalid_text_representation
  '22023', // invalid_parameter_value
  '22003', // numeric_value_out_of_range
  '22007', // invalid_datetime_format
  '22008', // datetime_field_overflow
  'PGRST102', // request body parsing
]);

/** Auth API codes the user can act on (expired code, bad email, rate limit, …). */
const AUTH_VALIDATION = new Set([
  'otp_expired',
  'otp_disabled',
  'invalid_credentials',
  'validation_failed',
  'email_address_invalid',
  'email_address_not_authorized',
  'email_exists',
  'email_not_confirmed',
  'signup_disabled',
  'over_email_send_rate_limit',
  'over_request_rate_limit',
  'over_sms_send_rate_limit',
  'weak_password',
  'same_password',
  'bad_code_verifier',
]);

/** Auth API codes meaning "you are not (or no longer) signed in". */
const AUTH_SESSION = new Set([
  'session_not_found',
  'session_expired',
  'refresh_token_not_found',
  'refresh_token_already_used',
  'bad_jwt',
  'no_authorization',
  'user_not_found',
  'not_admin',
  'user_banned',
]);

const NETWORK_MESSAGE = /fetch|network|load failed|connection|timed? ?out|ERR_INTERNET/i;

// --- converters -------------------------------------------------------------

function fromPostgrest(e: PostgrestLike): AppError {
  const code = e.code;
  const opts = { cause: e };
  if (PG_NOT_FOUND.has(code)) return new AppError('not_found', e.message, opts);
  if (PG_AUTH.has(code)) return new AppError('auth', e.message, opts);
  if (PG_FORBIDDEN.has(code)) return new AppError('forbidden', e.message, opts);
  if (PG_VALIDATION.has(code)) return new AppError('validation', e.message, opts);
  // supabase-js wraps a failed fetch as a Postgrest-shaped error with an empty code.
  if (code === '' && NETWORK_MESSAGE.test(e.message))
    return new AppError('network', e.message, opts);
  return new AppError('unknown', e.message, opts);
}

function fromAuth(e: AuthLike): AppError {
  const opts = { cause: e, status: e.status };
  if (
    e.name === 'AuthRetryableFetchError' ||
    (e.status === undefined && NETWORK_MESSAGE.test(e.message))
  ) {
    return new AppError('network', e.message, opts);
  }
  if (e.code && AUTH_VALIDATION.has(e.code)) return new AppError('validation', e.message, opts);
  if (e.code && AUTH_SESSION.has(e.code)) return new AppError('auth', e.message, opts);
  if (e.name === 'AuthSessionMissingError') return new AppError('auth', e.message, opts);
  switch (e.status) {
    case 401:
    case 403:
      return new AppError('auth', e.message, opts);
    case 404:
      return new AppError('not_found', e.message, opts);
    case 400:
    case 422:
    case 429:
      return new AppError('validation', e.message, opts);
    default:
      return new AppError('unknown', e.message, opts);
  }
}

function fromStorage(e: StorageLike): AppError {
  const status = e.status ?? (e.statusCode ? Number(e.statusCode) : undefined);
  const opts = { cause: e, status };
  if (status === undefined && NETWORK_MESSAGE.test(e.message)) {
    return new AppError('network', e.message, opts);
  }
  if (status === 404 || /not found/i.test(e.message))
    return new AppError('not_found', e.message, opts);
  if (status === 401) return new AppError('auth', e.message, opts);
  if (status === 403) return new AppError('forbidden', e.message, opts);
  if (status === 400 || status === 422) return new AppError('validation', e.message, opts);
  return new AppError('unknown', e.message, opts);
}

/** Convert anything thrown by supabase-js / fetch / our own code into an AppError. */
export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  if (isAuthLike(e)) return fromAuth(e);
  if (isStorageLike(e)) return fromStorage(e);
  if (isPostgrestLike(e)) return fromPostgrest(e);
  if (e instanceof Error) {
    if (e.name === 'AbortError' || e.name === 'TimeoutError') {
      return new AppError('network', e.message, { cause: e });
    }
    if (e instanceof TypeError && NETWORK_MESSAGE.test(e.message)) {
      return new AppError('network', e.message, { cause: e });
    }
    return new AppError('unknown', e.message, { cause: e });
  }
  if (typeof e === 'string') return new AppError('unknown', e);
  if (isRecord(e) && typeof e.message === 'string') {
    return new AppError('unknown', e.message, { cause: e });
  }
  return new AppError('unknown', 'Unknown error', { cause: e });
}
