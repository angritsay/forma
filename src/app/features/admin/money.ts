/**
 * Arithmetic of the money reports (0063): totals per month, churn, money per channel.
 *
 * The database returns rows per month × currency × intent (and per channel × currency); the
 * folding lives here for the reason the funnel's does (`funnel.ts`): demo and production must read
 * the same rows the same way, and the rules — currencies are never added together, a month with
 * nobody paying before it has no churn rather than 0% — are decisions that need a test.
 */
import type { MemberMonthRow, MoneyMonthRow, SourceRow } from '@/lib/api/types';

/** The till's own currency. Everything else is shown beside it, never converted into it. */
export const HOME_CURRENCY = 'RUB';

export interface CurrencyAmount {
  currency: string;
  amount: number;
}

export interface MoneyMonth {
  month: string;
  /** Home currency first, then the rest by code. */
  amounts: CurrencyAmount[];
  payments: number;
  /** Payments that were their payer's first ever: new paying people this month. */
  newPayers: number;
  /** Money in the home currency, by what was bought. */
  homeByIntent: Record<string, number>;
}

function byCurrency(a: CurrencyAmount, b: CurrencyAmount): number {
  if (a.currency === b.currency) return 0;
  if (a.currency === HOME_CURRENCY) return -1;
  if (b.currency === HOME_CURRENCY) return 1;
  return a.currency.localeCompare(b.currency);
}

function addTo(list: CurrencyAmount[], currency: string, amount: number): void {
  const hit = list.find((x) => x.currency === currency);
  if (hit) hit.amount += amount;
  else list.push({ currency, amount });
}

/** Rows folded into one entry per month, newest first. */
export function moneyMonths(rows: readonly MoneyMonthRow[]): MoneyMonth[] {
  const out = new Map<string, MoneyMonth>();
  for (const r of rows) {
    const m = out.get(r.month) ?? {
      month: r.month,
      amounts: [],
      payments: 0,
      newPayers: 0,
      homeByIntent: {},
    };
    addTo(m.amounts, r.currency, r.amount);
    m.payments += r.payments;
    m.newPayers += r.firstPayments;
    if (r.currency === HOME_CURRENCY) {
      m.homeByIntent[r.intent] = (m.homeByIntent[r.intent] ?? 0) + r.amount;
    }
    out.set(r.month, m);
  }
  const months = [...out.values()];
  for (const m of months) m.amounts.sort(byCurrency);
  return months.sort((a, b) => b.month.localeCompare(a.month));
}

export interface MemberMonth {
  month: string;
  /** Every currency together: a member is a person, whatever they paid in. */
  members: number;
  monthly: number;
  annual: number;
  lost: number;
  /** `lost` as a share of the previous month's members, or null when there were none. */
  churn: number | null;
  mrr: CurrencyAmount[];
}

/** Rows folded into one entry per month, newest first, with churn against the month before. */
export function memberMonths(rows: readonly MemberMonthRow[]): MemberMonth[] {
  const out = new Map<string, MemberMonth>();
  for (const r of rows) {
    const m = out.get(r.month) ?? {
      month: r.month,
      members: 0,
      monthly: 0,
      annual: 0,
      lost: 0,
      churn: null,
      mrr: [],
    };
    m.members += r.members;
    m.monthly += r.monthly;
    m.annual += r.annual;
    m.lost += r.lost;
    if (r.mrr > 0) addTo(m.mrr, r.currency, r.mrr);
    out.set(r.month, m);
  }
  const months = [...out.values()].sort((a, b) => b.month.localeCompare(a.month));
  for (const m of months) {
    m.mrr.sort(byCurrency);
    const prev = out.get(previousMonth(m.month));
    m.churn = prev && prev.members > 0 ? m.lost / prev.members : null;
  }
  return months;
}

/** `2026-03-01` → `2026-02-01`. */
export function previousMonth(month: string): string {
  const y = Number(month.slice(0, 4));
  const mo = Number(month.slice(5, 7));
  const py = mo === 1 ? y - 1 : y;
  const pm = mo === 1 ? 12 : mo - 1;
  return `${py}-${String(pm).padStart(2, '0')}-01`;
}

export interface SourceTotal {
  source: string;
  people: number;
  trained: number;
  paid: number;
  /** `paid / people`, 0…1, or null for a channel with nobody in it. */
  conversion: number | null;
  amounts: CurrencyAmount[];
}

/** One entry per channel, the biggest first; a channel's currencies stay apart. */
export function sourceTotals(rows: readonly SourceRow[]): SourceTotal[] {
  const out = new Map<string, SourceTotal>();
  for (const r of rows) {
    const s = out.get(r.source) ?? {
      source: r.source,
      // The counts repeat on every currency row of a channel; they are taken once.
      people: r.people,
      trained: r.trained,
      paid: r.paid,
      conversion: null,
      amounts: [],
    };
    if (r.currency && r.amount > 0) addTo(s.amounts, r.currency, r.amount);
    out.set(r.source, s);
  }
  const list = [...out.values()];
  for (const s of list) {
    s.amounts.sort(byCurrency);
    s.conversion = s.people > 0 ? s.paid / s.people : null;
  }
  return list.sort((a, b) => b.people - a.people || a.source.localeCompare(b.source));
}

/**
 * «12 990 ₽», «$190». A code Intl does not know (`???`) is printed as a plain number with the code
 * after it, rather than thrown on.
 */
export function formatMoney(locale: string, amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  }
}

/** Several currencies on one line: «12 990 ₽ · $190», or «—» when there is no money. */
export function formatAmounts(locale: string, amounts: readonly CurrencyAmount[]): string {
  const shown = amounts.filter((a) => a.amount > 0);
  if (shown.length === 0) return '—';
  return shown.map((a) => formatMoney(locale, a.amount, a.currency)).join(' · ');
}
