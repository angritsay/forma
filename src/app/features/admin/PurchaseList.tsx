import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, type TKey } from '@/i18n/index';
import type { PurchaseRow, PurchaseStatus } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { courseName, nextStatuses } from './model';

export const STATUS_LABEL: Record<PurchaseStatus, TKey> = {
  pending: 'app.adminStatusPending',
  active: 'app.adminStatusActive',
  refunded: 'app.adminStatusRefunded',
};

/*
 * One fill in the column: the active purchase is the white stamp, everything else is an outline.
 * A refund keeps its colour on the text alone, so a ledger of statuses reads as a list of words
 * with one thing lit rather than a row of coloured blocks.
 */
const STATUS_TONE: Record<PurchaseStatus, BadgeTone> = {
  pending: 'neutral',
  active: 'inverse',
  refunded: 'danger',
};

const ACTION_LABEL: Record<PurchaseStatus, TKey> = {
  pending: 'app.adminStatusPending',
  active: 'app.adminActivate',
  refunded: 'app.adminRefund',
};

export interface PurchaseListProps {
  rows: readonly PurchaseRow[];
  busyId: string | null;
  onAction: (row: PurchaseRow, status: PurchaseStatus) => void;
}

/** Row index as the brand sets it — 01, 02 … — padded so a column of them aligns. */
export const rowIndex = (i: number): string => String(i + 1).padStart(2, '0');

/**
 * Purchases as ruled rows: email, course, status badge, dates, note and the allowed actions.
 *
 * This is a work queue — a hundred of these in a column — so it is a ledger, not a stack of
 * cards: hairlines between rows, a numeral down the left, and the email leading in the display
 * face because it is what an admin scans for.
 */
export function PurchaseList({ rows, busyId, onAction }: PurchaseListProps) {
  const { t, locale } = useT();
  return (
    <ul className="flex flex-col">
      {rows.map((row, i) => (
        <li key={row.id}>
          <div className="flex gap-4 border-t border-border py-4">
            <span className="numeral tabular w-7 shrink-0 pt-0.5 text-[13px] text-muted-2">
              {rowIndex(i)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-display truncate text-[15px] leading-[1.24]">
                    {row.email}
                  </span>
                  <span className="truncate text-sm text-muted">
                    {courseName(row.courseId, locale)}
                  </span>
                  <span className="text-xs text-muted-2">
                    {t('app.adminCreated', { date: formatDate(locale, row.createdAt, 'long') })}
                    {row.activatedAt
                      ? ` · ${t('app.adminActivated', { date: formatDate(locale, row.activatedAt, 'long') })}`
                      : ''}
                    {row.source ? ` · ${row.source}` : ''}
                  </span>
                  {row.note ? <span className="text-xs text-muted">{row.note}</span> : null}
                </div>
                <Badge tone={STATUS_TONE[row.status]}>{t(STATUS_LABEL[row.status])}</Badge>
              </div>
              <div className="flex gap-2 lg:shrink-0">
                {nextStatuses(row.status).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={status === 'refunded' ? 'danger' : 'secondary'}
                    loading={busyId === row.id}
                    disabled={busyId !== null && busyId !== row.id}
                    onClick={() => onAction(row, status)}
                  >
                    {t(ACTION_LABEL[status])}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
