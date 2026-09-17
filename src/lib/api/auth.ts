/**
 * Email one-time-code auth over Supabase (docs/SPEC.md §8, §10 flow 1).
 *
 * Failures are thrown as `AuthError` — an `AppError` (src/lib/api/errors.ts) with an extra
 * `reason` the auth screen maps to precise copy (bad email, rate limit, wrong/expired code…).
 */
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError, toAppError, type AppErrorCode } from './errors';
import { isDemo } from './mode';

export type AuthReason =
  /** The field was left empty. */
  | 'email_empty'
  /** There is no `@` at all — usually a phone number, a Telegram handle, or a half-typed address. */
  | 'email_no_at'
  /** Well-formed apart from the domain, which is one or two characters off a common one. */
  | 'email_typo'
  /** Shaped wrong in some other way, or refused by the server as a bad address. */
  | 'invalid_email'
  | 'rate_limited'
  /** The six digits were refused. */
  | 'invalid_code'
  /** The six digits were refused and the code is older than the OTP lifetime. */
  | 'code_expired'
  /** Several codes in a row were refused; asking for a fresh one is the way out. */
  | 'too_many_attempts'
  | 'signup_disabled'
  /** The server accepted the request and then could not send the letter — an SMTP problem. */
  | 'email_send_failed';

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

/**
 * How long a code stays good, in seconds — Email OTP expiration in docs/SETUP.md §3.1.
 *
 * Kept here because the screen needs it, not because the app enforces it: only Supabase decides
 * whether a token is still valid. Change the dashboard setting and change this line with it, or the
 * screen starts calling a live code expired.
 */
export const OTP_TTL_SEC = 600;

/**
 * The domains a Russian audience actually types, and the ones a slip lands next to.
 *
 * Only used to *suggest*. A typo is never a reason to refuse an address: people own mailboxes on
 * domains nobody has heard of, and a validator that knows better than its user is the worst kind.
 */
const COMMON_DOMAINS = [
  'gmail.com',
  'yandex.ru',
  'ya.ru',
  'mail.ru',
  'bk.ru',
  'inbox.ru',
  'list.ru',
  'internet.ru',
  'icloud.com',
  'me.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'rambler.ru',
  'proton.me',
  'protonmail.com',
  'yahoo.com',
] as const;

/**
 * Levenshtein distance, bounded: anything past `max` stops early and answers `max + 1`.
 *
 * One row of the edit matrix, updated in place: `row[j]` is the distance between the first `i`
 * characters of `a` and the first `j` of `b`. The cell the in-place write is about to destroy is
 * carried in `diagonal`, and the cell to the left in `left`, so each step reads the array once.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const row: number[] = [];
  for (let j = 0; j <= b.length; j++) row.push(j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = i - 1;
    let left = i;
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j] ?? j;
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      const value = Math.min(above + 1, left + 1, diagonal + cost);
      diagonal = above;
      left = value;
      row[j] = value;
      if (value < best) best = value;
    }
    // No later row can beat this row's best cell, so passing `max` here is final.
    if (best > max) return max + 1;
  }
  return row[b.length] ?? max + 1;
}

/**
 * The common domain an address was probably aiming at, or null when it looks deliberate.
 *
 * The tolerance is tied to length so a short domain cannot absorb a whole syllable: `ya.ru` only
 * matches at one edit, `gmail.com` at two. An exact match answers null — there is nothing to fix.
 */
export function suggestEmailDomain(email: string): string | null {
  const at = normalizeEmail(email).lastIndexOf('@');
  if (at < 0) return null;
  const domain = normalizeEmail(email).slice(at + 1);
  if (!domain) return null;
  let best: { domain: string; distance: number } | null = null;
  for (const candidate of COMMON_DOMAINS) {
    if (candidate === domain) return null;
    /*
     * The first character has to match. Without it a five-character domain is one edit away from
     * half the alphabet — `ma.ru` came out as "did you mean ya.ru?" — and the cost of being wrong
     * is a line under the field telling somebody their own mailbox is a typo. Slips land on the
     * letters people reach for at speed, not on the one they started the word with.
     */
    if (candidate.charAt(0) !== domain.charAt(0)) continue;
    // Two edits only once there is enough domain for two edits to still leave a resemblance —
    // and the shorter of the pair decides, so `ma.ru` is not "did you mean mail.ru?".
    const max = Math.min(candidate.length, domain.length) <= 6 ? 1 : 2;
    const distance = editDistance(domain, candidate, max);
    if (distance > max) continue;
    if (!best || distance < best.distance) best = { domain: candidate, distance };
  }
  return best ? best.domain : null;
}

/** What is wrong with what was typed, precise enough for the screen to say it. */
export type EmailCheck =
  | { ok: true; email: string }
  | { ok: false; reason: 'email_empty' | 'email_no_at' | 'invalid_email' }
  | { ok: false; reason: 'email_typo'; suggestion: string };

/**
 * Read an address the way a person would: empty, missing the `@`, shaped wrong, or a slipped
 * domain. `isValidEmail` still answers the yes/no question; this answers "and say why".
 */
