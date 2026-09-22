/**
 * Coach / admin operations. Every call is re-checked server-side by `is_admin()`.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { COURSE_ID_RE, EMAIL_RE, currentUser, guard, unwrap, unwrapVoid } from './internal';
import {
  purchaseFromDb,
  subscriptionRowFromDb,
  type DbPurchase,
  type DbSubscriptionRow,
} from './mappers';
import { isDemo } from './mode';
import type {
  AdminOverview,
  FunnelWeek,
  PersonRow,
  ProgressRow,
  PurchaseFilter,
  PurchaseRow,
  PurchaseStatus,
  SubscriptionChange,
  SubscriptionFilter,
  SubscriptionRow,
} from './types';

const STATUSES: readonly PurchaseStatus[] = ['pending', 'active', 'refunded'];

/** True when the signed-in email is in `admins`; false when signed out. */
export async function isAdmin(): Promise<boolean> {
  if (isDemo()) return (await demo()).isAdmin();
  return guard(async () => {
    const me = await currentUser();
    if (!me) return false;
    const { data, error } = await supabase().rpc('is_admin');
    if (error) throw error;
    return data === true;
  });
}

/** Purchases, newest first, optionally filtered by status and an email / course substring. */
export async function listPurchases(filter: PurchaseFilter = {}): Promise<PurchaseRow[]> {
  if (isDemo()) return (await demo()).listPurchases(filter);
  return guard(async () => {
    let query = supabase()
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (filter.status) query = query.eq('status', filter.status);
    // Only characters that are safe inside a PostgREST `or` filter.
    const term = (filter.search ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, '');
    if (term) query = query.or(`email.ilike.%${term}%,course_id.ilike.%${term}%`);
    const rows = unwrap<DbPurchase[]>(await query);
    return rows.map(purchaseFromDb);
  });
}

/** Activate / refund / reset a purchase (RPC `admin_set_purchase_status`). */
export async function setPurchaseStatus(id: string, status: PurchaseStatus): Promise<void> {
  if (isDemo()) return (await demo()).setPurchaseStatus(id, status);
  return guard(async () => {
    if (!STATUSES.includes(status)) throw new AppError('validation', 'invalid_status');
    unwrapVoid(await supabase().rpc('admin_set_purchase_status', { p_id: id, p_status: status }));
  });
}

/** Grant a course to an email manually (RPC `admin_add_purchase`); returns the purchase id. */
export async function addPurchase(email: string, courseId: string, note?: string): Promise<string> {
  if (isDemo()) return (await demo()).addPurchase(email, courseId, note);
  return guard(async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) throw new AppError('validation', 'invalid_email');
    if (!COURSE_ID_RE.test(courseId)) throw new AppError('validation', 'invalid_course');
    return unwrap<string>(
      await supabase().rpc('admin_add_purchase', {
        p_email: clean,
        p_course_id: courseId,
        p_note: note?.trim() || null,
      }),
    );
  });
}

/** Subscriptions, newest first, optionally filtered by status and an email substring. */
export async function listSubscriptions(
  filter: SubscriptionFilter = {},
): Promise<SubscriptionRow[]> {
  if (isDemo()) return (await demo()).listSubscriptions(filter);
  return guard(async () => {
    let query = supabase()
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (filter.status) query = query.eq('status', filter.status);
    const term = (filter.search ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, '');
    if (term) query = query.ilike('email', `%${term}%`);
    const rows = unwrap<DbSubscriptionRow[]>(await query);
    return rows.map(subscriptionRowFromDb);
  });
}

/** Grant, extend or cancel a subscription by hand (RPC `admin_set_subscription`); returns the row id. */
export async function setSubscription(change: SubscriptionChange): Promise<string> {
  if (isDemo()) return (await demo()).setSubscription(change);
  return guard(async () => {
    const clean = change.email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) throw new AppError('validation', 'invalid_email');
    if (change.plan !== 'monthly' && change.plan !== 'annual') {
      throw new AppError('validation', 'invalid_plan');
    }
    if (change.status !== 'active' && change.status !== 'cancelled') {
      throw new AppError('validation', 'invalid_status');
    }
    return unwrap<string>(
      await supabase().rpc('admin_set_subscription', {
        p_email: clean,
        p_plan: change.plan,
        p_status: change.status,
        p_expires_at: change.expiresAt ?? null,
        p_note: change.note?.trim() || null,
      }),
    );
  });
}

