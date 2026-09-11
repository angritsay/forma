import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, type TKey } from '@/i18n/index';
import { subscriptionLive } from '@/lib/api/mappers';
import type { SubscriptionRow, SubscriptionStatus } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { rowIndex } from './PurchaseList';

export const SUB_STATUS_LABEL: Record<SubscriptionStatus, TKey> = {
  pending: 'app.adminSubStatusPending',
  active: 'app.adminSubStatusActive',
  cancelled: 'app.adminSubStatusCancelled',
};

/* The live subscription is the one white stamp; pending and cancelled are outlines. */
const SUB_STATUS_TONE: Record<SubscriptionStatus, BadgeTone> = {
  pending: 'neutral',
  active: 'inverse',
  cancelled: 'neutral',
};

/** What the coach can do from a row: extend (any state), cancel (only while renewals matter). */
export type SubscriptionAction = 'extend_month' | 'extend_year' | 'cancel';

export interface SubscriptionListProps {
  rows: readonly SubscriptionRow[];
  busyId: string | null;
  onAction: (row: SubscriptionRow, action: SubscriptionAction) => void;
}

/** Subscriptions as ruled rows: email, plan, status badge, end of access, source, note, actions. */
export function SubscriptionList({ rows, busyId, onAction }: SubscriptionListProps) {
  const { t, locale } = useT();
  return (
    <ul className="flex flex-col">
      {rows.map((row, i) => {
        const live = subscriptionLive(row.status, row.expiresAt);
        const plan = row.plan === 'annual' ? t('app.planAnnual') : t('app.planMonthly');
        const until = row.expiresAt
          ? live
            ? t('app.adminSubUntil', { date: formatDate(locale, row.expiresAt, 'long') })
            : `${t('app.adminSubExpired')} ${formatDate(locale, row.expiresAt, 'long')}`
          : null;
        return (
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
                      {plan}
                      {until ? ` · ${until}` : ''}
                    </span>
                    <span className="text-xs text-muted-2">
                      {t('app.adminCreated', { date: formatDate(locale, row.createdAt, 'long') })}
                      {row.source ? ` · ${row.source}` : ''}
                      {row.providerRef ? ` · ${row.providerRef}` : ''}
                    </span>
                    {row.note ? <span className="text-xs text-muted">{row.note}</span> : null}
                  </div>
                  <Badge tone={live ? SUB_STATUS_TONE[row.status] : 'neutral'}>
                    {t(SUB_STATUS_LABEL[row.status])}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 lg:shrink-0 lg:flex-nowrap">
                  <Button
                    size="sm"
                    variant={live ? 'secondary' : 'primary'}
                    loading={busyId === row.id}
                    disabled={busyId !== null && busyId !== row.id}
                    onClick={() => onAction(row, 'extend_month')}
                  >
                    {row.status === 'pending'
                      ? t('app.adminSubActivate')
                      : t('app.adminSubExtendMonth')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId !== null}
                    onClick={() => onAction(row, 'extend_year')}
                  >
                    {t('app.adminSubExtendYear')}
                  </Button>
                  {row.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyId !== null}
                      onClick={() => onAction(row, 'cancel')}
                    >
                      {t('app.adminSubCancel')}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
