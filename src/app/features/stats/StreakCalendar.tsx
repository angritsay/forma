import { clsx } from 'clsx';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/i18n/index';
import type { StreakInfo } from '@/lib/training/types';
import { weekdayLabel } from '@/app/features/home/StatsGrid';
import { useT } from '@/app/hooks/useT';
import type { CalendarKind, CalendarWeek } from './model';

export interface StreakCalendarProps {
  weeks: readonly CalendarWeek[];
  streak: StreakInfo;
}

const KIND_CLASS: Record<CalendarKind, string> = {
  workout: 'bg-accent text-on-primary',
  steps: 'bg-success/25 text-success',
  empty: 'bg-surface-3 text-muted-2',
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
    <Card level={2} padding="sm" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">{t('app.statsCalendarTitle')}</span>
        <span className="tabular shrink-0 text-sm font-semibold">
          {t('app.statsCalendarCurrent', { n: streak.current })} ·{' '}
          {t('app.statsCalendarBest', { n: streak.longest })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
        {headers.map((h, i) => (
          <span key={i} className="text-center text-[11px] text-muted">
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
                'flex aspect-square items-center justify-center rounded-inner',
                KIND_CLASS[c.kind],
                c.today && 'ring-2 ring-primary ring-offset-2 ring-offset-surface-2',
              )}
            >
              {c.kind === 'workout' ? <Icon name="check" size={16} strokeWidth={3} /> : null}
              {c.kind === 'steps' ? <Icon name="steps" size={16} /> : null}
            </li>
          )),
        )}
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {(['workout', 'steps', 'empty'] as const).map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={clsx('inline-block size-3 rounded-[4px]', KIND_CLASS[kind])}
            />
            {KIND_LABEL[kind]}
          </li>
        ))}
      </ul>
    </Card>
  );
}
