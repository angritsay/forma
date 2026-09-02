/**
 * Shared plumbing for the API modules (not exported from the barrel).
 */
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';
import { AppError, toAppError } from './errors';

export interface CurrentUser {
  id: string;
  email: string;
}

/** Run an API call; every failure surfaces as AppError. */
export async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw toAppError(e);
  }
}

/** Signed-in user from the persisted session, or null. */
export async function currentUser(): Promise<CurrentUser | null> {
  const { data, error } = await supabase().auth.getSession();
  if (error) throw toAppError(error);
  const user = data.session?.user;
  if (!user) return null;
  return { id: user.id, email: (user.email ?? '').toLowerCase() };
}

/** Signed-in user or an `auth` AppError. RLS is the real guard; this gives a clear client error. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) throw new AppError('auth', 'not_signed_in');
  return user;
}

interface Result<T> {
  data: T | null;
  error: PostgrestError | null;
}

/** Throw on PostgREST error or missing data. */
export function unwrap<T>(res: Result<T>): T {
  if (res.error) throw toAppError(res.error);
  if (res.data === null || res.data === undefined) throw new AppError('not_found', 'not_found');
  return res.data;
}

/** Throw on PostgREST error; null data is a valid "no row". */
export function unwrapMaybe<T>(res: Result<T>): T | null {
  if (res.error) throw toAppError(res.error);
  return res.data ?? null;
}

/** Throw on PostgREST error; ignore data (void RPCs). */
export function unwrapVoid(res: { error: PostgrestError | null }): void {
  if (res.error) throw toAppError(res.error);
}

/** Course ids are validated the same way as in SQL (`^[a-z0-9_]{2,40}$`). */
export const COURSE_ID_RE = /^[a-z0-9_]{2,40}$/;

/** Same regex family as create_order(); the server re-validates anyway. */
export const EMAIL_RE = /^[a-z0-9][a-z0-9._%+-]*@[a-z0-9.-]+\.[a-z]{2,24}$/i;

/** YYYY-MM-DD local date as produced by src/lib/util/dates.ts. */
export const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertLocalDate(value: string, field: string): void {
  if (!LOCAL_DATE_RE.test(value)) throw new AppError('validation', `invalid_${field}`);
}
