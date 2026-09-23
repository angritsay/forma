/**
 * Demo double of «Сегодня» and «Платежи» (0044).
 *
 * The browser-local demo has no payments journal — nothing in it takes money — so the journal is
 * empty and the two payment buttons answer «not found», exactly as the server would for an id it
 * does not have. «Сегодня» counts what the demo does hold (sign-ups, club joins, proofs, bookings),
 * and ending a subscription works on the demo's subscriptions like the RPC does.
 */
import { needsCoachLook } from '@/lib/marathon/review';
import { AppError } from '../errors';
import { guard } from '../internal';
import type {
  AdminToday,
  BindResult,
  PaymentFilter,
  PaymentPage,
  TodayItem,
  TodaySection,
} from '../adminPayments';
import { delay } from './latency';
import { currentDemoUser, mutateDb, nowIso, readDb } from './store';

async function run<T>(fn: () => T): Promise<T> {
  await delay();
  return guard(async () => {
    if (!currentDemoUser()) throw new AppError('auth', 'not_signed_in');
    return fn();
  });
}

const DAY_MS = 86_400_000;

function item(email: string, at: string, extra: Partial<TodayItem> = {}): TodayItem {
  return {
    id: null,
    email,
    name: null,
    at,
    amount: null,
    currency: null,
    intent: null,
    provider: null,
    marathonId: null,
    duo: false,
    day: null,
    ...extra,
  };
}

function section(items: TodayItem[]): TodaySection {
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));
  return { count: sorted.length, latest: sorted.slice(0, 3) };
}

/** Moscow calendar day of an instant, as the server's `at time zone 'Europe/Moscow'` does. */
function moscowDay(iso: string): string {
  return new Date(Date.parse(iso) + 3 * 3_600_000).toISOString().slice(0, 10);
}

export async function getAdminToday(): Promise<AdminToday> {
  return run(() => {
    const db = readDb();
    const since = new Date(Date.now() - DAY_MS).toISOString();
    // The demo runs one round and it stands in for the club (see `listMyMarathons`).
    const clubs = new Map(db.marathons.map((m) => [m.id, m]));
    const members = new Map(db.marathonMembers.map((m) => [m.id, m]));

    const waiting = db.marathonSubmissions.filter((s) => needsCoachLook(s));
    const proofClubs = new Set(waiting.map((s) => s.marathonId));
    const today = moscowDay(nowIso());

    return {
      signups: section(
        db.profiles
          .filter((p) => p.created_at > since)
          .map((p) => item(p.email, p.created_at, { name: p.display_name })),
      ),
      payments: section([]),
      clubJoins: section(
        db.marathonMembers
          .filter((m) => m.status === 'active' && m.createdAt > since && clubs.has(m.marathonId))
          .map((m) =>
            item(m.email, m.createdAt, {
              name: m.displayName,
              marathonId: m.marathonId,
              duo: (clubs.get(m.marathonId)?.teamSize ?? 1) > 1,
            }),
          ),
      ),
      proofs: {
        ...section(
          waiting.map((s) =>
            item(members.get(s.memberId)?.email ?? '', s.submittedAt, {
              marathonId: s.marathonId,
              day: s.dayIndex,
            }),
          ),
        ),
        marathonId: proofClubs.size === 1 ? ([...proofClubs][0] ?? null) : null,
      },
      unclaimed: section([]),
      support: { count: 0, mode: 'none' },
      bookings: (() => {
        const rows = db.coachBookings
          .filter((b) => b.status === 'active' && moscowDay(b.starts_at) === today)
          .map((b) => item(b.email, b.starts_at, { name: b.event_name }))
          .sort((a, b) => a.at.localeCompare(b.at));
        return { count: rows.length, latest: rows.slice(0, 3) };
      })(),
    };
  });
}

export async function listPayments(
  _filter: PaymentFilter,
  _offset = 0,
  _id: string | null = null,
): Promise<PaymentPage> {
  return run(() => ({ rows: [], total: 0 }));
}

export async function bindPayment(
  _paymentId: string,
  _email: string,
  _courseId: string | null = null,
): Promise<BindResult> {
  return run(() => {
    throw new AppError('not_found', 'not_found');
  });
}

export async function dismissPayment(_paymentId: string, _note?: string): Promise<void> {
  return run(() => {
    throw new AppError('not_found', 'not_found');
  });
}

/** Mirrors admin_end_subscription(): access ends now; a refund gets its own status. */
export async function endSubscription(email: string, refund: boolean): Promise<void> {
  return run(() => {
    const clean = email.trim().toLowerCase();
    mutateDb((db) => {
      const row = db.subscriptions.find((s) => s.email.toLowerCase() === clean);
      if (!row) throw new AppError('not_found', 'not_found');
      const now = nowIso();
      row.status = refund ? 'refunded' : 'cancelled';
      row.expires_at = row.expires_at && row.expires_at < now ? row.expires_at : now;
      row.updated_at = now;
    });
  });
}
