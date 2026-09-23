/**
 * The person page (0046): one address, everything the admin knows about it, in one call.
 *
 * `admin_person(p_email)` answers with a single JSON object rather than a row set, so the shape
 * can grow on the server without a signature change. The price is that nothing here is typed by
 * PostgREST: every field is read defensively by {@link adminPersonFromDb}, and a field that is
 * missing or of the wrong type turns into its empty value instead of an exception. A page that
 * shows «—» for one field is better than a page that shows an error for all of them.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { EMAIL_RE, guard, unwrap, unwrapVoid } from './internal';
import { isDemo } from './mode';
import type { PurchaseStatus, SubscriptionPlan, SubscriptionStatus } from './types';

export interface AdminPersonProfile {
  displayName: string | null;
  locale: 'ru' | 'en';
  createdAt: string;
  onboardedAt: string | null;
  fitnessLevel: number | null;
  telegramLinked: boolean;
}

export interface AdminPersonPurchase {
  id: string;
  courseId: string;
  status: PurchaseStatus;
  source: string | null;
  note: string | null;
  createdAt: string;
  activatedAt: string | null;
}

export interface AdminPersonSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
  source: string | null;
  note: string | null;
  /** Access right now, by `subscription_live()` — a cancelled one is live until it expires. */
  live: boolean;
}

export interface AdminPersonPartner {
  email: string;
  displayName: string | null;
}

export interface AdminPersonMembership {
  memberId: string;
  marathonId: string;
  marathonTitle: string;
  isClub: boolean;
  solo: boolean;
  status: 'active' | 'removed';
  joinedAt: string;
  teamName: string | null;
  partners: AdminPersonPartner[];
}

export interface AdminPersonProof {
  id: string;
  marathonTitle: string;
  isClub: boolean;
  dayIndex: number;
  taskTitle: string;
  submittedAt: string;
  voidedAt: string | null;
  voidReason: string | null;
  attempt: number;
  reviewedAt: string | null;
}

export interface AdminPersonAssigned {
  workoutId: string;
  shortId: string;
  title: string;
  titleEn: string | null;
  note: string | null;
  assignedAt: string;
  done: boolean;
}

export interface AdminPersonActivity {
  /** Completed sessions. */
  sessions: number;
  /** Every session ever started, finished or not. */
  started: number;
  /** Distinct own days with a completed session. */
  days: number;
  points: number;
  lastCompletedAt: string | null;
}

