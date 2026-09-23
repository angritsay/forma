/**
 * Pure helpers for «Сегодня» and «Платежи» (0044): what a payment row says, which buttons it
 * gets, how an error from the bind reads, and where each «Сегодня» row leads.
 *
 * The admin home keeps its tab in the URL (`/admin?tab=payments&filter=unclaimed&id=…`) so a link
 * from Telegram or from the stats screen lands on the right list; the parsing lives here so a bad
 * value in a hand-typed link falls back instead of breaking the screen.
 */
import { isAppError } from '@/lib/api/errors';
import {
  PAYMENT_FILTERS,
  type AdminToday,
  type PaymentFilter,
  type PaymentIntent,
  type PaymentRow,
} from '@/lib/api/adminPayments';
import type { Locale } from '@/content/schema';
import type { TKey } from '@/i18n/index';

export const ADMIN_TABS = ['purchases', 'subscriptions', 'payments', 'people'] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

export function adminTabFrom(value: string | null, plansEnabled: boolean): AdminTab {
  const tab = ADMIN_TABS.find((t) => t === value) ?? 'purchases';
  return tab === 'subscriptions' && !plansEnabled ? 'purchases' : tab;
}

export function paymentFilterFrom(value: string | null): PaymentFilter {
  return PAYMENT_FILTERS.find((f) => f === value) ?? 'unclaimed';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A payment id from a link, or null — an id that is not a uuid would only make the RPC fail. */
export function paymentIdFrom(value: string | null): string | null {
  return value && UUID_RE.test(value) ? value.toLowerCase() : null;
}

/** The admin home on a tab, as a router path. */
export function adminHref(
  tab: AdminTab,
  extra: { filter?: PaymentFilter; id?: string } = {},
): string {
  const q = new URLSearchParams({ tab });
  if (extra.filter) q.set('filter', extra.filter);
  if (extra.id) q.set('id', extra.id);
  return `/admin?${q.toString()}`;
}

export const INTENT_LABEL: Record<PaymentIntent, TKey> = {
  monthly: 'app.adminPayIntentMonthly',
  annual: 'app.adminPayIntentAnnual',
  course: 'app.adminPayIntentCourse',
  session: 'app.adminPayIntentSession',
};

export type PaymentState = 'unclaimed' | 'applied' | 'bound' | 'dismissed' | 'session';

/** One word for where a payment stands; the badge on its row. */
export function paymentState(row: PaymentRow): PaymentState {
  if (row.intent === 'session') return 'session';
  if (row.resolution === 'bound') return 'bound';
  if (row.applied) return 'applied';
  if (row.resolution === 'dismissed') return 'dismissed';
  return 'unclaimed';
}

export const STATE_LABEL: Record<PaymentState, TKey> = {
  unclaimed: 'app.adminPayStateUnclaimed',
  applied: 'app.adminPayStateApplied',
  bound: 'app.adminPayStateBound',
  dismissed: 'app.adminPayStateDismissed',
  session: 'app.adminPayStateSession',
};

/** Money came, access did not open, and the payment is for something that can be opened. */
export function canBind(row: PaymentRow): boolean {
  return !row.applied && row.intent !== 'session';
}

/** Same, and nobody has decided about it yet. */
export function canDismiss(row: PaymentRow): boolean {
  return canBind(row) && row.resolution === null;
}

/**
 * «3 990 ₽», «$19». A row without a currency predates 0043, when only Prodamus wrote the journal —
 * roubles; a lava.top row without one is shown as the bare number rather than guessed.
 */
export function formatMoney(
  locale: Locale,
  amount: number | null,
  currency: string | null,
  provider: string | null = null,
): string {
  if (amount === null) return '—';
  const code = currency ?? (provider === 'lava' ? null : 'RUB');
  const tag = locale === 'ru' ? 'ru-RU' : 'en-US';
  if (code) {
    try {
      return new Intl.NumberFormat(tag, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        minimumFractionDigits: 0,
      }).format(amount);
    } catch {
      /* An unknown code: fall through to «19 XYZ». */
    }
  }
  const n = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 }).format(amount);
  return code ? `${n} ${code}` : n;
}

/** What the bind's refusal means to the person pressing the button, or null for the generic text. */
export function bindErrorKey(e: unknown): TKey | null {
  if (!isAppError(e)) return null;
  switch (e.message) {
    case 'no_order':
      return 'app.adminPayErrNoOrder';
    case 'already_applied':
      return 'app.adminPayErrApplied';
    case 'session_payment':
      return 'app.adminPayErrSession';
    case 'invalid_course':
      return 'app.adminPayErrCourse';
    case 'invalid_email':
      return 'app.adminInvalidEmail';
    default:
      return null;
  }
}

// --- «Сегодня» -------------------------------------------------------------------

export type TodayKey =
  'unclaimed' | 'proofs' | 'support' | 'bookings' | 'payments' | 'signups' | 'clubJoins';

export interface TodayRow {
  key: TodayKey;
  count: number;
  /** Where the row leads. Support and bookings screens live at their own paths. */
  to: string;
  /** Waits for a decision: its number is lit while it is above zero. */
  task: boolean;
}

/**
 * The rows of the «Сегодня» card, tasks first: what waits for her before what merely happened.
 * A club link goes to the one club the items belong to when there is one, else to the list.
 */
export function todayRows(today: AdminToday): TodayRow[] {
  const club = (id: string | null | undefined, tab: string) =>
    id ? `/admin/marathons/${encodeURIComponent(id)}?tab=${tab}` : '/admin/marathons';
  return [
    {
      key: 'unclaimed',
      count: today.unclaimed.count,
      to: adminHref('payments', { filter: 'unclaimed' }),
      task: true,
    },
    {
      key: 'proofs',
      count: today.proofs.count,
      to: club(today.proofs.marathonId, 'proofs'),
      task: true,
    },
    {
      key: 'support',
      count: today.support.count,
      to: '/admin/support',
      task: today.support.mode === 'unanswered',
    },
    { key: 'bookings', count: today.bookings.count, to: '/admin/bookings', task: false },
    {
      key: 'payments',
      count: today.payments.count,
      to: adminHref('payments', { filter: 'all' }),
      task: false,
    },
    { key: 'signups', count: today.signups.count, to: adminHref('people'), task: false },
    {
      key: 'clubJoins',
      count: today.clubJoins.count,
      to: club(today.clubJoins.latest[0]?.marathonId, 'people'),
      task: false,
    },
  ];
}
