/**
 * Marathon — my points, day by day.
 *
 * Two numbers per day, deliberately side by side: how many of the day's tasks *I* delivered, and
 * how many points my *entry* took. In a pair those come apart — I did both tasks and we scored
 * nothing because my partner did not — and that gap is the whole tension of the format. Showing
 * one total would hide exactly the thing a person needs to see to go and message their partner.
 */
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber } from '@/i18n/index';
import type { MarathonDayPoints } from '@/lib/api/types';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { useMarathonMyPoints, useMyMarathons } from '@/app/features/marathon/useMarathon';

export default function MarathonPointsScreen() {
  const { t, locale } = useT();
  const { marathon, status: marathonStatus } = useMyMarathons();
  const { data: days, status } = useMarathonMyPoints(marathon?.id ?? null);

  /** Days grouped under the week they belong to, newest week first. */
  const weeks = useMemo(() => {
    const byWeek = new Map<number, MarathonDayPoints[]>();
    for (const day of days) {
      const list = byWeek.get(day.week);
      if (list) list.push(day);
      else byWeek.set(day.week, [day]);
    }
    return [...byWeek.entries()].sort((a, b) => b[0] - a[0]);
  }, [days]);

  const header = <TopBar back title={t('app.marathonTabPoints')} />;

  if (marathonStatus === 'loading' || status === 'loading') {
    return (
      <Screen header={header}>
        <div className="flex flex-col gap-px py-4" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} rounded="control" className="h-14" />
          ))}
        </div>
      </Screen>
    );
  }

  if (!marathon || days.length === 0) {
    return (
      <Screen header={header}>
        <EmptyState
          title={t('app.marathonNotStarted')}
          description={t('app.marathonNotStartedBody')}
        />
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      <div className="flex flex-col gap-8 py-2">
        {weeks.map(([week, weekDays]) => {
          const total = weekDays.reduce((sum, d) => sum + d.points, 0);
          return (
            <section key={week} className="flex flex-col">
              <header className="flex items-baseline justify-between gap-3 pb-2">
                <h2 className="control-label text-[10px] text-muted-2">
                  {t('app.marathonWeek', { n: formatNumber(locale, week) })}
                </h2>
                <span className="numeral tabular text-[13px] text-muted">
                  {t('app.marathonPointsTotalWeek')} {formatNumber(locale, total)}
                </span>
              </header>
              {weekDays.map((day) => (
                <DayRow
                  key={day.dayIndex}
                  day={day}
                  locale={locale}
                  isToday={day.dayIndex === marathon.dayIndex}
                />
              ))}
            </section>
          );
        })}
      </div>
    </Screen>
  );
}

function DayRow({
  day,
  locale,
  isToday,
}: {
  day: MarathonDayPoints;
  locale: Parameters<typeof formatNumber>[0];
  /** Today is still running; nothing about it has been missed yet. */
  isToday: boolean;
}) {
  const { t } = useT();
  const complete = day.tasksTotal > 0 && day.tasksDone >= day.tasksTotal;
  const missed = !isToday && day.tasksTotal > 0 && day.tasksDone === 0;
  return (
    <div className="flex items-center gap-3 border-t border-border py-3">
      {/* The numeral is the day. Repeating it as «День 10» next to it says nothing twice. */}
      <span className="numeral tabular w-8 shrink-0 text-base text-muted-2">
        {String(day.dayIndex).padStart(2, '0')}
      </span>
      <span
        className={clsx(
          'numeral min-w-0 flex-1 text-[15px]',
          // A day you sat out is the one worth spotting from across the list.
          missed ? 'text-danger' : complete ? 'text-text' : 'text-muted',
        )}
      >
        {day.tasksTotal === 0
          ? t('app.marathonPointsNothing')
          : t('app.marathonPointsDone', {
              done: formatNumber(locale, day.tasksDone),
              total: formatNumber(locale, day.tasksTotal),
            })}
      </span>
      <span className="numeral tabular shrink-0 text-[15px]">
        {day.points > 0 ? formatNumber(locale, day.points) : '—'}
      </span>
    </div>
  );
}
