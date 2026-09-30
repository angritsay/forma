/**
 * The payments journal as ruled rows, the same ledger as purchases and subscriptions: amount
 * leading in the display face, then what it was for and through which till, then the address as
 * it was typed at checkout — the one fact that explains why most payments did not match.
 *
 * Buttons only where there is something to decide: an unmatched payment for something that can be
 * opened gets «Привязать к человеку» and, until somebody has decided, «Отметить как разобранный».
 * A session paid for with no time on the calendar gets «Записать на время» (0056), and «Возврат
 * сделан» when the money went back instead (0058). Money that opened nothing may be a session paid
 * at the wrong amount, so an unmatched course payment also gets «Это занятие» (0058).
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
  canBookAsSession,
  canBookSession,
  canDismiss,
  canRefundSession,
  formatMoney,
  INTENT_LABEL,
  paymentState,
  STATE_LABEL,
  type PaymentState,
} from './model';

/* The lit stamps are the states that ask for something: money that opened nothing, and a session
   paid for with no time on the calendar. */
const STATE_TONE: Record<PaymentState, BadgeTone> = {
  unclaimed: 'warning',
  applied: 'neutral',
  bound: 'neutral',
  dismissed: 'neutral',
  session: 'neutral',
  sessionUnbooked: 'warning',
  sessionClosed: 'neutral',
};

export interface PaymentListProps {
  rows: readonly PaymentRow[];
  busyId: string | null;
  /** The row a Telegram link pointed at; drawn with a frame so the eye lands on it. */
  highlightId?: string | null;
  onBind: (row: PaymentRow) => void;
  onDismiss: (row: PaymentRow) => void;
  /**
   * «Записать на время» for a paid session with no time (0056), and «Это занятие» for an
   * unmatched course payment (0058) — the same sheet, which tells the two apart by the intent.
   */
  onBook: (row: PaymentRow) => void;
  /** «Возврат сделан» for a paid session with no time (0058). */
  onRefund: (row: PaymentRow) => void;
}

export function PaymentList({
  rows,
  busyId,
  highlightId,
  onBind,
  onDismiss,
  onBook,
  onRefund,
}: PaymentListProps) {
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
                    {canBookAsSession(row) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId !== null}
                        onClick={() => onBook(row)}
                      >
                        {t('app.adminPayAsSession')}
                      </Button>
                    ) : null}
                  </div>
                ) : canBookSession(row) ? (
                  <div className="flex flex-wrap gap-2 lg:shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      loading={busyId === row.id}
                      disabled={busyId !== null && busyId !== row.id}
                      onClick={() => onBook(row)}
                    >
                      {t('app.adminPayBook')}
                    </Button>
                    {canRefundSession(row) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId !== null}
                        onClick={() => onRefund(row)}
                      >
                        {t('app.adminPayRefund')}
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