export function checkEmail(raw: string): EmailCheck {
  const email = normalizeEmail(raw);
  if (!email) return { ok: false, reason: 'email_empty' };
  if (!email.includes('@')) return { ok: false, reason: 'email_no_at' };
  if (!isValidEmail(email)) return { ok: false, reason: 'invalid_email' };
  const suggestion = suggestEmailDomain(email);
  if (suggestion) return { ok: false, reason: 'email_typo', suggestion };
  return { ok: true, email };
}

/** The local part with a different domain — what the typo hint offers to put in the field. */
export function withDomain(email: string, domain: string): string {
  const clean = normalizeEmail(email);
  const at = clean.lastIndexOf('@');
  return at < 0 ? `${clean}@${domain}` : `${clean.slice(0, at)}@${domain}`;
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
    /*
     * `otp_expired` does NOT mean expired. Supabase returns it for "Token has expired or is
     * invalid" — the same code for six digits that were mistyped and for six digits that have been
     * sitting in an inbox all day. So it maps to the same reason as any other refusal, and the
     * screen tells the two apart by the clock instead: it knows when it asked for the code, and
     * `OTP_TTL_SEC` is how long one lives. Reading expiry off this code would call a mistyped
     * digit "expired" and send people to ask for a letter they already have.
     */
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
  /*
   * Supabase answers 500 `unexpected_failure` when the mail provider refused the send — a wrong
   * SMTP password, an unverified sending domain, a provider over its quota. It is worth telling
   * apart from every other server error: it is the one the athlete can do nothing about, and the
   * one the owner has to be able to recognise from a screenshot.
   */
  const saysSending = typeof message === 'string' && /send|smtp|mail/i.test(message);
  if (
    saysSending &&
    (code === 'unexpected_failure' || (typeof status === 'number' && status >= 500))
  ) {
    return 'email_send_failed';
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
  if (isDemo()) return (await demo()).requestCode(email);
  const clean = normalizeEmail(email);
  if (!isValidEmail(clean)) {
    const check = checkEmail(clean);
    const reason = check.ok ? 'invalid_email' : check.reason;
    throw new AuthError('validation', 'Invalid email', { reason });
  }
  const { error } = await supabase().auth.signInWithOtp({
    email: clean,
    options: { shouldCreateUser: true },
  });
  if (error) throw toAuthError(error);
}

/**
 * Demo mode only: the code the demo backend just issued, so the auth screen can print it —
 * there is no inbox to check. Always null with a real backend.
 */
export async function demoPendingCode(): Promise<string | null> {
  if (!isDemo()) return null;
  return (await demo()).pendingCode();
}

/**
 * Step 2: exchange the code for a session.
 *
 * Two attempts, and the second one exists for a real configuration rather than as a guess.
 *
 * The code normally arrives as an email OTP, which verifies as `type: 'email'`. But Supabase issues
 * a *signup* token instead when the project has "Confirm email" switched on and the address is
 * brand new — and docs/SETUP.md §3.1 explicitly allows a project to be left that way, as long as
 * the Confirm-signup template carries {{ .Token }}. Under that setting the athlete gets a letter,
 * reads six digits off it, types them in, and is told the code is wrong. Nothing on their side can
 * fix that, and nothing on the screen says why.
 *
 * So a rejected token is retried once as `type: 'signup'` before the code is called wrong. The
 * retry is deliberately narrow — only when the first failure was the token being refused. A rate
 * limit must not be retried (it would spend the quota it is complaining about) and a 5xx from the
 * mail provider has nothing to do with the token, so both surface immediately, as before.
 *
 * When both attempts fail the FIRST error is the one thrown: it describes the flow this app
 * actually asks for, and its reason is already `invalid_code`.
 */
export async function verifyCode(email: string, token: string): Promise<void> {
  if (isDemo()) return (await demo()).verifyCode(email, token);
  const clean = normalizeEmail(email);
  const code = token.replace(/\D/g, '');
  if (!isValidCode(code)) {
    throw new AuthError('validation', 'Invalid code', { reason: 'invalid_code' });
  }
  const { error } = await supabase().auth.verifyOtp({ email: clean, token: code, type: 'email' });
  if (!error) return;

  const first = toAuthError(error);
  if (first.reason !== 'invalid_code') throw first;

  const retry = await supabase().auth.verifyOtp({ email: clean, token: code, type: 'signup' });
  if (retry.error) throw first;
}

export async function signOut(): Promise<void> {
  if (isDemo()) return (await demo()).signOut();
  const { error } = await supabase().auth.signOut();
  if (error) throw toAuthError(error);
}

/** Persisted auth session, or null when signed out. */
export async function getSession(): Promise<Session | null> {
  if (isDemo()) return (await demo()).getSession();
  const { data, error } = await supabase().auth.getSession();
  if (error) throw toAuthError(error);
  return data.session;
}

/** Server-verified user, or null when there is no session. */
export async function getUser(): Promise<User | null> {
  if (isDemo()) return (await demo()).getUser();
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
  if (isDemo()) {
    // The demo backend is a lazy chunk, so the real subscription lands one tick later.
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    void demo().then((m) => {
      if (cancelled) return;
      unsubscribe = m.onAuthChange(cb);
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }
  const {
    data: { subscription },
  } = supabase().auth.onAuthStateChange((event, session) => cb(event, session));
  return () => subscription.unsubscribe();
}
