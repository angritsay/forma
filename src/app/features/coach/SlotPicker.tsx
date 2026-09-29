/**
 * The slot picker (0055): two weeks of days, then that day's free times, in the viewer's clock.
 *
 * One picker for both jobs on the «Тренер» tab — booking a new session and moving a booked one —
 * because they are the same question («when?») asked of the same calendar. What differs is only
 * what happens after a time is picked, and that belongs to the caller.
 *
 * Split in two on purpose. `SlotPicker` fetches (`available_slots` for the next `PICKER_DAYS`
 * days) and keeps which day is open; `SlotPickerView` draws whatever state it is handed and holds
 * nothing, so it renders on the server in a test and every state of it can be looked at without a
 * network or a clock.
 *
 * The times are the device's (`src/lib/coach/slots.ts` says why) and the zone is named under the
 * chips, so somebody in Yekaterinburg is never left wondering whether 12:00 is Moscow's.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DayStrip, type StripDayItem } from '@/components/ui/DayStrip';
import { Skeleton } from '@/components/ui/Skeleton';
import { listFreeSlots } from '@/lib/api/coachSlots';
import type { FreeSlot, SessionOption } from '@/lib/api/types';
import { deviceTimeZone } from '@/lib/coach/booking';
import {
  clockIn,
  dateStrip,
  firstOpenDay,
  PICKER_DAYS,
  slotsByDay,
  zoneLabel,
} from '@/lib/coach/slots';
import { useT } from '@/app/hooks/useT';
import { dayLong, weekdayShort } from './slotCopy';

export type SlotsState =
  { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; slots: readonly FreeSlot[] };

export interface SlotPickerViewProps {
  state: SlotsState;
  /** The instant «today» is counted from. */
  now: number;
  /** The viewer's zone; undefined is the runtime's own. */
  timeZone: string | undefined;
  /** The open day, `YYYY-MM-DD`; null opens the first day with free time. */
  day: string | null;
  onDay: (day: string) => void;
  /** The picked start, as the server returned it. */
  value: string | null;
  onPick: (startsAt: string) => void;
  onRetry: () => void;
  /** What stands in the picker's place when two weeks hold nothing (a way to write the coach). */
  empty?: ReactNode;
}

export function SlotPickerView({
  state,
  now,
  timeZone,
  day,
  onDay,
  value,
  onPick,
  onRetry,
  empty,
}: SlotPickerViewProps) {
  const { t, locale } = useT();
  const slots = useMemo(() => (state.kind === 'ready' ? state.slots : []), [state]);
  const strip = useMemo(() => dateStrip(slots, now, timeZone), [slots, now, timeZone]);
  const open = firstOpenDay(strip, day);
  const times = open ? (slotsByDay(slots, timeZone).get(open) ?? []) : [];

  if (state.kind === 'loading') {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted">{t('app.bookPickerError')}</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('app.bookPickerRetry')}
        </Button>
      </div>
    );
  }
  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-snug text-muted">{t('app.bookPickerEmpty')}</p>
        {empty}
      </div>
    );
  }

  const days: StripDayItem[] = strip.map((d) => {
    const date = dayLong(d.date, locale);
    return {
      key: d.date,
      day: d.day,
      weekday: weekdayShort(d.date, locale),
      disabled: d.count === 0,
      label:
        d.count === 0
          ? t('app.bookPickerDayNone', { date })
          : t('app.bookPickerDaySome', { date, n: d.count }),
    };
  });
  const zone = zoneLabel(timeZone, now, locale);

  return (
    <div className="flex flex-col gap-4">
      <DayStrip days={days} value={open} onChange={onDay} label={t('app.bookPickerDays')} />
      <div className="flex flex-col gap-2">
        <ul aria-label={t('app.bookPickerTimes')} className="flex flex-wrap gap-2">
          {times.map((s) => (
            <li key={s.startsAt}>
              <Chip
                selected={s.startsAt === value}
                onClick={() => onPick(s.startsAt)}
                className="tabular"
              >
                {clockIn(s.startsAt, timeZone)}
              </Chip>
            </li>
          ))}
        </ul>
        {zone ? <p className="text-xs text-muted-2">{t('app.bookPickerZone', { zone })}</p> : null}
      </div>
    </div>
  );
}

export interface SlotPickerProps {
  coach: string;
  option: SessionOption;
  value: string | null;
  /** Null when the picked time is no longer on offer after a reload. */
  onChange: (startsAt: string | null) => void;
  /** Change it to fetch again (after a taken slot, an expired hold, a move). */
  reloadKey?: number;
  empty?: ReactNode;
}

const DAY = 86_400_000;

export function SlotPicker({
  coach,
  option,
  value,
  onChange,
  reloadKey = 0,
  empty,
}: SlotPickerProps) {
  const timeZone = deviceTimeZone();
  const [state, setState] = useState<SlotsState>({ kind: 'loading' });
  const [now, setNow] = useState(() => Date.now());
  const [day, setDay] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    const at = Date.now();
    setNow(at);
    setState({ kind: 'loading' });
    listFreeSlots(
      coach,
      option,
      new Date(at).toISOString(),
      new Date(at + PICKER_DAYS * DAY).toISOString(),
    )
      .then((slots) => {
        if (alive) setState({ kind: 'ready', slots });
      })
      .catch(() => {
        if (alive) setState({ kind: 'error' });
      });
    return () => {
      alive = false;
    };
  }, [coach, option, reloadKey, attempt]);

  // A pick the fresh list no longer offers (taken, or the other length) is not a pick any more.
  useEffect(() => {
    if (state.kind !== 'ready' || value === null) return;
    if (!state.slots.some((s) => s.startsAt === value)) onChange(null);
  }, [state, value, onChange]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <SlotPickerView
      state={state}
      now={now}
      timeZone={timeZone}
      day={day}
      onDay={(d) => {
        setDay(d);
        onChange(null);
      }}
      value={value}
      onPick={onChange}
      onRetry={retry}
      empty={empty}
    />
  );
}
