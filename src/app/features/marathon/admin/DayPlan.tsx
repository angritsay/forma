/**
 * The day plan: a calendar you open, a date you tap, and that day's tasks under it.
 *
 * It was a horizontal strip of day numbers — 1, 2, 3 … 28 — and that is not how anyone plans a
 * week. The coach thinks in dates: "Monday" and "the 14th" and "tomorrow", not "day 9 of 28". A
 * calendar is also the only shape that shows a whole week at once, which is the question he
 * actually has on a Sunday evening — what is set for the days coming up, and which mornings are
 * still blank.
 *
 * Marathon days are the only tappable cells; everything outside the run is drawn but dead. A day
 * with something on it carries a dot, today carries a ring, and the day being edited is filled.
 * That is the whole legend.
 */
import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { formatNumber, type TKey, type TParams } from '@/i18n/index';
import type { MarathonRow, MarathonTaskRow, MarathonTaskTarget } from '@/lib/api/types';
import { addDays } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';

export interface DayPlanProps {
  marathon: MarathonRow;
  tasks: readonly MarathonTaskRow[];
  /** Who each task goes to, by task id. Missing or empty means everyone. */
  targets: Map<string, MarathonTaskTarget[]>;
  /** Names for the recipients, by team id and member id. */
  names: Map<string, string>;
  day: number;
  today: number;
  onDay: (day: number) => void;
  onOpenTask: (task: MarathonTaskRow) => void;
  onAddTask: () => void;
  onCopyYesterday: () => void;
}

/** The date a marathon day falls on. Day 1 is `startsOn`. */
export function dateOfDay(startsOn: string, dayIndex: number): string {
  return addDays(startsOn, dayIndex - 1);
}

/** Which marathon day a date is, or 0 when it is outside the run. */
function dayOfDate(startsOn: string, days: number, iso: string): number {
  const ms = Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${startsOn}T00:00:00Z`);
  const n = Math.round(ms / 86_400_000) + 1;
  return n >= 1 && n <= days ? n : 0;
}

/** Monday-first weekday index, because the weeks in this product start on Monday. */
function mondayFirst(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

export function DayPlan({
  marathon,
  tasks,
  targets,
  names,
  day,
  today,
  onDay,
  onOpenTask,
  onAddTask,
  onCopyYesterday,
}: DayPlanProps) {
  const { t, locale } = useT();
  const selectedIso = dateOfDay(marathon.startsOn, day);
  const [monthOf, setMonthOf] = useState(selectedIso.slice(0, 7));

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    for (const task of tasks) map.set(task.dayIndex, (map.get(task.dayIndex) ?? 0) + 1);
    return map;
  }, [tasks]);

  /** The visible month as a grid of whole weeks, so every row has seven cells. */
  const grid = useMemo(() => {
    const [y, m] = monthOf.split('-').map(Number);
    const first = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, 1));
    const start = new Date(first);
    start.setUTCDate(1 - mondayFirst(first));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [monthOf]);

  const monthName = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthOf}-01T00:00:00Z`));

  const shiftMonth = (by: number) => {
    const [y, m] = monthOf.split('-').map(Number);
    const d = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1 + by, 1));
    setMonthOf(d.toISOString().slice(0, 7));
  };

  const onThisDay = tasks
    .filter((task) => task.dayIndex === day)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
      weekday: 'short',
      timeZone: 'UTC',
    });
    // 2024-01-01 was a Monday, so this walks Monday → Sunday in the viewer's own language.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2024, 0, 1 + i))));
  }, [locale]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label={t('app.mAdminPrevMonth')}
          className="flex size-9 items-center justify-center text-muted hover:text-text"
        >
          <Glyph size={16}>‹</Glyph>
        </button>
        <h2 className="font-display text-base first-letter:uppercase">{monthName}</h2>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label={t('app.mAdminNextMonth')}
          className="flex size-9 items-center justify-center text-muted hover:text-text"
        >
          <Glyph size={16}>›</Glyph>
        </button>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 pb-1.5">
          {weekdays.map((name) => (
            <span key={name} className="control-label text-center text-[10px] text-muted-2">
              {name}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={t('app.mAdminTabPlan')}>
          {grid.map((iso) => {
            const n = dayOfDate(marathon.startsOn, marathon.days, iso);
            const inRun = n > 0;
            const selected = n === day;
            const isToday = n > 0 && n === today;
            const count = counts.get(n) ?? 0;
            const dayNumber = Number(iso.slice(8, 10));
            return (
              <button
                key={iso}
                type="button"
                role="gridcell"
                disabled={!inRun}
                aria-current={selected ? 'date' : undefined}
                aria-label={`${iso}${count > 0 ? ` · ${t('app.mAdminTaskCount', { n: count })}` : ''}`}
                onClick={() => inRun && onDay(n)}
                className={clsx(
                  'relative flex aspect-square flex-col items-center justify-center border text-[13px]',
                  'transition-colors duration-150 ease-(--ease-out)',
                  selected
                    ? 'border-primary bg-primary text-bg'
                    : inRun
                      ? 'border-border text-text hover:bg-surface-2'
                      : // Outside the run: drawn so the week keeps its shape, and nothing more.
                        'border-transparent text-muted-2/40',
                  isToday && !selected && 'border-primary',
                )}
              >
                <span className="numeral tabular leading-none">{dayNumber}</span>
                <span
                  aria-hidden="true"
                  className={clsx(
                    'mt-1 size-1 rounded-full',
                    count > 0 ? (selected ? 'bg-bg' : 'bg-text') : 'bg-transparent',
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <h3 className="font-display text-xl">
          {longDate(locale, selectedIso)}
          {day === today ? (
            <span className="ml-2 text-[13px] font-normal text-muted-2">
              {t('app.mAdminDayToday')}
            </span>
          ) : null}
        </h3>
        <span className="eyebrow whitespace-nowrap">
          {t('app.mAdminDay', { n: formatNumber(locale, day) })}
        </span>
      </div>

      {onThisDay.length === 0 ? (
        <p className="py-4 text-[15px] text-muted-2">{t('app.mAdminDayEmpty')}</p>
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
                    {/* Who it went to comes first: on a day with three tasks it is the difference. */}
                    <span>{recipientsLabel(t, targets.get(task.id), names)}</span>
                    <span className="text-muted-2">· {ruleWord(task, t)}</span>
                  </span>
                </span>
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

/**
 * «12 сентября, сб» — the heading over the day being edited, and the title of the sheet that
 * opens from it. A short weekday, because the long one wrapped the heading onto two lines and the
 * date is the part being read.
 */
export function longDate(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** «Всем», or the names it was actually sent to. */
function recipientsLabel(
  t: (key: TKey, params?: TParams) => string,
  targets: MarathonTaskTarget[] | undefined,
  names: Map<string, string>,
): string {
  if (!targets || targets.length === 0) return t('app.mAdminSendAll');
  const who = targets
    .map((g) => names.get(g.teamId ?? g.memberId ?? '') ?? '—')
    .filter(Boolean)
    .join(', ');
  return t('app.mAdminSendSummary', { who });
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
