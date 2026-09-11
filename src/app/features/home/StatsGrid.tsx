import { useMemo, type ReactNode } from 'react';
import { BarChart, type BarDatum } from '@/components/ui/BarChart';
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

/** One figure of the week: the number at 20px in the display face, its name under it as a kicker. */
function Fact({ value, label, hint }: { value: ReactNode; label: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="numeral tabular text-3xl leading-none">{value}</span>
      <span className="eyebrow mt-1">{label}</span>
      {hint ? <span className="text-xs text-muted-2">{hint}</span> : null}
    </div>
  );
}

/** kcal / minutes / points on one ruled line, then the steps figure over its chart. */
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
     * The week as a spread rather than a grid of boxes: three numbers on one rule, then the
     * steps figure over its chart. Hairlines do the separating four bordered cards used to,
     * which is what lets three figures sit side by side on a 390px screen without any of them
     * shrinking to unreadable. No icons — the number and the word under it say what it is.
     */
    <section className="mt-6 flex flex-col">
      <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Fact label={t('app.homeStatsKcal')} value={formatNumber(locale, week.calories)} />
        <Fact
          label={t('app.homeStatsMinutes')}
          value={formatNumber(locale, week.minutes)}
          hint={`${week.workouts} ${workoutsWord}`}
        />
        <Fact
          label={t('app.homeStatsPoints')}
          value={formatNumber(locale, totalPoints)}
          hint={t('app.homeStatsPointsHint')}
        />
      </div>
      <div className="mt-6 border-t border-border pt-4">
        <span className="eyebrow">{t('app.homeStatsSteps')}</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="numeral tabular text-4xl leading-none">
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
      </div>
    </section>
  );
}
