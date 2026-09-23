/**
 * «Сегодня» and «Платежи» (0044): what happened in the last day, the payments journal, and the
 * three buttons that act on money — bind a payment to a person, mark it dealt with, end a
 * subscription now (with or without a refund). Every call is re-checked by `is_admin()`.
 *
 * The mappers are exported and pure so the shapes are tested without a database; the RPCs return
 * snake_case rows and jsonb, and numbers from Postgres can arrive as strings (`numeric`, `bigint`).
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { COURSE_ID_RE, EMAIL_RE, guard, unwrap, unwrapVoid } from './internal';
import { isDemo } from './mode';

// --- types ---------------------------------------------------------------------

export const PAYMENT_FILTERS = ['unclaimed', 'all', 'sessions'] as const;
export type PaymentFilter = (typeof PAYMENT_FILTERS)[number];

export type PaymentIntent = 'monthly' | 'annual' | 'course' | 'session';
export type PaymentResolution = 'bound' | 'dismissed';

/** One row of the payments journal, as the admin sees it. */
export interface PaymentRow {
  id: string;
  /** The address as typed at checkout — not necessarily anybody's account. */
  email: string;
  amount: number | null;
  /** ISO code; null on rows written before 0043 (those are roubles, Prodamus). */
  currency: string | null;
  intent: PaymentIntent;
  /** prodamus / lava; null on rows written before 0038. */
  provider: string | null;
  providerRef: string | null;
  paidAt: string;
  /** Access was opened for it — by the webhook, a claim or a bind. */
  applied: boolean;
  claimedAt: string | null;
  /** The account that claimed it with «оплатил(а) с другой почты», or the bound person's. */
  accountEmail: string | null;
  resolution: PaymentResolution | null;
  resolvedAt: string | null;
  boundEmail: string | null;
  resolveNote: string | null;
  /** The course this payment opened, found by its order number. */
  courseId: string | null;
  /** Somebody has signed in with the checkout address. */
  hasAccount: boolean;
}

export interface PaymentPage {
  rows: PaymentRow[];
  /** Rows under the filter in total, for «показать ещё». */
  total: number;
}

export interface TodayItem {
  id: string | null;
  email: string;
  name: string | null;
  at: string;
  amount: number | null;
  currency: string | null;
  intent: PaymentIntent | null;
  provider: string | null;
  marathonId: string | null;
  duo: boolean;
  day: number | null;
}

export interface TodaySection {
  count: number;
  latest: TodayItem[];
}

/**
 * `unanswered` — 0045 is in and this is the inbox's «new» count; `recent` — support messages in
 * the last day (no status to count by yet); `none` — no support table at all.
 */
export type SupportMode = 'unanswered' | 'recent' | 'none';

export interface AdminToday {
  signups: TodaySection;
  payments: TodaySection;
  clubJoins: TodaySection;
  /** Resubmitted proofs waiting for the coach; `marathonId` when they are all in one club. */
  proofs: TodaySection & { marathonId: string | null };
  unclaimed: TodaySection;
  support: { count: number; mode: SupportMode };
  bookings: TodaySection;
}

export type BindResult = 'subscription' | 'course';

// --- mappers -------------------------------------------------------------------

type Num = number | string | null | undefined;

const num = (v: Num): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const int = (v: Num): number => Math.max(0, Math.trunc(num(v) ?? 0));
const text = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

const INTENTS: readonly PaymentIntent[] = ['monthly', 'annual', 'course', 'session'];
const asIntent = (v: unknown): PaymentIntent | null =>
  INTENTS.includes(v as PaymentIntent) ? (v as PaymentIntent) : null;

/** The shape `admin_payments()` returns. */
export interface DbPaymentRow {
  id: string;
  email: string;
  amount: Num;
  currency: string | null;
  intent: string;
  provider: string | null;
  provider_ref: string | null;
  paid_at: string;
  applied: boolean;
  claimed_at: string | null;
  account_email: string | null;
  resolution: string | null;
  resolved_at: string | null;
  bound_email: string | null;
  resolve_note: string | null;
  course_id: string | null;
  has_account: boolean;
  total: Num;
}

export function paymentFromDb(r: DbPaymentRow): PaymentRow {
  return {
    id: r.id,
    email: r.email,
    amount: num(r.amount),
    currency: text(r.currency),
    // The column is checked in SQL; an unknown value would be a newer server, read as a course.
    intent: asIntent(r.intent) ?? 'course',
    provider: text(r.provider),
    providerRef: text(r.provider_ref),
    paidAt: r.paid_at,
    applied: r.applied === true,
    claimedAt: r.claimed_at ?? null,
    accountEmail: text(r.account_email),
    resolution: r.resolution === 'bound' || r.resolution === 'dismissed' ? r.resolution : null,
    resolvedAt: r.resolved_at ?? null,
    boundEmail: text(r.bound_email),
    resolveNote: text(r.resolve_note),
    courseId: text(r.course_id),
    hasAccount: r.has_account === true,
  };
}

