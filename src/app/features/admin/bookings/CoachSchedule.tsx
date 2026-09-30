/**
 * «Расписание» in the admin's «Записи» (0055): one coach's room link, weekly hours and per-date
 * exceptions — everything the client's picker is computed from.
 *
 * Three blocks, each saved on its own, because they change at different speeds: the room link
 * once, the week now and then, an exception whenever the coach is away. Each has its own button,
 * so saving one never sends another half-edited.
 *
 * The week is edited as the owner will think about it — a row per weekday, each with its hours —
 * and sent whole (`admin_set_availability` replaces the week in one transaction). Ranges are
 * checked here before they go (`rangeProblems`): a reversed or overlapping range is a typo, and
 * the button stays off until there is none. Times are the coach's wall clock, named in the hint,
 * because the owner may be travelling and the coach is not.
 *
 * Changing the hours moves and cancels nothing (0056). So the editor reads the coach's upcoming
 * sessions and, as the week is edited and exceptions added, lists the ones the hours would no
 * longer cover (`bookingsOutsideHours`) — a paid session is not stranded without anybody seeing
 * it. They are moved or cancelled in «Записи», with the client told.
 *
 * ## When something goes wrong (0059)
 *
 *   - **A failed load shows no editor.** It used to show the empty week it started with, and one
 *     «Сохранить неделю» on top of a network error wiped the coach's real hours. Now the load is
 *     its own state (`CoachScheduleGate`): an error and «Повторить», and no week to save.
 *   - **A week with no hours asks first.** It is a valid week (the coach is away), and the one
 *     that stops all booking, so it is never saved by a slip.
 *   - **The week carries its version.** The save sends the version it read; a week changed in
 *     another window since is refused (`stale_week`) and offered to load again, not overwritten.
 *   - **Unsaved hours are guarded.** `onDirtyChange` tells the screen, which asks before leaving.
 *   - **Deleting an exception and clearing the room link ask first**: both undo something that
 *     clients depend on, with one tap.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import {
  addException,
  deleteException,
  getAvailability,
  saveCoach,
  setWeeklyRules,
  type AdminCoach,
  type CoachException,
} from '@/lib/api/adminCoaches';
import { listAdminBookings, type AdminBooking } from '@/lib/api/adminInbox';
import { isAppError } from '@/lib/api/errors';
import {
  bookingsOutsideHours,
  dateIn,
  rangeProblems,
  rulesToWeek,
  weekToRules,
  type RangeDraft,
  type RangeProblem,
} from '@/lib/coach/slots';
import type { TKey } from '@/i18n/index';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { useT } from '@/app/hooks/useT';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { AdminLoadError } from '@/app/features/admin/AdminLoadError';
import { dayLong, weekdayLong } from '@/app/features/coach/slotCopy';
import { formatMoscow } from '@/app/features/admin/inbox';

const PROBLEM: Record<RangeProblem, TKey> = {
  format: 'app.bookingsRangeFormat',
  order: 'app.bookingsRangeOrder',
  overlap: 'app.bookingsRangeOverlap',
};

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** No hours on any day: nobody can book this coach until an exception or a range is added. */
export function weekIsEmpty(week: ReadonlyMap<number, readonly RangeDraft[]>): boolean {
  return WEEKDAYS.every((d) => (week.get(d) ?? []).length === 0);
}

/** The week as it would be saved, as one comparable string: edited or not. */
function weekKey(week: ReadonlyMap<number, readonly RangeDraft[]>): string {
  return JSON.stringify(weekToRules(week));
}

