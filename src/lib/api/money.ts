/**
 * Money and channels (0063): what came in each month, who pays for the club at each month's end,
 * which channel brings people who pay — and the one write behind the channels, the person's own
 * first touch.
 *
 * The database returns counts and sums per month × currency × intent; the arithmetic on top
 * (totals, churn, conversion) lives in `src/app/features/admin/money.ts`, so demo and production
 * read the same rows the same way — the rule the funnel follows (0025).
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, requireUser, unwrap } from './internal';
import { isDemo } from './mode';
import type { MemberMonthRow, MoneyMonthRow, SourceRow } from './types';

/** The shape `profiles.first_source` accepts (0063), and the one `forma.src` is written in. */
export const SOURCE_RE = /^[a-z0-9_-]{1,40}$/;

const int = (v: number | string | null | undefined): number => Number(v) || 0;
const num = (v: number | string | null | undefined): number => Number(v) || 0;

interface DbMoneyMonth {
  month: string;
  currency: string;
  intent: string;
  payments: number;
  amount: number | string;
  first_payments: number;
}

/** Payments per month (Moscow), currency and intent, newest month first. */
export async function listMoneyMonths(months = 12): Promise<MoneyMonthRow[]> {
  if (isDemo()) return (await demo()).listMoneyMonths(months);
  return guard(async () => {
    const rows = unwrap<DbMoneyMonth[]>(
      await supabase().rpc('admin_money_months', { p_months: months }),
    );
    return rows.map((r) => ({
      month: r.month.slice(0, 10),
      currency: r.currency,
      intent: r.intent,
      payments: int(r.payments),
      amount: num(r.amount),
      firstPayments: int(r.first_payments),
    }));
  });
}

interface DbMemberMonth {
  month: string;
  currency: string;
  members: number;
  monthly: number;
  annual: number;
  mrr: number | string;
  lost: number;
}

/** Paying club members at each month's end (now for the current month), per currency. */
export async function listMemberMonths(months = 12): Promise<MemberMonthRow[]> {
  if (isDemo()) return (await demo()).listMemberMonths(months);
  return guard(async () => {
    const rows = unwrap<DbMemberMonth[]>(
      await supabase().rpc('admin_members_months', { p_months: months }),
    );
    return rows.map((r) => ({
      month: r.month.slice(0, 10),
      currency: r.currency,
      members: int(r.members),
      monthly: int(r.monthly),
      annual: int(r.annual),
      mrr: num(r.mrr),
      lost: int(r.lost),
    }));
  });
}

interface DbSource {
  source: string;
  people: number;
  trained: number;
  paid: number;
  currency: string | null;
  amount: number | string;
}

/** Per channel, the people who signed up in the last `days`: one row per channel and currency. */
export async function listSources(days = 90): Promise<SourceRow[]> {
  if (isDemo()) return (await demo()).listSources(days);
  return guard(async () => {
    const rows = unwrap<DbSource[]>(await supabase().rpc('admin_sources', { p_days: days }));
    return rows.map((r) => ({
      source: r.source,
      people: int(r.people),
      trained: int(r.trained),
      paid: int(r.paid),
      currency: r.currency,
      amount: num(r.amount),
    }));
  });
}

/**
 * Write the person's first touch to their profile, once. True when it was written; false when the
 * profile already had one or the label is not in our shape (nothing is sent for those).
 */
export async function saveFirstSource(source: string): Promise<boolean> {
  if (!SOURCE_RE.test(source)) return false;
  if (isDemo()) return (await demo()).saveFirstSource(source);
  return guard(async () => {
    await requireUser();
    return unwrap<boolean>(await supabase().rpc('set_my_first_source', { p_source: source }));
  });
}