export function paymentPageFromDb(rows: readonly DbPaymentRow[]): PaymentPage {
  return { rows: rows.map(paymentFromDb), total: rows.length ? int(rows[0]?.total) : 0 };
}

function record(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function itemFromDb(v: unknown): TodayItem | null {
  const r = record(v);
  const email = text(r.email);
  const at = text(r.at);
  if (!email || !at) return null;
  return {
    id: text(r.id),
    email,
    name: text(r.name),
    at,
    amount: num(r.amount as Num),
    currency: text(r.currency),
    intent: asIntent(r.intent),
    provider: text(r.provider),
    marathonId: text(r.marathonId),
    duo: r.duo === true,
    day: num(r.day as Num),
  };
}

function sectionFromDb(v: unknown): TodaySection {
  const r = record(v);
  const latest = Array.isArray(r.latest) ? r.latest : [];
  return {
    count: int(r.count as Num),
    latest: latest.map(itemFromDb).filter((x): x is TodayItem => x !== null),
  };
}

/** `admin_today()` jsonb → typed; a missing section reads as zero, never as a crash. */
export function adminTodayFromDb(v: unknown): AdminToday {
  const r = record(v);
  const support = record(r.support);
  const mode = support.mode;
  return {
    signups: sectionFromDb(r.signups),
    payments: sectionFromDb(r.payments),
    clubJoins: sectionFromDb(r.clubJoins),
    proofs: { ...sectionFromDb(r.proofs), marathonId: text(record(r.proofs).marathonId) },
    unclaimed: sectionFromDb(r.unclaimed),
    support: {
      count: int(support.count as Num),
      mode: mode === 'unanswered' || mode === 'recent' ? mode : 'none',
    },
    bookings: sectionFromDb(r.bookings),
  };
}

// --- calls ---------------------------------------------------------------------

export async function getAdminToday(): Promise<AdminToday> {
  if (isDemo()) return (await demo()).getAdminToday();
  return guard(async () => {
    const { data, error } = await supabase().rpc('admin_today');
    if (error) throw error;
    return adminTodayFromDb(data);
  });
}

export const PAYMENTS_PAGE = 50;

/** The journal, newest first; `id` returns just that one payment whatever the filter. */
export async function listPayments(
  filter: PaymentFilter,
  offset = 0,
  id: string | null = null,
): Promise<PaymentPage> {
  if (isDemo()) return (await demo()).listPayments(filter, offset, id);
  return guard(async () => {
    if (!PAYMENT_FILTERS.includes(filter)) throw new AppError('validation', 'invalid_filter');
    const rows = unwrap<DbPaymentRow[]>(
      await supabase().rpc('admin_payments', {
        p_filter: filter,
        p_limit: PAYMENTS_PAGE,
        p_offset: Math.max(0, offset),
        p_id: id,
      }),
    );
    return paymentPageFromDb(rows);
  });
}

/**
 * Open access for an unapplied payment to `email` (RPC `admin_bind_payment`). For a course payment
 * `courseId` names the course; without it the person's single pending order decides, and with no
 * such order the server answers `no_order`.
 */
export async function bindPayment(
  paymentId: string,
  email: string,
  courseId: string | null = null,
): Promise<BindResult> {
  if (isDemo()) return (await demo()).bindPayment(paymentId, email, courseId);
  return guard(async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) throw new AppError('validation', 'invalid_email');
    if (courseId !== null && !COURSE_ID_RE.test(courseId)) {
      throw new AppError('validation', 'invalid_course');
    }
    const result = unwrap<string>(
      await supabase().rpc('admin_bind_payment', {
        p_payment_id: paymentId,
        p_email: clean,
        p_course_id: courseId,
      }),
    );
    return result === 'subscription' ? 'subscription' : 'course';
  });
}

/** Mark a payment as dealt with, granting nothing (RPC `admin_dismiss_payment`). */
export async function dismissPayment(paymentId: string, note?: string): Promise<void> {
  if (isDemo()) return (await demo()).dismissPayment(paymentId, note);
  return guard(async () => {
    unwrapVoid(
      await supabase().rpc('admin_dismiss_payment', {
        p_payment_id: paymentId,
        p_note: note?.trim() || null,
      }),
    );
  });
}

/**
 * End the subscription of `email` right now (RPC `admin_end_subscription`); `refund` marks it
 * refunded. A subscription is one per address, so the address is the key — the person page calls
 * the same RPC. The money itself goes back by hand in Prodamus or lava.top; nothing here moves it.
 */
export async function endSubscription(email: string, refund: boolean): Promise<void> {
  if (isDemo()) return (await demo()).endSubscription(email, refund);
  return guard(async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) throw new AppError('validation', 'invalid_email');
    unwrapVoid(
      await supabase().rpc('admin_end_subscription', { p_email: clean, p_refund: refund }),
    );
  });
}