export type ScheduleLoad =
  { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready' };

/**
 * The editor only once the week has been read. Loading is the loader; a failure is the reason and
 * «Повторить» — never the editor over an empty week, which one tap would have saved over the
 * coach's real hours.
 */
export function CoachScheduleGate({
  load,
  onRetry,
  children,
}: {
  load: ScheduleLoad;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (load.status === 'loading') return <LoadingBlock />;
  if (load.status === 'error') {
    return (
      <AdminLoadError
        error={load.error}
        onRetry={onRetry}
        title="app.bookingsScheduleLoadError"
        fallback="app.bookingsScheduleLoadErrorBody"
      />
    );
  }
  return <>{children}</>;
}

export function CoachSchedule({
  coach,
  onSaved,
  onDirtyChange,
}: {
  coach: AdminCoach;
  onSaved: () => void;
  /** Whether the week has edits that are not saved — the screen guards leaving on it. */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  /*
   * Read once per coach zone, not every render: `load` depends on it, and a value that turned
   * over at midnight would reload the week from the server over the admin's unsaved edits.
   */
  const today = useMemo(() => dateIn(Date.now(), coach.timezone), [coach.timezone]);

  const [loadState, setLoadState] = useState<ScheduleLoad>({ status: 'loading' });
  const [week, setWeek] = useState<Map<number, RangeDraft[]>>(() => rulesToWeek([]));
  /** The week as last read or saved, to tell an edit from what the server has. */
  const [savedKey, setSavedKey] = useState(() => weekKey(rulesToWeek([])));
  /** The version the week was read at (0059); sent back with the save. */
  const [version, setVersion] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmClearRoom, setConfirmClearRoom] = useState(false);
  const [exceptions, setExceptions] = useState<CoachException[]>([]);
  const [room, setRoom] = useState(coach.roomUrl ?? '');
  const [roomError, setRoomError] = useState(false);
  const [busy, setBusy] = useState<'room' | 'week' | 'exception' | null>(null);
  /* This coach's upcoming sessions, for the warning; none when the read fails. */
  const [sessions, setSessions] = useState<AdminBooking[]>([]);

  const load = useCallback(() => {
    setLoadState({ status: 'loading' });
    setStale(false);
    getAvailability(coach.id, today)
      .then((a) => {
        const read = rulesToWeek(a.rules);
        setWeek(read);
        setSavedKey(weekKey(read));
        setVersion(a.version ?? null);
        setExceptions(a.exceptions);
        setLoadState({ status: 'ready' });
      })
      .catch((e: unknown) => setLoadState({ status: 'error', error: e }));
  }, [coach.id, today]);

  /*
   * Exceptions change on their own and must not reset the week being edited: they are read again
   * alone. A failure keeps the list as it was and says so.
   */
  const reloadExceptions = useCallback(() => {
    getAvailability(coach.id, today)
      .then((a) => setExceptions(a.exceptions))
      .catch((e: unknown) =>
        toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsLoadError') }),
      );
  }, [coach.id, today, toast, tr]);

  /*
   * Two effects on purpose. Saving the room link reloads the coach list and hands back a new
   * `roomUrl`; that must reset the link field only — reloading the week then would throw away
   * ranges the admin has edited and not saved yet. The week and exceptions load per coach.
   */
  useEffect(() => {
    setRoom(coach.roomUrl ?? '');
    setRoomError(false);
  }, [coach.roomUrl]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    listAdminBookings('upcoming')
      .then((rows) => {
        if (alive) setSessions(rows.filter((r) => r.coachId === coach.id));
      })
      .catch(() => {
        /* The warning is a courtesy: without the list the editor still works. */
      });
    return () => {
      alive = false;
    };
  }, [coach.id]);

  const saveRoom = async () => {
    setConfirmClearRoom(false);
    setBusy('room');
    setRoomError(false);
    try {
      await saveCoach(coach.id, { roomUrl: room });
      toast.show({ kind: 'success', title: t('app.bookingsRoomSaved') });
      onSaved();
    } catch (e) {
      if (isAppError(e) && e.message === 'invalid_room_url') setRoomError(true);
      else toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsSaveError') });
    } finally {
      setBusy(null);
    }
  };

  const problems = new Map(WEEKDAYS.map((d) => [d, rangeProblems(week.get(d) ?? [])]));
  const weekValid = [...problems.values()].every((p) => p.size === 0);

  const editDay = (day: number, next: RangeDraft[]) => setWeek((w) => new Map(w).set(day, next));

  /* Against the week as edited (once it reads), and the exceptions as saved. */
  const outside = weekValid
    ? bookingsOutsideHours(sessions, weekToRules(week), exceptions, coach.timezone)
    : [];

  const dirty = loadState.status === 'ready' && weekKey(week) !== savedKey;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  // Leaving the editor (another coach, the list) is not leaving with edits.
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const saveWeek = async () => {
    setConfirmEmpty(false);
    setBusy('week');
    try {
      await setWeeklyRules(coach.id, weekToRules(week), version);
      // Read back: the new version, and the week exactly as the server now has it.
      const a = await getAvailability(coach.id, today).catch(() => null);
      if (a) {
        setVersion(a.version ?? null);
        setSavedKey(weekKey(rulesToWeek(a.rules)));
      } else {
        setSavedKey(weekKey(week));
      }
      toast.show({ kind: 'success', title: t('app.bookingsWeekSaved') });
    } catch (e) {
      if (isAppError(e) && e.message === 'stale_week') setStale(true);
      else toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsSaveError') });
    } finally {
      setBusy(null);
    }
  };

  const askSaveWeek = () => {
    if (weekIsEmpty(week)) setConfirmEmpty(true);
    else void saveWeek();
  };

  const askSaveRoom = () => {
    if (room.trim() === '' && coach.roomUrl) setConfirmClearRoom(true);
    else void saveRoom();
  };

  if (loadState.status !== 'ready') {
    return (
      <CoachScheduleGate load={loadState} onRetry={load}>
        {null}
      </CoachScheduleGate>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {coach.flag ? (
        <p className="text-xs text-muted-2">{t('app.bookingsCoachFlag', { flag: coach.flag })}</p>
      ) : null}

      <section className="flex flex-col gap-3">
        <Input
          label={t('app.bookingsRoom')}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          error={roomError ? t('app.bookingsRoomInvalid') : undefined}
          hint={t('app.bookingsRoomHint')}
        />
        {!coach.roomUrl ? <p className="text-xs text-warning">{t('app.bookingsNoRoom')}</p> : null}
        <Button
          variant="secondary"
          className="self-start"
          loading={busy === 'room'}
          disabled={room.trim() === (coach.roomUrl ?? '')}
          onClick={askSaveRoom}
        >
          {t('app.bookingsRoomSave')}
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[17px]">{t('app.bookingsWeek')}</h2>
          <p className="text-xs text-muted-2">
            {t('app.bookingsWeekHint', { zone: coach.timezone })}
          </p>
        </div>
        <ul className="flex flex-col">
          {WEEKDAYS.map((day) => {
            const ranges = week.get(day) ?? [];
            const dayProblems = problems.get(day) ?? new Map<number, RangeProblem>();
            return (
              <li key={day} className="flex flex-col gap-2 border-t border-border py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px]">{weekdayLong(day, locale)}</span>
                  {ranges.length === 0 ? (
                    <span className="text-xs text-muted-2">{t('app.bookingsDayOff')}</span>
                  ) : null}
                </div>
                {ranges.map((r, i) => {
                  const problem = dayProblems.get(i);
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <Input
                          aria-label={t('app.bookingsRangeFrom')}
                          type="time"
                          step={1800}
                          value={r.start}
                          wrapperClassName="flex-1"
                          onChange={(e) =>
                            editDay(
                              day,
                              ranges.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)),
                            )
                          }
                        />
                        <span className="pb-3 text-muted-2">–</span>
                        <Input
                          aria-label={t('app.bookingsRangeTo')}
                          type="time"
                          step={1800}
                          value={r.end}
                          wrapperClassName="flex-1"
                          onChange={(e) =>
                            editDay(
                              day,
                              ranges.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)),
                            )
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            editDay(
                              day,
                              ranges.filter((_, j) => j !== i),
                            )
                          }
                        >
                          {t('app.bookingsRemoveRange')}
                        </Button>
                      </div>
                      {problem ? (
                        <p role="alert" className="text-xs text-danger">
                          {t(PROBLEM[problem])}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-4.5 self-start"
                  onClick={() => editDay(day, [...ranges, { start: '10:00', end: '13:00' }])}
                >
                  {t('app.bookingsAddRange')}
                </Button>
              </li>
            );
          })}
        </ul>
        {stale ? (
          <div role="alert" className="flex flex-col items-start gap-2">
            <p className="text-sm text-danger">{t('app.bookingsWeekStale')}</p>
            <Button variant="secondary" size="sm" onClick={load}>
              {t('app.bookingsWeekReload')}
            </Button>
          </div>
        ) : null}
        <Button
          variant="primary"
          fullWidth
          disabled={!weekValid || stale}
          loading={busy === 'week'}
          onClick={askSaveWeek}
        >
          {t('app.bookingsWeekSave')}
        </Button>
      </section>

      {outside.length > 0 ? (
        <section role="status" className="flex flex-col gap-2 border-t border-border pt-4">
          <h2 className="text-[15px] text-warning">{t('app.bookingsOutsideTitle')}</h2>
          <ul className="flex flex-col gap-1">
            {outside.map((b) => (
              <li key={b.id} className="text-sm">
                <span className="tabular">{formatMoscow(b.startsAt, locale)}</span>{' '}
                <span className="text-xs text-muted-2">{t('app.bookingsMsk')}</span>
                {' · '}
                <span className="break-all text-muted">{b.name ?? b.email}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-2">{t('app.bookingsOutsideBody')}</p>
        </section>
      ) : null}

      <Exceptions
        coachId={coach.id}
        today={today}
        list={exceptions}
        busy={busy === 'exception'}
        setBusy={(b) => setBusy(b ? 'exception' : null)}
        onChanged={reloadExceptions}
      />

      <Modal
        open={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        title={t('app.bookingsWeekEmptyTitle')}
        description={t('app.bookingsWeekEmptyBody')}
        confirmLabel={t('app.bookingsWeekEmptyConfirm')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => void saveWeek()}
      />
      <Modal
        open={confirmClearRoom}
        onClose={() => setConfirmClearRoom(false)}
        title={t('app.bookingsRoomClearTitle')}
        description={t('app.bookingsRoomClearBody')}
        confirmLabel={t('app.bookingsRoomClearConfirm')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => void saveRoom()}
      />
    </div>
  );
}

function Exceptions({
  coachId,
  today,
  list,
  busy,
  setBusy,
  onChanged,
}: {
  coachId: string;
  today: string;
  list: readonly CoachException[];
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onChanged: () => void;
}) {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<'off' | 'extra'>('off');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [removing, setRemoving] = useState<CoachException | null>(null);

  const add = async () => {
    setBusy(true);
    setInvalid(false);
    try {
      await addException(coachId, { date, kind, start: start || null, end: end || null, note });
      toast.show({ kind: 'success', title: t('app.bookingsExceptionAdded') });
      setStart('');
      setEnd('');
      setNote('');
      onChanged();
    } catch (e) {
      if (isAppError(e) && e.code === 'validation') setInvalid(true);
      else toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsSaveError') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setRemoving(null);
    setBusy(true);
    try {
      await deleteException(id);
      onChanged();
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsSaveError') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[17px]">{t('app.bookingsExceptions')}</h2>
      {list.length === 0 ? (
        <p className="text-sm text-muted">{t('app.bookingsExceptionsEmpty')}</p>
      ) : (
        <ul className="flex flex-col">
          {list.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 border-t border-border py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px]">{dayLong(e.date, locale)}</span>
                <span className="text-xs text-muted">
                  {t(
                    e.kind === 'extra' ? 'app.bookingsExceptionExtra' : 'app.bookingsExceptionOff',
                  )}
                  {' · '}
                  <span className="tabular">
                    {e.start && e.end ? `${e.start}–${e.end}` : t('app.bookingsExceptionAllDay')}
                  </span>
                  {e.note ? ` · ${e.note}` : ''}
                </span>
              </div>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setRemoving(e)}>
                {t('app.bookingsExceptionRemove')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <Input
          label={t('app.bookingsExceptionDate')}
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <SegmentedControl<'off' | 'extra'>
          fullWidth
          size="sm"
          label={t('app.bookingsExceptionKind')}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'off', label: t('app.bookingsExceptionOff') },
            { value: 'extra', label: t('app.bookingsExceptionExtra') },
          ]}
        />
        <div className="flex items-end gap-2">
          <Input
            label={t('app.bookingsRangeFrom')}
            type="time"
            step={1800}
            value={start}
            wrapperClassName="flex-1"
            onChange={(e) => setStart(e.target.value)}
          />
          <span className="pb-3 text-muted-2">–</span>
          <Input
            label={t('app.bookingsRangeTo')}
            type="time"
            step={1800}
            value={end}
            wrapperClassName="flex-1"
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-2">{t('app.bookingsExceptionHint')}</p>
        <Input
          label={t('app.bookingsExceptionNote')}
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
        />
        {invalid ? (
          <p role="alert" className="text-sm text-danger">
            {t('app.bookingsExceptionInvalid')}
          </p>
        ) : null}
        <Button
          variant="secondary"
          className="self-start"
          loading={busy}
          disabled={!date}
          onClick={() => void add()}
        >
          {t('app.bookingsExceptionAdd')}
        </Button>
      </div>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={t('app.bookingsExceptionRemoveTitle')}
        description={
          removing
            ? t('app.bookingsExceptionRemoveBody', {
                date: dayLong(removing.date, locale),
                what:
                  (removing.kind === 'extra'
                    ? t('app.bookingsExceptionExtra')
                    : t('app.bookingsExceptionOff')) +
                  ' · ' +
                  (removing.start && removing.end
                    ? `${removing.start}–${removing.end}`
                    : t('app.bookingsExceptionAllDay')),
              })
            : undefined
        }
        confirmLabel={t('app.bookingsExceptionRemove')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => removing && void remove(removing.id)}
      />
    </section>
  );
}
