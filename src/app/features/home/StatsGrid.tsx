import { useMemo } from 'react';
import { BarChart, type BarDatum } from '@/components/ui/BarChart';
import { Icon } from '@/components/ui/Icon';
import { StatTile } from '@/components/ui/StatTile';
import { formatNumber, plural, type Locale } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import type { StepsDay, WeekStats } from './stats';

export interface StatsGridProps {
  week: WeekStats;
  steps: readonly StepsDay[];
  totalPoints: number;
  stepsGoal: number;
}

/** Short weekday label ("Mon" / "пн") for a local date; noon avoids timezone drift. */
export function weekdayLabel(locale: Locale, isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' })
    .format(d)
    .replace(/\.$/, '');
}

/** Steps chart (7 days) plus kcal / minutes / points tiles. */
export function StatsGrid({ week, steps, totalPoints, stepsGoal }: StatsGridProps) {
  const { t, locale } = useT();
  const data = useMemo<BarDatum[]>(
    () =>
      steps.map((d) => ({
        label: weekdayLabel(locale, d.date),
        value: d.steps,
        highlight: d.today,
      })),
    [steps, locale],
  );
  const workoutsWord = plural(locale, week.workouts, {
    one: t('app.homeWorkoutWordOne'),
    few: t('app.homeWorkoutWordFew'),
    many: t('app.homeWorkoutWordMany'),
  });

  return (
    /*
     * The week as a spread rather than a grid of boxes: the steps figure large over its chart,
     * then the three secondary numbers on one ruled line. Hairlines do the separating four
     * bordered cards used to, which is what lets three numbers sit side by side on a 390px screen
     * without any of them shrinking to unreadable.
     */
    <section className="flex flex-col border-t border-border pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">{t('app.homeStatsSteps')}</span>
        <Icon name="steps" size={16} className="text-muted" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="numeral tabular text-5xl leading-none">
          {formatNumber(locale, week.steps)}
        </span>
        <span className="text-sm text-muted">{t('common.steps')}</span>
      </div>
      <div className="mt-4">
        <BarChart
          data={data}
          goal={stepsGoal}
          goalLabel={`${t('app.homeStatsGoal')} ${formatNumber(locale, stepsGoal)}`}
          height={120}
          formatValue={(v) => formatNumber(locale, v)}
          ariaLabel={t('app.homeStatsSteps')}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border">
        <StatTile
          label={t('app.homeStatsKcal')}
          icon="flame"
          value={formatNumber(locale, week.calories)}
          className="pl-0"
        />
        <StatTile
          label={t('app.homeStatsMinutes')}
          icon="clock"
          value={formatNumber(locale, week.minutes)}
          trend={{ value: 0, label: `${week.workouts} ${workoutsWord}` }}
        />
        <StatTile
          label={t('app.homeStatsPoints')}
          icon="bolt"
          value={formatNumber(locale, totalPoints)}
          trend={{ value: 0, label: t('app.homeStatsPointsHint') }}
          className="pr-0"
        />
      </div>
    </section>
  );
}
