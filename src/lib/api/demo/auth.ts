/**
 * Demo auth: the same email → 6-digit code → session flow as Supabase OTP, but the code never
 * leaves the browser. `pendingCode()` hands it to the auth screen, which prints it in a
 * clearly-marked demo hint — there is no inbox to check.
 *
 * Errors are `AuthError` with the same `reason` values the real flow produces, so every error
 * state on the auth screen stays reachable.
 */
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { AuthError, isValidEmail, normalizeEmail } from '../auth';
import {
  currentDemoUser,
  pendingDemoCode,
  requestDemoCode,
  signOutDemo,
  verifyDemoCode,
  type DemoUser,
} from './store';
import { delay } from './latency';

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

const listeners = new Set<Listener>();

function emit(event: AuthChangeEvent, session: Session | null): void {
  for (const cb of [...listeners]) cb(event, session);
}

/** A Session in the shape the app reads: only `user.id` / `user.email` are ever used. */
function toSession(user: DemoUser): Session {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 60 * 60 * 24 * 365;
  return {
    access_token: `demo.${user.id}`,
    refresh_token: `demo.${user.id}.refresh`,
    expires_in: expiresIn,
    expires_at: now + expiresIn,
    token_type: 'bearer',
    user: toUser(user),
  };
}

function toUser(user: DemoUser): User {
  return {
    id: user.id,
    email: user.email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'demo' },
    user_metadata: {},
    created_at: new Date(0).toISOString(),
  };
}

export async function requestCode(email: string): Promise<void> {
  await delay();
  const clean = normalizeEmail(email);
  if (!isValidEmail(clean)) {
    throw new AuthError('validation', 'Invalid email', { reason: 'invalid_email' });
  }
  requestDemoCode(clean);
}

/** The code the demo just "sent", so the UI can show it. Null outside the code step. */
export function pendingCode(): string | null {
  return pendingDemoCode();
}

export async function verifyCode(email: string, token: string): Promise<void> {
  await delay();
  let user: DemoUser;
  try {
    user = verifyDemoCode(email, token);
  } catch {
    throw new AuthError('validation', 'Invalid code', { reason: 'invalid_code' });
  }
  emit('SIGNED_IN', toSession(user));
}

export async function signOut(): Promise<void> {
  await delay();
  signOutDemo();
  emit('SIGNED_OUT', null);
}

export async function getSession(): Promise<Session | null> {
  await delay();
  const user = currentDemoUser();
  return user ? toSession(user) : null;
}

export async function getUser(): Promise<User | null> {
  await delay();
  const user = currentDemoUser();
  return user ? toUser(user) : null;
}

export function onAuthChange(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
