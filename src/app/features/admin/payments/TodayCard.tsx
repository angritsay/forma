/**
 * «Сегодня» — the first thing on `/admin`: what happened in the last day and what waits for her.
 *
 * The owner runs the product from her phone, and the question she opens the admin with is not
 * «show me every purchase ever» but «anything I need to do?». So the card lists the tasks first —
 * unmatched payments, proofs to review, unanswered messages — and lights their number while it is
 * above zero; then what merely happened. Every row is a link to the list that answers it.
 *
 * Rows stay on the card at zero, muted: a card whose rows come and go has to be read every time,
 * while a card with fixed rows is read by glancing at the numbers.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber, type TKey } from '@/i18n/index';
import { getAdminToday, type AdminToday, type TodayItem } from '@/lib/api/adminPayments';
import { useT } from '@/app/hooks/useT';
import { formatMoney, INTENT_LABEL, todayRows, type TodayKey } from './model';

const LABEL: Record<Exclude<TodayKey, 'support'>, TKey> = {
  unclaimed: 'app.adminTodayUnclaimed',
  proofs: 'app.adminTodayProofs',
  bookings: 'app.adminTodayBookings',
  payments: 'app.adminTodayPayments',
  signups: 'app.adminTodaySignups',
  clubJoins: 'app.adminTodayClubJoins',
};

export interface TodayCardProps {
  /** Bumped by the screen's refresh; the card reloads with the lists. */
  reloadKey: number;
}

export function TodayCard({ reloadKey }: TodayCardProps) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const [today, setToday] = useState<AdminToday | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    getAdminToday()
      .then((v) => {
        if (alive) setToday(v);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey, retry]);

  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      // The server's «today» is the Moscow day; the times on the card are the same clock.
      timeZone: 'Europe/Moscow',
    }).format(new Date(iso));

  const who = (x: TodayItem) => x.name?.trim() || x.email;

  /** One muted line under a row: the latest one or two things behind its number. */
  const detail = (key: TodayKey, v: AdminToday): string => {
    const two = (items: TodayItem[], f: (x: TodayItem) => string) =>
      items.slice(0, 2).map(f).join(', ');
    switch (key) {
      case 'unclaimed':
        return two(
          v.unclaimed.latest,
          (x) => `${formatMoney(locale, x.amount, x.currency, x.provider)} · ${x.email}`,
        );
      case 'payments':
        return two(v.payments.latest, (x) =>
          [
            formatMoney(locale, x.amount, x.currency, x.provider),
            x.intent ? t(INTENT_LABEL[x.intent]) : '',
          ]
            .filter(Boolean)
            .join(' · '),
        );
      case 'proofs':
        return two(v.proofs.latest, (x) =>
          x.day !== null ? `${x.email} · ${t('app.adminTodayDay', { n: x.day })}` : x.email,
        );
      case 'bookings':
        return two(v.bookings.latest, (x) => `${time(x.at)} · ${x.email}`);
      case 'signups':
        return two(v.signups.latest, who);
      case 'clubJoins':
        return two(v.clubJoins.latest, (x) =>
          x.duo ? `${who(x)} (${t('app.adminTodayDuo')})` : who(x),
        );
      case 'support':
        return '';
    }
  };

  return (
    <section
      aria-labelledby="admin-today-title"
      className="flex flex-col rounded-card border border-border bg-surface px-4 pt-3.5 pb-1"
    >
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 id="admin-today-title" className="font-display text-xl">
          {t('app.adminTodayTitle')}
        </h2>
        <span className="eyebrow text-muted-2">{t('app.adminTodayHint')}</span>
      </div>

      {failed ? (
        <div className="flex items-center justify-between gap-3 border-t border-border py-3">
          <span className="text-[14px] text-muted">{t('app.adminTodayError')}</span>
          <Button size="sm" variant="secondary" onClick={() => setRetry((n) => n + 1)}>
            {t('common.retry')}
          </Button>
        </div>
      ) : !today ? (
        <div className="flex flex-col gap-2 py-2" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} rounded="control" className="h-10" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {todayRows(today).map((row) => {
            const label =
              row.key === 'support'
                ? t(
                    today.support.mode === 'unanswered'
                      ? 'app.adminTodaySupportUnanswered'
                      : 'app.adminTodaySupportRecent',
                  )
                : t(LABEL[row.key]);
            const sub = row.count > 0 ? detail(row.key, today) : '';
            const lit = row.task && row.count > 0;
            return (
              <li key={row.key}>
                <button
                  type="button"
                  onClick={() => navigate(row.to)}
                  className="flex min-h-12 w-full items-center gap-3 border-t border-border py-2.5 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 active:bg-surface-3"
                >
                  <span
                    className={clsx(
                      'font-display tabular w-9 shrink-0 text-right text-[20px] leading-none',
                      lit ? 'text-warning' : row.count > 0 ? 'text-text' : 'text-muted-2',
                    )}
                  >
                    {formatNumber(locale, row.count)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={clsx(
                        'truncate text-[15px] leading-tight',
                        row.count > 0 ? 'text-text' : 'text-muted',
                      )}
                    >
                      {label}
                    </span>
                    {sub ? (
                      <span className="truncate text-[12px] leading-tight text-muted-2">{sub}</span>
                    ) : null}
                  </span>
                  <Glyph size={16} className="shrink-0 text-muted-2">
                    ›
                  </Glyph>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
