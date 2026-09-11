import { clsx } from 'clsx';
import { Glyph, Icon } from '@/components/ui/Icon';
import { formatDate } from '@/i18n/index';
import type { StreakInfo } from '@/lib/training/types';
import { weekdayLabel } from '@/app/features/home/StatsGrid';
import { useT } from '@/app/hooks/useT';
import type { CalendarKind, CalendarWeek } from './model';

export interface StreakCalendarProps {
  weeks: readonly CalendarWeek[];
  streak: StreakInfo;
}

/*
 * Four kinds of day in black and white. A workout day is the white square with a tick; a
 * steps-goal day is a raised surface with the footprints mark (steps are a physical thing a glyph
 * cannot say, so the one small icon stays); an empty day is the base surface; a day still ahead is
 * an outline. Today is told apart by its ring, whatever kind it is. No green: a calendar that
 * colours one kind of day makes that kind look like the point of the exercise.
 */
const KIND_CLASS: Record<CalendarKind, string> = {
  workout: 'bg-primary text-on-primary',
  steps: 'bg-surface-3 text-text',
  empty: 'bg-surface-2 text-muted-2',
  future: 'border border-border text-muted-2',
};

/** Five weeks of days: workout day, steps-goal day, empty or still ahead; today is ringed. */
export function StreakCalendar({ weeks, streak }: StreakCalendarProps) {
  const { t, locale } = useT();
  const KIND_LABEL: Record<CalendarKind, string> = {
    workout: t('app.statsCalendarWorkout'),
    steps: t('app.statsCalendarSteps'),
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
              {c.kind === 'steps' ? <Icon name="steps" size={14} /> : null}
            </li>
          )),
        )}
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {(['workout', 'steps', 'empty'] as const).map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={clsx('inline-block size-3', KIND_CLASS[kind])} />
            {KIND_LABEL[kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}
