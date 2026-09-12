/**
 * The day plan: a strip of days across the top, the chosen day's tasks below it.
 *
 * The strip is the point. A marathon is authored one morning at a time, so the question the screen
 * has to answer instantly is "what did I set yesterday, and what is there for tomorrow" — a list of
 * every task in the run, sorted by day, answers it much worse than fourteen numbers you can tap.
 *
 * A day that already has tasks is marked; today is marked differently. That is the whole legend.
 */
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { formatNumber, type TKey, type TParams } from '@/i18n/index';
import type { MarathonRow, MarathonTaskRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface DayPlanProps {
  marathon: MarathonRow;
  tasks: readonly MarathonTaskRow[];
  day: number;
  today: number;
  onDay: (day: number) => void;
  onOpenTask: (task: MarathonTaskRow) => void;
  onAddTask: () => void;
  onCopyYesterday: () => void;
}

export function DayPlan({
  marathon,
  tasks,
  day,
  today,
  onDay,
  onOpenTask,
  onAddTask,
  onCopyYesterday,
}: DayPlanProps) {
  const { t, locale } = useT();
  const strip = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: marathon.days }, (_, i) => i + 1);

  /*
   * Bring the chosen day into view. The screen opens on today, which on a four-week marathon is
   * far off the right edge of the strip — without this the coach lands on a row of days he is not
   * working on and has to scroll to find the one he is.
   */
  useEffect(() => {
    const selected = strip.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    selected?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [day]);
  const counts = new Map<number, number>();
  for (const task of tasks) counts.set(task.dayIndex, (counts.get(task.dayIndex) ?? 0) + 1);
  const onThisDay = tasks
    .filter((task) => task.dayIndex === day)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-col gap-5">
      <div
        ref={strip}
        role="radiogroup"
        aria-label={t('app.mAdminTabPlan')}
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:-mx-8 lg:px-8"
      >
        {days.map((n) => {
          const count = counts.get(n) ?? 0;
          const selected = n === day;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onDay(n)}
              className={clsx(
                'flex size-12 shrink-0 flex-col items-center justify-center border transition-colors duration-150 ease-(--ease-out)',
                selected
                  ? 'border-primary bg-primary text-bg'
                  : 'border-border text-muted hover:bg-surface-2',
              )}
            >
              <span className="numeral tabular text-[15px] leading-none">{n}</span>
              {/*
               * One dot for "this day has something in it". A count would be noise: what matters
               * at a glance is which mornings are still blank.
               */}
              <span
                aria-hidden="true"
                className={clsx(
                  'mt-1 size-1 rounded-full',
                  count > 0 ? (selected ? 'bg-bg' : 'bg-muted') : 'bg-transparent',
                )}
              />
            </button>
          );
        })}
      </div>

      {/*
       * The day's heading on its own line. It shared a row with «Скопировать вчерашний день», and
       * the two of them together are wider than a phone: the heading wrapped between «ДЕНЬ» and
       * «10», which is the one thing on this screen that must read at a glance.
       */}
      <h2 className="font-display text-xl">
        {t('app.mAdminDay', { n: formatNumber(locale, day) })}
        {day === today ? (
          <span className="ml-2 text-[13px] font-normal text-muted-2">
            {t('app.mAdminDayToday')}
          </span>
        ) : null}
      </h2>

      {onThisDay.length === 0 ? (
        <p className="border-t border-border py-6 text-[15px] text-muted-2">
          {t('app.mAdminDayEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {onThisDay.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onOpenTask(task)}
                className="flex w-full items-center gap-3 border-t border-border py-3.5 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 active:bg-surface-3"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-display truncate text-[15px] leading-[1.24]">
                    {task.title}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{ruleWord(task, t)}</span>
                    {task.audience !== 'all' ? (
                      <span>
                        ·{' '}
                        {task.audience === 'teams'
                          ? t('app.mAdminAudienceTeams')
                          : t('app.mAdminAudienceSolo')}
                      </span>
                    ) : null}
                    {task.proofVisibility === 'coach' ? (
                      <span>· {t('app.mAdminVisibilityCoach')}</span>
                    ) : null}
                  </span>
                </span>
                {/* The rule already says «Без баллов»; a badge repeating it is the same word twice. */}
                {task.rule !== 'none' ? (
                  <span className="numeral tabular shrink-0 text-sm text-muted">
                    {formatNumber(locale, task.points)}
                  </span>
                ) : null}
                <Glyph size={16} className="shrink-0 text-muted-2">
                  ›
                </Glyph>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="md" onClick={onAddTask}>
          {t('app.mAdminAddTask')}
        </Button>
        {day > 1 ? (
          <Button variant="ghost" size="md" onClick={onCopyYesterday}>
            {t('app.mAdminCopyDay')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** The rule in the same words the athlete's card uses, so both sides describe it the same way. */
function ruleWord(task: MarathonTaskRow, t: (key: TKey, params?: TParams) => string): string {
  switch (task.rule) {
    case 'all_members':
      return t('app.marathonRuleAllMembers');
    case 'per_member':
      return t('app.marathonRulePerMember');
    case 'capped':
      return t('app.marathonRuleCapped', { n: task.cap ?? 0 });
    case 'none':
      return t('app.marathonRuleNone');
  }
}
