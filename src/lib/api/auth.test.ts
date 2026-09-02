import { describe, expect, it } from 'vitest';
import { AuthError, isValidCode, isValidEmail, normalizeEmail, toAuthError } from './auth';
import { isAppError } from './errors';

/** Shape of an @supabase/auth-js AuthApiError without importing the SDK. */
function authApiError(code: string, status: number, message = 'auth error') {
  return { __isAuthError: true, name: 'AuthApiError', message, status, code };
}

describe('auth helpers', () => {
  it('validates and normalizes emails', () => {
    expect(isValidEmail('  Coach@Example.com ')).toBe(true);
    expect(normalizeEmail('  Coach@Example.com ')).toBe('coach@example.com');
    expect(isValidEmail('coach@example')).toBe(false);
    expect(isValidEmail('coach example@x.io')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('accepts exactly six digits as a code', () => {
    expect(isValidCode('123456')).toBe(true);
    expect(isValidCode('12345')).toBe(false);
    expect(isValidCode('12345a')).toBe(false);
  });
});

describe('toAuthError', () => {
  it('maps wrong / expired codes', () => {
    const e = toAuthError(authApiError('otp_expired', 403, 'Token has expired or is invalid'));
    expect(e).toBeInstanceOf(AuthError);
    expect(isAppError(e)).toBe(true);
    expect(e.reason).toBe('invalid_code');
    expect(e.status).toBe(403);
  });

  it('maps rate limits by code and by status', () => {
    expect(toAuthError(authApiError('over_email_send_rate_limit', 429)).reason).toBe(
      'rate_limited',
    );
    expect(toAuthError(authApiError('unexpected_failure', 429)).reason).toBe('rate_limited');
  });

  it('maps invalid emails and closed sign-ups', () => {
    expect(toAuthError(authApiError('email_address_invalid', 400)).reason).toBe('invalid_email');
    expect(toAuthError(authApiError('validation_failed', 422)).reason).toBe('invalid_email');
    expect(toAuthError(authApiError('signup_disabled', 422)).reason).toBe('signup_disabled');
  });

  it('maps network failures without a reason', () => {
    const fetchFail = toAuthError(new TypeError('Failed to fetch'));
    expect(fetchFail.code).toBe('network');
    expect(fetchFail.reason).toBeUndefined();
    const retryable = toAuthError({
      __isAuthError: true,
      name: 'AuthRetryableFetchError',
      message: 'fetch failed',
      status: 0,
    });
    expect(retryable.code).toBe('network');
  });

  it('passes AuthError through and wraps unknown values', () => {
    const own = new AuthError('validation', 'bad', { reason: 'invalid_email' });
    expect(toAuthError(own)).toBe(own);
    const unknown = toAuthError('boom');
    expect(unknown.code).toBe('unknown');
    expect(unknown.message).toBe('boom');
  });
});
