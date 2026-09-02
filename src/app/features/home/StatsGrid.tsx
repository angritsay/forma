import { useMemo } from 'react';
import { BarChart, type BarDatum } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
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
    <div className="flex flex-col gap-3">
      <Card level={2} padding="sm" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 text-muted">
          <span className="text-sm">{t('app.homeStatsSteps')}</span>
          <Icon name="steps" size={18} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="tabular text-3xl font-bold leading-none">
            {formatNumber(locale, week.steps)}
          </span>
          <span className="text-sm text-muted">{t('common.steps')}</span>
        </div>
        <BarChart
          data={data}
          goal={stepsGoal}
          goalLabel={`${t('app.homeStatsGoal')} ${formatNumber(locale, stepsGoal)}`}
          height={120}
          formatValue={(v) => formatNumber(locale, v)}
          ariaLabel={t('app.homeStatsSteps')}
        />
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label={t('app.homeStatsKcal')}
          icon="flame"
          value={formatNumber(locale, week.calories)}
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
        />
      </div>
    </div>
  );
}
