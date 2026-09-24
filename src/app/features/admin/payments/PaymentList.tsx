/**
 * The payments journal as ruled rows, the same ledger as purchases and subscriptions: amount
 * leading in the display face, then what it was for and through which till, then the address as
 * it was typed at checkout — the one fact that explains why most payments did not match.
 *
 * Buttons only where there is something to decide: an unmatched payment for something that can be
 * opened gets «Привязать к человеку» and, until somebody has decided, «Отметить как разобранный».
 */
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/i18n/index';
import type { PaymentRow } from '@/lib/api/adminPayments';
import { useT } from '@/app/hooks/useT';
import { courseName, sourceLabel } from '../model';
import { rowIndex } from '../PurchaseList';
import {
  canBind,
  canDismiss,
  formatMoney,
  INTENT_LABEL,
  paymentState,
  STATE_LABEL,
  type PaymentState,
} from './model';

/* The unmatched payment is the one lit stamp — it is the only state that asks for something. */
const STATE_TONE: Record<PaymentState, BadgeTone> = {
  unclaimed: 'warning',
  applied: 'neutral',
  bound: 'neutral',
  dismissed: 'neutral',
  session: 'neutral',
};

export interface PaymentListProps {
  rows: readonly PaymentRow[];
  busyId: string | null;
  /** The row a Telegram link pointed at; drawn with a frame so the eye lands on it. */
  highlightId?: string | null;
  onBind: (row: PaymentRow) => void;
  onDismiss: (row: PaymentRow) => void;
}

export function PaymentList({ rows, busyId, highlightId, onBind, onDismiss }: PaymentListProps) {
  const { t, locale } = useT();
  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <ul className="flex flex-col">
      {rows.map((row, i) => {
        const state = paymentState(row);
        const what = [
          t(INTENT_LABEL[row.intent]),
          row.courseId ? courseName(row.courseId, locale) : '',
          sourceLabel(t, row.provider) ?? '',
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={row.id}>
            <div
              className={
                row.id === highlightId
                  ? 'glass-card glass-card-3 flex gap-4 rounded-card px-3 py-4'
                  : 'flex gap-4 border-t border-border py-4'
              }
            >
              <span className="numeral tabular w-7 shrink-0 pt-0.5 text-[13px] text-muted-2">
                {rowIndex(i)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-display tabular text-[17px] leading-[1.24]">
                      {formatMoney(locale, row.amount, row.currency, row.provider)}
                    </span>
                    <span className="truncate text-sm text-muted">{what}</span>
                    <span className="text-[13px] break-all text-text">
                      {t('app.adminPayCheckoutEmail', { email: row.email })}
                      {!row.hasAccount && state === 'unclaimed' ? (
                        <span className="text-muted-2"> · {t('app.adminPayNoAccount')}</span>
                      ) : null}
                    </span>
                    {row.boundEmail ? (
                      <span className="text-[13px] break-all text-muted">
                        {t('app.adminPayBoundTo', { email: row.boundEmail })}
                      </span>
                    ) : row.accountEmail && row.accountEmail !== row.email ? (
                      <span className="text-[13px] break-all text-muted">
                        {t('app.adminPayClaimedBy', { email: row.accountEmail })}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-2">
                      {formatDate(locale, row.paidAt, 'long')}, {time(row.paidAt)}
                      {row.providerRef
                        ? ` · ${t('app.adminPayOrder', { ref: row.providerRef })}`
                        : ''}
                    </span>
                    {row.resolveNote ? (
                      <span className="text-xs text-muted">{row.resolveNote}</span>
                    ) : null}
                  </div>
                  <Badge tone={STATE_TONE[state]}>{t(STATE_LABEL[state])}</Badge>
                </div>
                {canBind(row) ? (
                  <div className="flex flex-wrap gap-2 lg:shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      loading={busyId === row.id}
                      disabled={busyId !== null && busyId !== row.id}
                      onClick={() => onBind(row)}
                    >
                      {t('app.adminPayBind')}
                    </Button>
                    {canDismiss(row) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId !== null}
                        onClick={() => onDismiss(row)}
                      >
                        {t('app.adminPayDismiss')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
