import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

/** Purchases as cards: email, course, status badge, dates, note and the allowed actions. */
export function PurchaseList({ rows, busyId, onAction }: PurchaseListProps) {
  const { t, locale } = useT();
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id}>
          <Card padding="sm" className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-medium">{row.email}</span>
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
            <div className="flex gap-2">
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
          </Card>
        </li>
      ))}
    </ul>
  );
}
