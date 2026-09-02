/**
 * Email one-time-code auth over Supabase (docs/SPEC.md §8, §10 flow 1).
 *
 * Failures are thrown as `AuthError` — an `AppError` (src/lib/api/errors.ts) with an extra
 * `reason` the auth screen maps to precise copy (bad email, rate limit, wrong/expired code…).
 */
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { AppError, toAppError, type AppErrorCode } from './errors';

export type AuthReason = 'invalid_email' | 'rate_limited' | 'invalid_code' | 'signup_disabled';

export class AuthError extends AppError {
  readonly reason: AuthReason | undefined;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: { cause?: unknown; status?: number; reason?: AuthReason },
  ) {
    super(code, message, options);
    this.name = 'AuthError';
    this.reason = options?.reason;
  }
}

export function isAuthError(e: unknown): e is AuthError {
  return e instanceof AuthError;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.length <= 254 && EMAIL_RE.test(e);
}

export function isValidCode(token: string): boolean {
  return /^\d{6}$/.test(token);
}

interface AuthApiLike {
  code?: unknown;
  status?: unknown;
  message?: unknown;
}

/** Derive the user-facing reason from the underlying auth-js error (structural, no SDK import). */
function reasonFrom(cause: unknown): AuthReason | undefined {
  if (typeof cause !== 'object' || cause === null) return undefined;
  const { code, status, message } = cause as AuthApiLike;
  switch (code) {
    case 'otp_expired':
    case 'otp_disabled':
    case 'invalid_credentials':
      return 'invalid_code';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
    case 'over_sms_send_rate_limit':
      return 'rate_limited';
    case 'validation_failed':
    case 'email_address_invalid':
      return 'invalid_email';
    case 'signup_disabled':
    case 'email_address_not_authorized':
    case 'email_provider_disabled':
      return 'signup_disabled';
    default:
      break;
  }
  if (status === 429) return 'rate_limited';
  if (status === 403 && typeof message === 'string' && /token|otp|expired|invalid/i.test(message)) {
    return 'invalid_code';
  }
  return undefined;
}

/** Normalize anything thrown by supabase-js / fetch / our own code into an `AuthError`. */
export function toAuthError(e: unknown): AuthError {
  if (isAuthError(e)) return e;
  const app = toAppError(e);
  const reason = reasonFrom(app.cause ?? e);
  return new AuthError(app.code, app.message, {
    cause: app.cause ?? e,
    status: app.status,
    reason,
  });
}

/** Step 1: send a 6-digit code to the email (creates the user when new). */
export async function requestCode(email: string): Promise<void> {
  const clean = normalizeEmail(email);
  if (!isValidEmail(clean)) {
    throw new AuthError('validation', 'Invalid email', { reason: 'invalid_email' });
  }
  const { error } = await supabase().auth.signInWithOtp({
    email: clean,
    options: { shouldCreateUser: true },
  });
  if (error) throw toAuthError(error);
}

/** Step 2: exchange the code for a session. */
export async function verifyCode(email: string, token: string): Promise<void> {
  const clean = normalizeEmail(email);
  const code = token.replace(/\D/g, '');
  if (!isValidCode(code)) {
    throw new AuthError('validation', 'Invalid code', { reason: 'invalid_code' });
  }
  const { error } = await supabase().auth.verifyOtp({ email: clean, token: code, type: 'email' });
  if (error) throw toAuthError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase().auth.signOut();
  if (error) throw toAuthError(error);
}

/** Persisted auth session, or null when signed out. */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase().auth.getSession();
  if (error) throw toAuthError(error);
  return data.session;
}

/** Server-verified user, or null when there is no session. */
export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase().auth.getUser();
  if (error) {
    const app = toAuthError(error);
    if (app.code === 'auth') return null;
    throw app;
  }
  return data.user;
}

export type AuthChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

/** Subscribe to auth changes; returns the unsubscribe function. */
export function onAuthChange(cb: AuthChangeCallback): () => void {
  const {
    data: { subscription },
  } = supabase().auth.onAuthStateChange((event, session) => cb(event, session));
  return () => subscription.unsubscribe();
}
