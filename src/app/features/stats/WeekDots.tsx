/**
 * The week as seven circles — Monday to Sunday, a check on every day that counted, the weekday's
 * letter on the rest — under a kicker and the score «3 / 5».
 *
 * This is the prototype's «Цель недели» (`design/ui_kits/app-v2`, «Ты»), and it is the first of
 * the three figures that give somebody a reason to come back to this tab: the week you are in the
 * middle of. The goal is the course's own `sessionsPerWeek`, so «3 / 5» is a fact about the
 * programme and not a number this screen made up; with no course in progress there is no goal to
 * name, the kicker reads «Эта неделя» and the score is the count alone.
 *
 * A day that counted is a white circle with a check, landing on the spring; a day that did not is
 * a hairline; a day still to come is a fainter hairline. Today, when it has not counted yet, keeps
 * its letter but in full white — the day the eye should land on.
 */
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { formatDate, formatNumber } from '@/i18n/index';
import { weekdayLabel } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';
import type { WeekDay } from './model';

export interface WeekDotsProps {
  days: readonly WeekDay[];
  /** Sessions the current course asks for in a week; null without a course. */
  goal: number | null;
}

export function WeekDots({ days, goal }: WeekDotsProps) {
  const { t, locale } = useT();
  const done = days.filter((d) => d.active).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">{goal ? t('app.statsWeekGoal') : t('app.statsWeekTitle')}</h2>
        <span className="numeral tabular text-[15px]">
          {formatNumber(locale, done)}
          {goal ? ` / ${formatNumber(locale, goal)}` : ''}
        </span>
      </div>
      {/* Seven across, capped so that on a laptop they stay a row of days and not a row of buoys. */}
      <ol className="flex max-w-[420px] justify-between gap-2">
        {days.map((d) => {
          const label = formatDate(locale, d.date);
          return (
            <li
              key={d.date}
              aria-label={
                d.active
                  ? t('app.statsWeekDayDone', { date: label })
                  : d.future
                    ? t('app.statsWeekDayAhead', { date: label })
                    : t('app.statsWeekDayEmpty', { date: label })
              }
              aria-current={d.today ? 'date' : undefined}
              className={clsx(
                'flex size-11 items-center justify-center rounded-pill border',
                d.active
                  ? 'pop-in border-transparent bg-paper text-ink'
                  : d.future
                    ? 'border-border text-muted-2'
                    : d.today
                      ? 'border-border-strong text-text'
                      : 'border-border-strong text-muted',
              )}
            >
              {d.active ? (
                <Glyph size={14}>✓</Glyph>
              ) : (
                <span className="font-display text-[12px] leading-none" aria-hidden="true">
                  {weekdayLabel(locale, d.date).slice(0, 1)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
