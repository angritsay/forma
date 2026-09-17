import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { formatDate } from '@/i18n/index';
import type { StreakInfo } from '@/lib/training/types';
import { weekdayLabel } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';
import type { CalendarKind, CalendarWeek } from './model';

export interface StreakCalendarProps {
  weeks: readonly CalendarWeek[];
  streak: StreakInfo;
}

/*
 * Three kinds of day in black and white. A workout day is the white square with a tick; an empty
 * day is the base surface; a day still ahead is an outline. Today is told apart by its ring,
 * whatever kind it is. No green: a calendar that colours one kind of day makes that kind look like
 * the point of the exercise.
 *
 * There was a fourth — a steps-goal day, a raised surface with the footprints mark, for a day
 * carried by walking rather than training. It went with the step feature, and the calendar is
 * easier to read for it: a square is either a training day or it is not.
 */
const KIND_CLASS: Record<CalendarKind, string> = {
  workout: 'bg-primary text-on-primary',
  empty: 'bg-surface-2 text-muted-2',
  future: 'border border-border text-muted-2',
};

/** Five weeks of days: workout day, empty or still ahead; today is ringed. */
export function StreakCalendar({ weeks, streak }: StreakCalendarProps) {
  const { t, locale } = useT();
  const KIND_LABEL: Record<CalendarKind, string> = {
    workout: t('app.statsCalendarWorkout'),
    empty: t('app.statsCalendarEmpty'),
    future: t('app.statsCalendarFuture'),
  };
  const headers = weeks[0]?.cells.map((c) => weekdayLabel(locale, c.date)) ?? [];

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">{t('app.statsCalendarTitle')}</span>
        <span className="numeral tabular shrink-0 text-sm">
          {t('app.statsCalendarCurrent', { n: streak.current })} ·{' '}
          {t('app.statsCalendarBest', { n: streak.longest })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
        {headers.map((h, i) => (
          <span key={i} className="eyebrow text-center text-[10px]">
            {h}
          </span>
        ))}
      </div>
      <ul className="grid grid-cols-7 gap-1.5">
        {weeks.flatMap((w) =>
          w.cells.map((c) => (
            <li
              key={c.date}
              aria-label={`${formatDate(locale, c.date)}: ${KIND_LABEL[c.kind]}${
                c.today ? ` (${t('app.statsCalendarToday')})` : ''
              }`}
              className={clsx(
                'flex aspect-square items-center justify-center',
                KIND_CLASS[c.kind],
                c.today && 'ring-2 ring-primary ring-offset-2 ring-offset-bg',
              )}
            >
              {c.kind === 'workout' ? <Glyph size={14}>✓</Glyph> : null}
            </li>
          )),
        )}
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {(['workout', 'empty'] as const).map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={clsx('inline-block size-3', KIND_CLASS[kind])} />
            {KIND_LABEL[kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}
