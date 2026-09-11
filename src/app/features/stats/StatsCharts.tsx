import { clsx } from 'clsx';
import { useMemo } from 'react';
import { BarChart, type BarDatum } from '@/components/ui/BarChart';
import { Glyph } from '@/components/ui/Icon';
import { formatDate, formatNumber, plural } from '@/i18n/index';
import { weekdayLabel } from '@/app/features/home/StatsGrid';
import { useT } from '@/app/hooks/useT';
import {
  dayMonthLabel,
  dayOfMonthLabel,
  type DayLoad,
  type StepsPoint,
  type WeekPoints,
} from './model';

/*
 * Every chart opens the same way: its name as a kicker on the left, its total as a numeral on the
 * right. The charts themselves are the kit's BarChart — square white bars on the hairline
 * baseline, the current day or week in full white and the rest at 40% — so the three read as one
 * instrument, and none of them carries a colour: nothing on this screen belongs to a course.
 */
function ChartHeader({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="eyebrow">{label}</span>
      <span className="numeral tabular shrink-0 text-sm">{value}</span>
    </div>
  );
}

/** Minutes per day of the current week with a workouts-per-day row above the bars. */
export function WeeklyChart({ days }: { days: readonly DayLoad[] }) {
  const { t, locale } = useT();
  const workouts = days.reduce((n, d) => n + d.workouts, 0);
  const minutes = days.reduce((n, d) => n + d.minutes, 0);
  const data = useMemo<BarDatum[]>(
    () =>
      days.map((d) => ({
        label: weekdayLabel(locale, d.date),
        value: d.minutes,
        highlight: d.today,
      })),
    [days, locale],
  );
  const workoutsWord = plural(locale, workouts, {
    one: t('app.homeWorkoutWordOne'),
    few: t('app.homeWorkoutWordFew'),
    many: t('app.homeWorkoutWordMany'),
  });
  return (
    <div className="flex flex-col gap-3 pb-2">
      <ChartHeader
        label={t('app.statsWeekMinutes')}
        value={`${workouts} ${workoutsWord} · ${t('common.minutesShort', { n: minutes })}`}
      />
      {/*
        One square per day over its bar: a white square with a tick (or the count) for a day
        trained, an empty hairline square for one that was not, fainter still for days to come.
      */}
      <ul className="grid grid-cols-7" aria-label={t('app.statsWeekWorkoutsRow')}>
        {days.map((d) => (
          <li
            key={d.date}
            className="flex justify-center"
            aria-label={t('app.statsWeekDayLabel', {
              date: formatDate(locale, d.date),
              n: d.workouts,
              min: d.minutes,
            })}
          >
            {d.workouts > 0 ? (
              <span className="numeral flex h-5 min-w-5 items-center justify-center bg-primary px-1 text-[11px] text-on-primary">
                {d.workouts > 1 ? d.workouts : <Glyph size={11}>✓</Glyph>}
              </span>
            ) : (
              <span
                aria-hidden="true"
                className={clsx(
                  'h-5 w-5 border',
                  d.future ? 'border-border' : 'border-border-strong',
                )}
              />
            )}
          </li>
        ))}
      </ul>
      <BarChart
        data={data}
        height={120}
        formatValue={(v) => t('common.minutesShort', { n: v })}
        ariaLabel={t('app.statsWeekChartLabel')}
      />
    </div>
  );
}

/** Points per ISO week over the last 8 weeks. */
export function PointsChart({ weeks }: { weeks: readonly WeekPoints[] }) {
  const { t, locale } = useT();
  const total = weeks.reduce((n, w) => n + w.points, 0);
  const data = useMemo<BarDatum[]>(
    () =>
      weeks.map((w) => ({
        label: dayMonthLabel(locale, w.from),
        value: w.points,
        highlight: w.current,
      })),
    [weeks, locale],
  );
  return (
    <div className="flex flex-col gap-3 pb-2">
      <ChartHeader
        label={t('app.statsPointsTitle')}
        value={t('app.statsPointsValue', { n: formatNumber(locale, total) })}
      />
      <BarChart
        data={data}
        height={130}
        formatValue={(v) => formatNumber(locale, v)}
        ariaLabel={t('app.statsPointsChartLabel')}
      />
    </div>
  );
}

export interface StepsChartProps {
  points: readonly StepsPoint[];
  goal: number;
}

/** Steps per day over the last 14 days with the goal line. */
export function StepsChart({ points, goal }: StepsChartProps) {
  const { t, locale } = useT();
  const atGoal = points.filter((p) => p.steps >= goal).length;
  const data = useMemo<BarDatum[]>(
    () =>
      points.map((p) => ({ label: dayOfMonthLabel(p.date), value: p.steps, highlight: p.today })),
    [points],
  );
  return (
    <div className="flex flex-col gap-3 pb-2">
      <ChartHeader
        label={t('app.statsStepsTitle')}
        value={t('app.statsStepsAtGoal', { n: atGoal, total: points.length })}
      />
      <BarChart
        data={data}
        goal={goal}
        goalLabel={t('app.statsStepsGoal', { n: formatNumber(locale, goal) })}
        height={130}
        formatValue={(v) => formatNumber(locale, v)}
        ariaLabel={t('app.statsStepsChartLabel')}
      />
    </div>
  );
}
