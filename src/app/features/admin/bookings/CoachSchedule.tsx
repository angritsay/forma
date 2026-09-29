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
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import { isAppError } from '@/lib/api/errors';
import {
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
import { dayLong, weekdayLong } from '@/app/features/coach/slotCopy';

const PROBLEM: Record<RangeProblem, TKey> = {
  format: 'app.bookingsRangeFormat',
  order: 'app.bookingsRangeOrder',
  overlap: 'app.bookingsRangeOverlap',
};

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function CoachSchedule({ coach, onSaved }: { coach: AdminCoach; onSaved: () => void }) {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const today = dateIn(Date.now(), coach.timezone);

  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState<Map<number, RangeDraft[]>>(() => rulesToWeek([]));
  const [exceptions, setExceptions] = useState<CoachException[]>([]);
  const [room, setRoom] = useState(coach.roomUrl ?? '');
  const [roomError, setRoomError] = useState(false);
  const [busy, setBusy] = useState<'room' | 'week' | 'exception' | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAvailability(coach.id, today)
      .then((a) => {
        setWeek(rulesToWeek(a.rules));
        setExceptions(a.exceptions);
      })
      .catch((e: unknown) =>
        toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsLoadError') }),
      )
      .finally(() => setLoading(false));
  }, [coach.id, today, toast, tr]);

  useEffect(() => {
    setRoom(coach.roomUrl ?? '');
    setRoomError(false);
    load();
  }, [coach.id, coach.roomUrl, load]);

  const saveRoom = async () => {
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

  const saveWeek = async () => {
    setBusy('week');
    try {
      await setWeeklyRules(coach.id, weekToRules(week));
      toast.show({ kind: 'success', title: t('app.bookingsWeekSaved') });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.bookingsSaveError') });
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingBlock />;

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
          onClick={() => void saveRoom()}
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
        <Button
          variant="primary"
          fullWidth
          disabled={!weekValid}
          loading={busy === 'week'}
          onClick={() => void saveWeek()}
        >
          {t('app.bookingsWeekSave')}
        </Button>
      </section>

      <Exceptions
        coachId={coach.id}
        today={today}
        list={exceptions}
        busy={busy === 'exception'}
        setBusy={(b) => setBusy(b ? 'exception' : null)}
        onChanged={load}
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
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => void remove(e.id)}>
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
    </section>
  );
}