export interface AdminPersonSession {
  id: string;
  courseId: string;
  nodeId: string;
  workoutId: string;
  /** Title of a coach-built workout (`course_id = 'custom'`); null for course sessions. */
  customTitle: string | null;
  points: number;
  feeling: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AdminPersonSupport {
  id: string;
  channel: string;
  /** False when the rate limit turned it away. */
  accepted: boolean;
  createdAt: string;
  /** Present only if a later migration adds a status to support rows. */
  status: string | null;
}

export interface AdminPersonPayment {
  id: string;
  /** The address typed at checkout — often not the account's own. */
  email: string;
  amount: number | null;
  currency: string | null;
  intent: string;
  provider: string | null;
  providerRef: string | null;
  paidAt: string;
  applied: boolean;
  claimedAt: string | null;
}

export interface AdminPerson {
  email: string;
  /** Null when nobody has signed in with this address yet. */
  profile: AdminPersonProfile | null;
  purchases: AdminPersonPurchase[];
  subscription: AdminPersonSubscription | null;
  clubAccess: boolean;
  memberships: AdminPersonMembership[];
  proofs: AdminPersonProof[];
  assigned: AdminPersonAssigned[];
  activity: AdminPersonActivity;
  sessions: AdminPersonSession[];
  support: AdminPersonSupport[];
  paymentEmails: string[];
  payments: AdminPersonPayment[];
  /** `admin_end_subscription(p_email)` exists on this database. */
  canEndSubscription: boolean;
}

// --- reading an untyped payload -----------------------------------------------

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
const bool = (v: unknown): boolean => v === true;
function num(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}
/** Array elements that are objects, mapped; anything else in the array is dropped. */
function list<T>(v: unknown, map: (o: Obj) => T): T[] {
  return Array.isArray(v) ? v.filter(isObj).map(map) : [];
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/** The `admin_person()` payload → the page's model. Tolerates missing and malformed fields. */
export function adminPersonFromDb(raw: unknown): AdminPerson {
  const r = isObj(raw) ? raw : {};
  const p = isObj(r.profile) ? r.profile : null;
  const s = isObj(r.subscription) ? r.subscription : null;
  const a = isObj(r.activity) ? r.activity : {};
  return {
    email: str(r.email),
    profile: p
      ? {
          displayName: strOrNull(p.display_name),
          locale: p.locale === 'en' ? 'en' : 'ru',
          createdAt: str(p.created_at),
          onboardedAt: strOrNull(p.onboarded_at),
          fitnessLevel: numOrNull(p.fitness_level),
          telegramLinked: bool(p.telegram_linked),
        }
      : null,
    purchases: list(r.purchases, (o) => ({
      id: str(o.id),
      courseId: str(o.course_id),
      status: oneOf(o.status, ['pending', 'active', 'refunded'] as const, 'pending'),
      source: strOrNull(o.source),
      note: strOrNull(o.note),
      createdAt: str(o.created_at),
      activatedAt: strOrNull(o.activated_at),
    })),
    subscription: s
      ? {
          id: str(s.id),
          plan: oneOf(s.plan, ['monthly', 'annual'] as const, 'monthly'),
          status: oneOf(s.status, ['pending', 'active', 'cancelled'] as const, 'pending'),
          startedAt: strOrNull(s.started_at),
          expiresAt: strOrNull(s.expires_at),
          source: strOrNull(s.source),
          note: strOrNull(s.note),
          live: bool(s.live),
        }
      : null,
    clubAccess: bool(r.club_access),
    memberships: list(r.memberships, (o) => ({
      memberId: str(o.member_id),
      marathonId: str(o.marathon_id),
      marathonTitle: str(o.marathon_title),
      isClub: bool(o.is_club),
      solo: bool(o.solo),
      status: oneOf(o.status, ['active', 'removed'] as const, 'active'),
      joinedAt: str(o.joined_at),
      teamName: strOrNull(o.team_name),
      partners: list(o.partners, (x) => ({
        email: str(x.email),
        displayName: strOrNull(x.display_name),
      })),
    })),
    proofs: list(r.proofs, (o) => ({
      id: str(o.id),
      marathonTitle: str(o.marathon_title),
      isClub: bool(o.is_club),
      dayIndex: num(o.day_index),
      taskTitle: str(o.task_title),
      submittedAt: str(o.submitted_at),
      voidedAt: strOrNull(o.voided_at),
      voidReason: strOrNull(o.void_reason),
      attempt: Math.max(1, num(o.attempt)),
      reviewedAt: strOrNull(o.reviewed_at),
    })),
    assigned: list(r.assigned, (o) => ({
      workoutId: str(o.workout_id),
      shortId: str(o.short_id),
      title: str(o.title),
      titleEn: strOrNull(o.title_en),
      note: strOrNull(o.note),
      assignedAt: str(o.assigned_at),
      done: bool(o.done),
    })),
    activity: {
      sessions: num(a.sessions),
      started: num(a.started),
      days: num(a.days),
      points: num(a.points),
      lastCompletedAt: strOrNull(a.last_completed_at),
    },
    sessions: list(r.sessions, (o) => ({
      id: str(o.id),
      courseId: str(o.course_id),
      nodeId: str(o.node_id),
      workoutId: str(o.workout_id),
      customTitle: strOrNull(o.custom_title),
      points: num(o.points),
      feeling: strOrNull(o.feeling),
      startedAt: str(o.started_at),
      completedAt: strOrNull(o.completed_at),
    })),
    support: list(r.support, (o) => ({
      id: str(o.id),
      channel: str(o.channel),
      // A row without the column predates nothing: 0042 has always had it. Absent means accepted.
      accepted: o.accepted !== false,
      createdAt: str(o.created_at),
      status: strOrNull(o.status),
    })),
    paymentEmails: Array.isArray(r.payment_emails)
      ? r.payment_emails.filter((e): e is string => typeof e === 'string')
      : [],
    payments: list(r.payments, (o) => ({
      id: str(o.id),
      email: str(o.email),
      amount: numOrNull(o.amount),
      currency: strOrNull(o.currency),
      intent: str(o.intent),
      provider: strOrNull(o.provider),
      providerRef: strOrNull(o.provider_ref),
      paidAt: str(o.paid_at),
      applied: bool(o.applied),
      claimedAt: strOrNull(o.claimed_at),
    })),
    canEndSubscription: bool(r.can_end_subscription),
  };
}

// --- calls ------------------------------------------------------------------

function cleanEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) throw new AppError('validation', 'invalid_email');
  return clean;
}

/** Everything about one address (RPC `admin_person`, 0046). */
export async function getAdminPerson(email: string): Promise<AdminPerson> {
  const clean = cleanEmail(email);
  if (isDemo()) return adminPersonFromDb(await (await demo()).getAdminPerson(clean));
  return guard(async () =>
    adminPersonFromDb(unwrap<unknown>(await supabase().rpc('admin_person', { p_email: clean }))),
  );
}

/**
 * End a subscription's access now (RPC `admin_end_subscription`, added by another migration).
 * Only called when {@link AdminPerson.canEndSubscription} says the server has it.
 */
export async function endSubscription(email: string): Promise<void> {
  const clean = cleanEmail(email);
  if (isDemo()) throw new AppError('forbidden', 'demo_read_only');
  return guard(async () => {
    unwrapVoid(await supabase().rpc('admin_end_subscription', { p_email: clean }));
  });
}
