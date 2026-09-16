import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { formatDate, formatNumber } from '@/i18n/index';
import { weekdayLabel } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';
import { dayOfMonthLabel } from '@/app/features/stats/model';
import type { HistoryDay } from './model';

export interface StepsHistoryProps {
  days: readonly HistoryDay[];
  goal: number;
  onEdit: (date: string) => void;
}

/**
 * The previous fourteen days as two rows of seven circles; every circle opens the edit sheet.
 *
 * It was a list of fourteen rows — weekday, date, «+30 оч.» or «Не записано», the count, a
 * chevron — five pieces of type per day for a fact that has two states. The owner's prototype
 * draws a week as circles with a check on the days that counted, and a fortnight is two of those:
 * a white circle with a check where the goal was reached, a hairline with the weekday's letter
 * where it was not, a fainter hairline where nothing was logged at all, and the day of the month
 * under each so a circle can be found and tapped. The count itself is the circle's accessible
 * name and its `title`; on the screen the shape is the answer.
 *
 * Oldest first, left to right, so the row reads like the calendar it is.
 */
export function StepsHistory({ days, goal, onEdit }: StepsHistoryProps) {
  const { t, locale } = useT();
  const ordered = [...days].reverse();
  return (
    <ul className="grid grid-cols-7 gap-x-2 gap-y-5" aria-label={t('app.stepsHistoryTitle')}>
      {ordered.map((d) => {
        const atGoal = d.logged && d.steps >= goal;
        const date = formatDate(locale, d.date);
        const name = d.logged
          ? t('app.stepsHistoryDay', { date, steps: formatNumber(locale, d.steps) })
          : `${date}: ${t('app.stepsNotLogged')}`;
        return (
          <li key={d.date} className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(d.date)}
              aria-label={`${name}. ${t('app.stepsEdit')}`}
              title={name}
              className={clsx(
                'flex size-11 items-center justify-center rounded-pill border transition-[transform,opacity] duration-150 ease-(--ease-out) hover:opacity-85 active:scale-[0.96]',
                atGoal
                  ? 'border-transparent bg-paper text-ink'
                  : d.logged
                    ? 'border-border-strong text-muted'
                    : 'border-border text-muted-2',
              )}
            >
              {atGoal ? (
                <Glyph size={14}>✓</Glyph>
              ) : (
                <span className="font-display text-[12px] leading-none" aria-hidden="true">
                  {weekdayLabel(locale, d.date).slice(0, 1)}
                </span>
              )}
            </button>
            <span className="numeral tabular text-[10px] text-muted-2" aria-hidden="true">
              {dayOfMonthLabel(d.date)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
