/**
 * The arithmetic of a creator's statement (0064, 0067), shared by «Кабинет автора» and «Авторы».
 *
 * The database answers per month × currency; the screens want «this month», «who owes whom», and
 * a line per month. Currencies stay apart here as everywhere in the money reports (0063).
 */
import type { CreatorStatementRow, CreatorStatus } from '@/lib/api/types';
import { HOME_CURRENCY } from '@/app/features/admin/money';

export interface MonthLine {
  month: string;
  /** Home currency first. */
  rows: CreatorStatementRow[];
}

/** One entry per month, newest first; the home currency leads each month. */
export function statementMonths(rows: readonly CreatorStatementRow[]): MonthLine[] {
  const out = new Map<string, CreatorStatementRow[]>();
  for (const r of rows) out.set(r.month, [...(out.get(r.month) ?? []), r]);
  return [...out.entries()]
    .map(([month, list]) => ({
      month,
      rows: [...list].sort((a, b) =>
        a.currency === b.currency
          ? 0
          : a.currency === HOME_CURRENCY
            ? -1
            : b.currency === HOME_CURRENCY
              ? 1
              : a.currency.localeCompare(b.currency),
      ),
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Sales of a month across currencies — courses and 1:1 sessions (0067): a count of payments, not
 * of money.
 */
export function salesCount(line: MonthLine | undefined): number {
  return line ? line.rows.reduce((n, r) => n + r.sales + r.sessionSales, 0) : 0;
}

/**
 * Who owes whom for a balance. Positive: the creator owes Forma (Pro). Negative: Forma owes the
 * creator (Start). Under one rouble either way is settled — rounding, not a debt.
 */
export function balanceSide(balance: number): 'creatorOwes' | 'formaOwes' | 'even' {
  if (balance >= 1) return 'creatorOwes';
  if (balance <= -1) return 'formaOwes';
  return 'even';
}

/** The states the creator's screen draws, from their row (or its absence). */
export type CreatorStage = 'none' | 'applied' | 'declined' | 'open';

export function creatorStage(status: CreatorStatus | null | undefined): CreatorStage {
  if (!status) return 'none';
  if (status === 'applied') return 'applied';
  if (status === 'declined') return 'declined';
  return 'open';
}

/** The page address a slug would take, for showing; not a link while public pages do not exist. */
export function creatorAddress(domain: string, slug: string): string {
  return `${domain.replace(/\/+$/, '')}/c/${slug}`;
}
