/**
 * «Записи» (admins only, 0045): the one-to-one sessions people booked with the coach, read from his
 * Google Calendar by `google-calendar-sync`.
 *
 * Times are Moscow time, labelled so, whatever the phone says: she arranges the coach's day, and a
 * booking shown in her own zone while travelling would be an hour off in the one place it matters.
 *
 * «Синхронизировать сейчас» runs the same function the schedule runs, with her own sign-in. When
 * the calendar is not connected the function says 503, and the screen keeps that explanation on
 * screen rather than in a toast: it names the secrets and the button that fixes it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import {
  listAdminBookings,
  syncCalendarNow,
  type AdminBooking,
  type BookingScope,
} from '@/lib/api/adminInbox';
import { BootScreen } from '@/app/components/BootScreen';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { bookingSourceKey, formatMoscow, syncMessage } from '@/app/features/admin/inbox';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';

export default function AdminBookingsScreen() {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const admin = useIsAdmin();

  const [scope, setScope] = useState<BookingScope>('upcoming');
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(
    (which: BookingScope) => {
      const id = ++request.current;
      setLoading(true);
      listAdminBookings(which)
        .then((list) => {
          if (id === request.current) setRows(list);
        })
        .catch((e: unknown) => {
          if (id === request.current) {
            toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsLoadError') });
          }
        })
        .finally(() => {
          if (id === request.current) setLoading(false);
        });
    },
    [toast, tr],
  );

  useEffect(() => {
    if (admin) load(scope);
  }, [admin, scope, load]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/" replace />;

  const sync = async () => {
    setSyncing(true);
    setProblem(null);
    try {
      const outcome = await syncCalendarNow();
      const message = syncMessage(outcome);
      const text = t(message.key, message.params);
      if (message.tone === 'error') {
        setProblem(text);
      } else {
        toast.show({ kind: message.tone, title: text });
      }
      if (outcome.kind === 'ok' || outcome.kind === 'partial') load(scope);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Screen header={<TopBar back title={t('app.bookingsTitle')} />}>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" fullWidth loading={syncing} onClick={() => void sync()}>
            {t('app.bookingsSync')}
          </Button>
          {problem ? (
            <p role="alert" className="text-sm leading-relaxed text-danger">
              {problem}
            </p>
          ) : (
            <p className="text-xs text-muted-2">{t('app.bookingsSyncHint')}</p>
          )}
        </div>
        <SegmentedControl<BookingScope>
          fullWidth
          label={t('app.bookingsTitle')}
          value={scope}
          onChange={setScope}
          options={[
            { value: 'upcoming', label: t('app.bookingsTabUpcoming') },
            { value: 'past', label: t('app.bookingsTabPast') },
            { value: 'cancelled', label: t('app.bookingsTabCancelled') },
          ]}
        />
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState
            title={t(scope === 'upcoming' ? 'app.bookingsEmptyUpcoming' : 'app.bookingsEmpty')}
            description={scope === 'upcoming' ? t('app.bookingsEmptyBody') : undefined}
          />
        ) : (
          <ul className="flex flex-col">
            {rows.map((row) => (
              <li key={row.id}>
                <BookingRow row={row} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}

function BookingRow({ row }: { row: AdminBooking }) {
  const { t, locale } = useT();
  const details = [
    row.minutes > 0 ? t('app.bookingsMinutes', { n: row.minutes }) : null,
    t(bookingSourceKey(row.source)),
    row.eventName,
  ].filter(Boolean);

  return (
    <article className="flex flex-col gap-2 border-t border-border py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display text-[15px] leading-[1.24]">
            {formatMoscow(row.startsAt, locale)}{' '}
            <span className="text-xs text-muted-2">{t('app.bookingsMsk')}</span>
          </span>
          <span className="truncate text-sm">{row.name ?? row.email}</span>
          {row.name ? <span className="truncate text-xs text-muted">{row.email}</span> : null}
        </div>
        <Badge tone={row.status === 'active' ? 'inverse' : 'neutral'}>
          {t(row.status === 'active' ? 'app.bookingsStatusActive' : 'app.bookingsStatusCancelled')}
        </Badge>
      </div>
      <span className="text-xs text-muted-2">{details.join(' · ')}</span>
      {row.cancelReason && row.status === 'cancelled' ? (
        <span className="text-xs text-muted">{row.cancelReason}</span>
      ) : null}
      {row.joinUrl && row.status === 'active' ? (
        <a
          href={row.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="control-label self-start text-[11px] text-muted underline-offset-4 hover:text-text hover:underline"
        >
          {t('app.bookingsJoin')}
        </a>
      ) : null}
    </article>
  );
}
