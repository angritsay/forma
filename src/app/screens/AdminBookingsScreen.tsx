/**
 * «Записи» (admins only, 0045 → 0055): the sessions people booked with the coaches, and the
 * calendar those bookings are made from.
 *
 * Two views under one switch:
 *
 *   * **Записи** — the list, upcoming / past / cancelled, each row with its coach. An upcoming
 *     session can be moved to any future time the coach agreed to (`admin_move_booking`; never on
 *     top of another session) or cancelled (`admin_cancel_booking`; the row stays, money goes back
 *     by hand in the till if at all). Both reach the client as a bot message through the
 *     booking's own trigger. Later than 24 hours before a session this is the only way to move
 *     it: the client cannot any more, and writes here instead.
 *   * **Расписание** — per coach: the room link, the weekly hours and the per-date exceptions the
 *     client's picker is computed from (`CoachSchedule`).
 *
 * Times are Moscow time, labelled so, whatever the phone says: she arranges the coaches' days, and
 * a booking shown in her own zone while travelling would be an hour off in the one place it
 * matters. The move form asks for Moscow time for the same reason.
 *
 * «Синхронизировать сейчас» is gone with the Google calendar as the source of bookings: a session
 * is made in the app now, so there is nothing to read in. Old Google rows stay in the list as
 * history.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import {
  adminCancelBooking,
  adminMoveBooking,
  listCoaches,
  type AdminCoach,
} from '@/lib/api/adminCoaches';
import { listAdminBookings, type AdminBooking, type BookingScope } from '@/lib/api/adminInbox';
import { isAppError } from '@/lib/api/errors';
import { clockIn, dateIn, parseClock, wallToInstant } from '@/lib/coach/slots';
import { BootScreen } from '@/app/components/BootScreen';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { bookingSourceKey, COACH_TIME_ZONE, formatMoscow } from '@/app/features/admin/inbox';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { CoachSchedule } from '@/app/features/admin/bookings/CoachSchedule';

type View = 'list' | 'schedule';

export default function AdminBookingsScreen() {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const admin = useIsAdmin();

  const [view, setView] = useState<View>('list');
  const [scope, setScope] = useState<BookingScope>('upcoming');
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [moving, setMoving] = useState<AdminBooking | null>(null);
  const [cancelling, setCancelling] = useState<AdminBooking | null>(null);
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

  const loadCoaches = useCallback(() => {
    listCoaches()
      .then((list) => {
        setCoaches(list);
        setCoachId((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch((e: unknown) =>
        toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsLoadError') }),
      );
  }, [toast, tr]);

  useEffect(() => {
    if (admin) load(scope);
  }, [admin, scope, load]);

  useEffect(() => {
    if (admin) loadCoaches();
  }, [admin, loadCoaches]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/" replace />;

  const nameOf = (c: AdminCoach) => (locale === 'en' ? (c.nameEn ?? c.name) : c.name);
  const coachName = (id: string | null) => {
    const c = coaches.find((x) => x.id === id);
    return c ? nameOf(c) : null;
  };
  const coach = coaches.find((c) => c.id === coachId) ?? null;

  return (
    <Screen header={<TopBar back title={t('app.bookingsTitle')} />}>
      <div className="flex flex-col gap-4 py-2">
        <SegmentedControl<View>
          fullWidth
          label={t('app.bookingsTitle')}
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: t('app.bookingsViewList') },
            { value: 'schedule', label: t('app.bookingsViewSchedule') },
          ]}
        />

        {view === 'list' ? (
          <>
            <SegmentedControl<BookingScope>
              fullWidth
              size="sm"
              label={t('app.bookingsViewList')}
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
                {rows.map((row) => {
                  /*
                   * Only a booking made here is ours to change. A Google row is history from
                   * before the cutover: it has no coach, no option and no room link, and moving it
                   * here would skip the overlap check our own rows get (0055). It still blocks
                   * Sergey's time, and it is changed with the client directly.
                   * `source` comes with the RPC's own row, never from the optional second read.
                   */
                  const editable = scope === 'upcoming' && row.source === 'forma';
                  return (
                    <li key={row.id}>
                      <BookingRow
                        row={row}
                        coach={coachName(row.coachId)}
                        external={scope === 'upcoming' && row.source !== 'forma'}
                        onMove={editable ? () => setMoving(row) : undefined}
                        onCancel={editable ? () => setCancelling(row) : undefined}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : !coach ? (
          <LoadingBlock />
        ) : (
          <>
            {coaches.length > 1 ? (
              <SegmentedControl<string>
                fullWidth
                size="sm"
                label={t('app.bookingsCoach')}
                value={coach.id}
                onChange={setCoachId}
                options={coaches.map((c) => ({ value: c.id, label: nameOf(c) }))}
              />
            ) : null}
            <CoachSchedule key={coach.id} coach={coach} onSaved={loadCoaches} />
          </>
        )}
      </div>

      {moving ? (
        <MoveBookingSheet
          row={moving}
          onClose={() => setMoving(null)}
          onDone={() => {
            setMoving(null);
            load(scope);
          }}
        />
      ) : null}
      {cancelling ? (
        <CancelBookingModal
          row={cancelling}
          onClose={() => setCancelling(null)}
          onDone={() => {
            setCancelling(null);
            load(scope);
          }}
        />
      ) : null}
    </Screen>
  );
}

