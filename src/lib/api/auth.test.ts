import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthError,
  isValidCode,
  isValidEmail,
  normalizeEmail,
  toAuthError,
  verifyCode,
} from './auth';
import { isAppError } from './errors';

/** Shape of an @supabase/auth-js AuthApiError without importing the SDK. */
function authApiError(code: string, status: number, message = 'auth error') {
  return { __isAuthError: true, name: 'AuthApiError', message, status, code };
}

/*
 * `verifyCode` is the one function here that talks to the network, so the client and the demo
 * switch are stubbed. Nothing else in this file needs them — the rest is pure.
 */
const verifyOtp = vi.fn();
vi.mock('./client', () => ({ supabase: () => ({ auth: { verifyOtp } }) }));
vi.mock('./mode', () => ({ isDemo: () => false }));

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

describe('toAuthError — a mail provider that refused the send', () => {
  it('is told apart from every other server error', () => {
    // Supabase answers 500 `unexpected_failure` when SMTP rejected it: a wrong password, an
    // unverified sending domain, a provider over quota. The athlete can do nothing about it, and
    // the owner has to be able to recognise it from a screenshot.
    const e = toAuthError({
      __isAuthError: true,
      name: 'AuthRetryableFetchError',
      status: 500,
      code: 'unexpected_failure',
      message: 'Error sending magic link email',
    });
    expect(e.reason).toBe('email_send_failed');
    expect(e.code).not.toBe('network');
  });

  it('leaves a plain server error alone', () => {
    const e = toAuthError({
      __isAuthError: true,
      name: 'AuthRetryableFetchError',
      status: 500,
      message: 'boom',
    });
    expect(e.reason).toBeUndefined();
  });

  it('still reads a dead connection as network', () => {
    const e = toAuthError({
      __isAuthError: true,
      name: 'AuthRetryableFetchError',
      status: 0,
      message: 'Failed to fetch',
    });
    expect(e.code).toBe('network');
    expect(e.reason).toBeUndefined();
  });
});

/*
 * The project may have "Confirm email" left on (docs/SETUP.md §3.1 allows it). A brand-new address
 * then gets a *signup* token rather than an email OTP, and the athlete — holding a letter with six
 * correct digits in it — is told the code is wrong. This is the retry that stops that.
 */
describe('verifyCode — a signup token is still a code', () => {
  const EMAIL = 'nastia@example.com';
  const CODE = '123456';

  beforeEach(() => {
    verifyOtp.mockReset();
  });

  it('sends the code as an email OTP and asks nothing else when that works', async () => {
    verifyOtp.mockResolvedValueOnce({ error: null });
    await expect(verifyCode(EMAIL, CODE)).resolves.toBeUndefined();
    expect(verifyOtp).toHaveBeenCalledTimes(1);
    expect(verifyOtp).toHaveBeenCalledWith({ email: EMAIL, token: CODE, type: 'email' });
  });

  it('retries a refused token as a signup token, and signs the athlete in', async () => {
    verifyOtp
      .mockResolvedValueOnce({ error: authApiError('otp_expired', 403, 'Token has expired') })
      .mockResolvedValueOnce({ error: null });
    await expect(verifyCode(EMAIL, CODE)).resolves.toBeUndefined();
    expect(verifyOtp).toHaveBeenCalledTimes(2);
    expect(verifyOtp).toHaveBeenLastCalledWith({ email: EMAIL, token: CODE, type: 'signup' });
  });

  it('reports the first failure when the code is genuinely wrong', async () => {
    const refused = { error: authApiError('otp_expired', 403, 'Token has expired') };
    verifyOtp.mockResolvedValue(refused);
    await expect(verifyCode(EMAIL, CODE)).rejects.toMatchObject({ reason: 'invalid_code' });
    expect(verifyOtp).toHaveBeenCalledTimes(2);
  });

  it('never retries a rate limit — that would spend the quota it is complaining about', async () => {
    verifyOtp.mockResolvedValueOnce({ error: authApiError('over_request_rate_limit', 429) });
    await expect(verifyCode(EMAIL, CODE)).rejects.toMatchObject({ reason: 'rate_limited' });
    expect(verifyOtp).toHaveBeenCalledTimes(1);
  });

  it('never retries a mail-provider failure — the token was never the problem', async () => {
    verifyOtp.mockResolvedValueOnce({
      error: authApiError('unexpected_failure', 500, 'Error sending confirmation email'),
    });
    await expect(verifyCode(EMAIL, CODE)).rejects.toMatchObject({ reason: 'email_send_failed' });
    expect(verifyOtp).toHaveBeenCalledTimes(1);
  });

  it('rejects a code that is not six digits without asking the server at all', async () => {
    await expect(verifyCode(EMAIL, '12345')).rejects.toMatchObject({ reason: 'invalid_code' });
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});
