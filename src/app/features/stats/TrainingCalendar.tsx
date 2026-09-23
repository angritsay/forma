import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { formatDate } from '@/i18n/index';
import type { TrainingCount } from '@/lib/training/types';
import { weekdayLabel } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';
import type { CalendarKind, CalendarWeek } from './model';

export interface TrainingCalendarProps {
  weeks: readonly CalendarWeek[];
  count: TrainingCount;
}

/*
 * Three kinds of day as dots — the calendar the third palette draws (design/CHANGELOG.md §14:
 * «календарь — сетка точек (белые — сделано, неон — сегодня)»), in the same shapes as the club's
 * `DotCalendar`. A workout day is a white dot with a tick; an empty day is a hairline ring; a day
 * still ahead is a faint dot. Today is the neon dot — the one day that still asks for something —
 * whatever kind it is, with the tick once it is done. No green, and not the club's gradient either:
 * that is the club's colour, and this is every athlete's own record.
 *
 * `DotCalendar` itself is not reused because its done dot *is* the gradient, and because this grid
 * says «a workout» with a tick where the club's says nothing on it.
 *
 * There was a fourth — a steps-goal day, a raised surface with the footprints mark, for a day
 * carried by walking rather than training. It went with the step feature, and the calendar is
 * easier to read for it: a dot is either a training day or it is not.
 */
const KIND_CLASS: Record<CalendarKind, string> = {
  workout: 'bg-paper text-ink',
  empty: 'border border-border-strong',
  future: 'bg-paper/10',
};

const TODAY_CLASS = 'bg-action text-on-action';

/**
 * Five weeks of days: workout day, empty or still ahead; today is the neon dot.
 *
 * The two figures beside the title used to be «Сейчас 3 · Лучшая 11» — the streak now and the
 * streak at its best. Both are gone: a plan with rest days in it cannot hold a long streak, so the
 * pair mostly reported how recently the athlete had done what they were told not to. «Всего» and
 * «На этой неделе» answer the two questions that are actually being asked of this square of dots.
 */
export function TrainingCalendar({ weeks, count }: TrainingCalendarProps) {
  const { t, locale } = useT();
  const KIND_LABEL: Record<CalendarKind, string> = {
    workout: t('app.statsCalendarWorkout'),
    empty: t('app.statsCalendarEmpty'),
    future: t('app.statsCalendarFuture'),
  };
  const headers = weeks[0]?.cells.map((c) => weekdayLabel(locale, c.date)) ?? [];

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/*
        The two figures alone on this row. «КАЛЕНДАРЬ СЕРИИ» stood to their left and had to go
        twice over: the streak it named is gone, and the sheet around it is already titled
        «Тренировки» — a kicker under a title, naming the same thing, is the heading said twice.
      */}
      <p className="numeral tabular text-sm">
        {t('app.statsCalendarTotal', { n: count.total })} ·{' '}
        {t('app.statsCalendarWeek', { n: count.thisWeek })}
      </p>
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
                'flex aspect-square items-center justify-center rounded-full',
                c.today ? TODAY_CLASS : KIND_CLASS[c.kind],
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
            <span
              aria-hidden="true"
              className={clsx('inline-block size-3 rounded-full', KIND_CLASS[kind])}
            />
            {KIND_LABEL[kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}