function BookingRow({
  row,
  coach,
  external = false,
  onMove,
  onCancel,
}: {
  row: AdminBooking;
  coach: string | null;
  /** Upcoming but from the old Google calendar: kept as history, not changed here. */
  external?: boolean;
  onMove?: () => void;
  onCancel?: () => void;
}) {
  const { t, locale } = useT();
  const details = [
    coach,
    row.minutes > 0 ? t('app.bookingsMinutes', { n: row.minutes }) : null,
    t(bookingSourceKey(row.source)),
    row.eventName,
  ].filter(Boolean);
  const live = row.status === 'active';

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
        <Badge tone={live ? 'inverse' : 'neutral'}>
          {t(live ? 'app.bookingsStatusActive' : 'app.bookingsStatusCancelled')}
        </Badge>
      </div>
      <span className="text-xs text-muted-2">{details.join(' · ')}</span>
      {row.cancelReason && row.status === 'cancelled' ? (
        <span className="text-xs text-muted">{row.cancelReason}</span>
      ) : null}
      {live && external ? (
        <span className="text-xs text-muted">{t('app.bookingsExternalHint')}</span>
      ) : null}
      {live && (row.joinUrl || onMove || onCancel) ? (
        <div className="-mb-2 -ml-4.5 flex flex-wrap items-center">
          {onMove ? (
            <Button variant="ghost" size="sm" onClick={onMove}>
              {t('app.bookingsMove')}
            </Button>
          ) : null}
          {onCancel ? (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {t('app.bookingsCancel')}
            </Button>
          ) : null}
          {row.joinUrl ? (
            <a
              href={row.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="control-label px-4.5 text-[11px] text-muted underline-offset-4 hover:text-text hover:underline"
            >
              {t('app.bookingsJoin')}
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/** Move a session to a Moscow date and time the coach agreed to. */
function MoveBookingSheet({
  row,
  onClose,
  onDone,
}: {
  row: AdminBooking;
  onClose: () => void;
  onDone: () => void;
}) {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const [date, setDate] = useState(() => dateIn(Date.parse(row.startsAt), COACH_TIME_ZONE));
  const [time, setTime] = useState(() => clockIn(row.startsAt, COACH_TIME_ZONE));
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const move = async () => {
    const minutes = parseClock(time);
    const at = minutes === null ? Number.NaN : wallToInstant(date, minutes, COACH_TIME_ZONE);
    if (!Number.isFinite(at) || at <= Date.now()) {
      setProblem(t('app.bookingsMoveInvalid'));
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await adminMoveBooking(row.id, new Date(at).toISOString());
      toast.show({ kind: 'success', title: t('app.bookingsMoved') });
      onDone();
    } catch (e) {
      const code = isAppError(e) ? e.message : '';
      if (code === 'slot_taken') setProblem(t('app.bookingsMoveTaken'));
      else if (code === 'invalid_times') setProblem(t('app.bookingsMoveInvalid'));
      else toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsSaveError') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('app.bookingsMoveTitle')}
      footer={
        <Button variant="primary" size="lg" fullWidth loading={busy} onClick={() => void move()}>
          {t('app.bookingsMove')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {row.name ?? row.email} · {formatMoscow(row.startsAt, locale)} {t('app.bookingsMsk')}
        </p>
        <div className="flex gap-2">
          <Input
            label={t('app.bookingsMoveDate')}
            type="date"
            value={date}
            wrapperClassName="flex-1"
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label={t('app.bookingsMoveTime')}
            type="time"
            step={1800}
            value={time}
            wrapperClassName="flex-1"
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-2">{t('app.bookingsMoveHint')}</p>
        {problem ? (
          <p role="alert" className="text-sm text-danger">
            {problem}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}

/** Cancel a session, with an optional reason kept on the row. */
function CancelBookingModal({
  row,
  onClose,
  onDone,
}: {
  row: AdminBooking;
  onClose: () => void;
  onDone: () => void;
}) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    setBusy(true);
    try {
      await adminCancelBooking(row.id, reason);
      toast.show({ kind: 'success', title: t('app.bookingsCancelledToast') });
      onDone();
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsSaveError') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('app.bookingsCancelTitle')}
      description={t('app.bookingsCancelBody')}
      confirmLabel={t('app.bookingsCancelConfirm')}
      danger
      loading={busy}
      onConfirm={() => void cancel()}
    >
      <Input
        label={t('app.bookingsCancelReason')}
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
}