/** The shape `admin_people()` returns; snake_case, straight from Postgres. */
interface DbPerson {
  email: string;
  display_name: string | null;
  created_at: string;
  onboarded_at: string | null;
  courses: number;
  subscribed: boolean;
}

/**
 * Everybody who has confirmed a sign-in code, newest first, optionally filtered by a substring of
 * the address or the name.
 *
 * This exists so a grant is a choice from a list rather than an address typed from memory.
 * `admin_add_purchase` accepts any well-formed address on purpose — a pre-sale grant to somebody
 * who has not signed up yet is a real thing the coach does — so a typo cannot be caught there and
 * has to be designed out here instead.
 */
export async function listPeople(search = '', limit = 500): Promise<PersonRow[]> {
  if (isDemo()) return (await demo()).listPeople(search, limit);
  return guard(async () => {
    const rows = unwrap<DbPerson[]>(
      await supabase().rpc('admin_people', { p_search: search.trim() || null, p_limit: limit }),
    );
    return rows.map((r) => ({
      email: r.email,
      displayName: r.display_name,
      createdAt: r.created_at,
      onboardedAt: r.onboarded_at,
      courses: Number(r.courses) || 0,
      subscribed: r.subscribed === true,
    }));
  });
}

// --- analytics (0025) --------------------------------------------------------

interface DbOverview {
  people: number;
  onboarded: number;
  paying: number;
  subscribed: number;
  paid_never_signed_in: number;
  active_7d: number;
  active_28d: number;
}

interface DbFunnelWeek {
  week_start: string;
  signed_up: number;
  onboarded: number;
  trained: number;
  repeated: number;
  paid: number;
}

interface DbProgress {
  email: string;
  display_name: string | null;
  created_at: string;
  onboarded_at: string | null;
  workouts: number;
  days: number;
  points: number;
  last_workout_at: string | null;
  courses: number;
  subscribed: boolean;
}

const int = (v: number | string | null | undefined): number => Number(v) || 0;

/** The headline numbers: how many people there are and how many of them are alive right now. */
export async function getAdminOverview(): Promise<AdminOverview> {
  if (isDemo()) return (await demo()).getAdminOverview();
  return guard(async () => {
    // `returns table` with one row arrives as an array of one.
    const rows = unwrap<DbOverview[]>(await supabase().rpc('admin_overview'));
    const r = rows[0];
    if (!r) throw new AppError('unknown', 'no_overview');
    return {
      people: int(r.people),
      onboarded: int(r.onboarded),
      paying: int(r.paying),
      subscribed: int(r.subscribed),
      paidNeverSignedIn: int(r.paid_never_signed_in),
      active7d: int(r.active_7d),
      active28d: int(r.active_28d),
    };
  });
}

/**
 * The funnel by sign-up week, newest first.
 *
 * Every count is about the people who first signed in that week, whenever the step itself
 * happened — see `FunnelWeek`. The arithmetic on top of these rows lives in
 * `src/app/features/admin/funnel.ts`, not here and not in SQL, so demo and production read the
 * same numbers the same way.
 */
export async function listFunnel(weeks = 12): Promise<FunnelWeek[]> {
  if (isDemo()) return (await demo()).listFunnel(weeks);
  return guard(async () => {
    const rows = unwrap<DbFunnelWeek[]>(await supabase().rpc('admin_funnel', { p_weeks: weeks }));
    return rows.map((r) => ({
      weekStart: r.week_start,
      signedUp: int(r.signed_up),
      onboarded: int(r.onboarded),
      trained: int(r.trained),
      repeated: int(r.repeated),
      paid: int(r.paid),
    }));
  });
}

/** Everybody, by how recently they trained: the people behind the funnel's numbers. */
export async function listProgress(search = '', limit = 200): Promise<ProgressRow[]> {
  if (isDemo()) return (await demo()).listProgress(search, limit);
  return guard(async () => {
    const rows = unwrap<DbProgress[]>(
      await supabase().rpc('admin_progress', { p_search: search.trim() || null, p_limit: limit }),
    );
    return rows.map((r) => ({
      email: r.email,
      displayName: r.display_name,
      createdAt: r.created_at,
      onboardedAt: r.onboarded_at,
      workouts: int(r.workouts),
      days: int(r.days),
      points: int(r.points),
      lastWorkoutAt: r.last_workout_at,
      courses: int(r.courses),
      subscribed: r.subscribed === true,
    }));
  });
}
