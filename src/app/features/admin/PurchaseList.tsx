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

const STATUS_TONE: Record<PurchaseStatus, BadgeTone> = {
  pending: 'warning',
  active: 'success',
  refunded: 'neutral',
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

/**
 * Purchases as ruled rows: email, course, status badge, dates, note and the allowed actions.
 *
 * This is a work queue — a hundred of these in a column — so it is a ledger, not a stack of
 * cards. The email leads in the display face because it is what an admin scans for.
 */
export function PurchaseList({ rows, busyId, onAction }: PurchaseListProps) {
  const { t, locale } = useT();
  return (
    <ul className="flex flex-col">
      {rows.map((row) => (
        <li key={row.id}>
          <div className="flex flex-col gap-3 border-t border-border py-4 lg:flex-row lg:items-center lg:gap-6">
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
        </li>
      ))}
    </ul>
  );
}
