import { describe, expect, it } from 'vitest';
import { AppError, isAppError, toAppError } from './errors';

/** Shape of a PostgrestError as supabase-js hands it back. */
function pg(code: string, message = 'boom') {
  return { name: 'PostgrestError', message, code, details: '', hint: '' };
}

/** Shape of an AuthError (the marker is what the SDK's own isAuthError() checks). */
function auth(opts: { status?: number; code?: string; name?: string; message?: string }) {
  return {
    __isAuthError: true,
    name: opts.name ?? 'AuthApiError',
    message: opts.message ?? 'auth failed',
    status: opts.status,
    code: opts.code,
  };
}

function storage(opts: { status?: number; statusCode?: string; message?: string }) {
  return {
    __isStorageError: true,
    name: 'StorageApiError',
    message: opts.message ?? 'storage failed',
    status: opts.status,
    statusCode: opts.statusCode,
  };
}

describe('AppError', () => {
  it('keeps code, message, cause and status', () => {
    const cause = new Error('x');
    const e = new AppError('forbidden', 'nope', { cause, status: 403 });
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('AppError');
    expect(e.code).toBe('forbidden');
    expect(e.message).toBe('nope');
    expect(e.cause).toBe(cause);
    expect(e.status).toBe(403);
    expect(isAppError(e)).toBe(true);
    expect(isAppError(new Error('x'))).toBe(false);
  });

  it('toAppError passes an AppError through untouched', () => {
    const e = new AppError('validation', 'invalid_email');
    expect(toAppError(e)).toBe(e);
  });
});

describe('toAppError — PostgREST / Postgres', () => {
  it('maps codes to app codes', () => {
    expect(toAppError(pg('PGRST116')).code).toBe('not_found');
    expect(toAppError(pg('P0002')).code).toBe('not_found');
    expect(toAppError(pg('PGRST301')).code).toBe('auth');
    expect(toAppError(pg('42501', 'not_admin')).code).toBe('forbidden');
    expect(toAppError(pg('23505')).code).toBe('validation');
    expect(toAppError(pg('23514')).code).toBe('validation');
    expect(toAppError(pg('22P02')).code).toBe('validation');
    expect(toAppError(pg('XX000')).code).toBe('unknown');
  });

  it('keeps the short machine message from RPC raises', () => {
    const e = toAppError(pg('P0001', 'too_many_pending'));
    expect(e.code).toBe('validation');
    expect(e.message).toBe('too_many_pending');
    expect(e.cause).toEqual(pg('P0001', 'too_many_pending'));
  });

  it('treats a fetch failure wrapped as an empty-code error as network', () => {
    expect(toAppError(pg('', 'TypeError: Failed to fetch')).code).toBe('network');
  });
});

describe('toAppError — Auth', () => {
  it('maps user-fixable codes to validation even with a 403 status', () => {
    expect(toAppError(auth({ status: 403, code: 'otp_expired' })).code).toBe('validation');
    expect(toAppError(auth({ status: 429, code: 'over_email_send_rate_limit' })).code).toBe(
      'validation',
    );
    expect(toAppError(auth({ status: 422, code: 'validation_failed' })).code).toBe('validation');
  });

  it('maps session problems to auth', () => {
    expect(toAppError(auth({ status: 401 })).code).toBe('auth');
    expect(toAppError(auth({ status: 403 })).code).toBe('auth');
    expect(toAppError(auth({ status: 400, code: 'session_not_found' })).code).toBe('auth');
    expect(toAppError(auth({ status: 400, name: 'AuthSessionMissingError' })).code).toBe('auth');
  });

  it('maps fetch failures to network and keeps the status', () => {
    expect(toAppError(auth({ name: 'AuthRetryableFetchError', status: 0 })).code).toBe('network');
    expect(toAppError(auth({ message: 'fetch failed' })).code).toBe('network');
    expect(toAppError(auth({ status: 404 })).code).toBe('not_found');
    expect(toAppError(auth({ status: 500 })).code).toBe('unknown');
    expect(toAppError(auth({ status: 401 })).status).toBe(401);
  });
});

describe('toAppError — Storage', () => {
  it('maps status codes', () => {
    expect(toAppError(storage({ status: 404 })).code).toBe('not_found');
    expect(toAppError(storage({ statusCode: '404' })).code).toBe('not_found');
    expect(toAppError(storage({ status: 400, message: 'Object not found' })).code).toBe(
      'not_found',
    );
    expect(toAppError(storage({ status: 403 })).code).toBe('forbidden');
    expect(toAppError(storage({ status: 401 })).code).toBe('auth');
    expect(toAppError(storage({ status: 400 })).code).toBe('validation');
    expect(toAppError(storage({ status: 500 })).code).toBe('unknown');
    expect(toAppError(storage({ message: 'Failed to fetch' })).code).toBe('network');
  });
});

describe('toAppError — generic', () => {
  it('maps fetch / abort errors to network', () => {
    expect(toAppError(new TypeError('Failed to fetch')).code).toBe('network');
    expect(toAppError(new TypeError('Load failed')).code).toBe('network');
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    expect(toAppError(abort).code).toBe('network');
  });

  it('wraps everything else as unknown and keeps the message', () => {
    expect(toAppError(new Error('Supabase is not configured')).message).toBe(
      'Supabase is not configured',
    );
    expect(toAppError(new TypeError('x is not a function')).code).toBe('unknown');
    expect(toAppError('plain string')).toMatchObject({ code: 'unknown', message: 'plain string' });
    expect(toAppError({ message: 'obj' })).toMatchObject({ code: 'unknown', message: 'obj' });
    expect(toAppError(42)).toMatchObject({ code: 'unknown', message: 'Unknown error', cause: 42 });
    expect(toAppError(null).code).toBe('unknown');
  });
});
