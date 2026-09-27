/**
 * «7 дней подряд» — серия клуба, как плашка в шапке вкладки.
 *
 * Владелец о том, где ей быть: «показывают в том же месте, как у нас это сделано на курсах,
 * только вместо иконки с наградами иконка горящего огонёчка». На «Курсах» это правый верхний угол
 * с двумя контролами на тёмно-серой плашке — пилюля с 💪 и числом, и кружок с розеткой
 * (`CoursesHead.tsx`). Здесь та же плашка и то же место, а внутри 🔥 и число дней. Теперь она
 * стоит в строке дня (`ClubDay`) — тот же правый край, но у неё есть строка, на которой стоять.
 *
 * **Форма — пилюля, а не кружок, и это единственное отступление от её слов.** Кружок в той паре
 * несёт знак и ничего больше; здесь число и есть всё содержание — «показывать, сколько дней
 * подряд ты выполняешь упражнения», — а двузначное число в кружке 36px не читается. Пилюля рядом
 * с ним держит ровно эту пару «эмодзи + число», и это её собственный шаблон, а не новый.
 *
 * **🔥 здесь уместен ровно потому, почему он был неуместен там.** `CoursesHead` отказался от него
 * дословно: «a flame is a thing that goes out, which is the wrong promise for a tally that cannot».
 * Счётчик тренировок и правда не гаснет. Серия — гаснет, в этом вся её механика, и огонь наконец
 * обещает то, что есть.
 *
 * **Цвет — градиент клуба** (третья палитра, global.css, стиль B): кант плашки — crossroads, а
 * рядом с числом — неделя точками, последние семь дней: сделанные — бусины одного градиента,
 * сегодня — оранжевый, горячий конец того же градиента (в клубе нет неона, design/CHANGELOG.md
 * §17). Точки повторяют то, что число уже сказало словами, поэтому для чтеца экрана они
 * скрыты: `aria-label` плашки остаётся единственным, что он слышит.
 *
 * Пустая серия не рисуется вовсе. Ноль в плашке — это укор человеку, который сегодня ещё не дошёл
 * до задания, и выдаётся он в тот же момент, когда экран просит его это задание сделать.
 *
 * ## The game around the number (the owner's «регулярная подпитка дофамином»)
 *
 * Three things were added to the pill without changing what it says:
 *
 *   - **The evening.** After 18:00 local on a day the task is not in, the streak is at risk, and
 *     the pill says so: a slow pulse (`.streak-pulse`, off under reduced motion) and one line
 *     under it — «Серия сгорит сегодня». Fear of losing a thing you made is the strongest pull
 *     the club has, and it is honest: the streak *will* go at midnight. It stops the moment the
 *     proof is sent.
 *   - **A sheet.** The pill is a button now. It was deliberately not one — «a control that does
 *     nothing when pressed is worse than a fact that never invited the press» — and the sheet is
 *     what it opens onto: the seven days as a calendar with the dates, the streak set large, the
 *     milestones (3 · 7 · 14 · 30 · 100; `clubMilestones.ts`) with the reached ones filled in the
 *     warm gradient and the next one as a ring, and how many days to it.
 *   - **A milestone lands.** On the day the streak reaches one of the five, `celebrate` fires
 *     once — remembered per milestone in `clubMemory`, so a reload does not throw confetti twice.
 *
 * The days are loaded by the screen (`useClubDays`) and passed in, because the week's recap reads
 * the same list; the screen bumps `version` after a proof so the pill and the recap move at once.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { DotCalendar, type DotDay } from '@/components/ui/DotCalendar';
import { RingProgress } from '@/components/ui/RingProgress';
import { Sheet } from '@/components/ui/Sheet';
import { formatDate, formatNumber, plural, type Locale } from '@/i18n/index';
import { getMyClubDays } from '@/lib/api/marathon';
import { prefersReducedMotion } from '@/lib/ui/motion';
import { toLocalDateIso } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';
import { celebrate } from './ClubCelebrate';
import { hasMilestone, rememberMilestone } from './clubMemory';
import { MILESTONES, nextMilestone, reachedMilestone } from './clubMilestones';
import { clubStreak, clubStreakDoneToday } from './streak';
import { useClubMemory } from './useClubMemory';

/** The hour from which a day without a proof is a streak at risk. */
export const STREAK_RISK_HOUR = 18;

/** `my_club_days()` for `today`, re-read whenever `version` changes; null until it arrives. */
export function useClubDays(today: string, version = 0): readonly string[] | null {
  const [days, setDays] = useState<readonly string[] | null>(null);
  useEffect(() => {
    let alive = true;
    getMyClubDays(today)
      .then((d) => {
        if (alive) setDays(d);
      })
      .catch(() => {
        /* No streak and could-not-ask look the same: neither is worth an error in a corner. */
      });
    return () => {
      alive = false;
    };
  }, [today, version]);
  return days;
}

export interface ClubStreakProps {
  days: readonly string[] | null;
  /** The member's local `YYYY-MM-DD`, fixed by the screen so the streak never moves mid-visit. */
  today: string;
  /** The local hour, for the at-risk state. Defaults to the clock at render. */
  hour?: number;
}

export function ClubStreak({ days, today, hour }: ClubStreakProps) {
  const { t, locale } = useT();
  const { memory, update } = useClubMemory();
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);

  const week = useMemo(() => (days ? lastWeek(days, today, locale) : []), [days, today, locale]);
  const n = days ? clubStreak(days, today) : 0;
  const doneToday = days ? clubStreakDoneToday(days, today) : false;
  const localHour = hour ?? new Date().getHours();
  const atRisk = n > 0 && !doneToday && localHour >= STREAK_RISK_HOUR;

  /*
   * The milestone reached *today*: the one crossed between yesterday's count and today's, which
   * is only ever the streak itself. Celebrated once per milestone ever (`clubMemory`), so a
   * reload, a tab switch or a second proof on the same day cannot repeat it.
   */
  useEffect(() => {
    if (!doneToday) return;
    const reached = reachedMilestone(n - 1, n);
    if (reached === null || hasMilestone(memory, reached)) return;
    update((m) => rememberMilestone(m, reached));
    celebrate({ text: `${formatNumber(locale, reached)} 🔥`, anchor: pillRef.current });
  }, [n, doneToday, memory, update, locale]);

  if (!days || n === 0) return null;

  const label = plural(locale, n, {
    one: t('app.clubStreakOne', { n: formatNumber(locale, n) }),
    few: t('app.clubStreakFew', { n: formatNumber(locale, n) }),
    many: t('app.clubStreakMany', { n: formatNumber(locale, n) }),
  });

  return (
    <div className="flex flex-col items-end gap-1 pt-1">
      {/* The rim: the crossroads gradient showing 1.5px around the pill's own ground. It is the
          rim that pulses, so the whole pill breathes and not only its label. */}
      <span
        className={
          atRisk && !prefersReducedMotion()
            ? 'streak-pulse flex h-9 shrink-0 rounded-pill bg-cross p-[1.5px]'
            : 'flex h-9 shrink-0 rounded-pill bg-cross p-[1.5px]'
        }
      >
        <button
          ref={pillRef}
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="flex h-full items-center gap-1.5 rounded-pill bg-surface-2 px-3 text-text"
        >
          {/*
           * `.emoji` is the shared setting (global.css): a fixed square, off the baseline, with the
           * colour-emoji font named ahead of the fallbacks so the Android WebView cannot resolve it
           * to a tofu box. 15px is the drawn size `CoursesHead` uses in the same pill.
           *
           * Dimmed until today's task is in. The streak is still alive — a day is not lost until it
           * is over — but it is the difference between «держится» and «продлена», and it is the one
           * thing this pill can say without a second line.
           */}
          <span
            aria-hidden="true"
            className={doneToday ? 'emoji' : 'emoji opacity-55'}
            style={{ fontSize: 15 }}
          >
            🔥
          </span>
          <span className="tabular text-[13px] leading-none font-medium">
            {formatNumber(locale, n)}
          </span>
          <DotCalendar days={week} size="sm" columns={7} todayTone="orange" className="ml-1" />
        </button>
      </span>
      {atRisk ? (
        <span className="text-[12px] leading-none text-orange">{t('app.clubStreakAtRisk')}</span>
      ) : null}

      <Sheet open={open} onClose={() => setOpen(false)} title={t('app.clubStreakSheetTitle')}>
        <StreakSheet n={n} week={week} atRisk={atRisk} />
      </Sheet>
    </div>
  );
}

/** The sheet's body: the number, the week, the milestones. */
function StreakSheet({ n, week, atRisk }: { n: number; week: DotDay[]; atRisk: boolean }) {
  const { t, locale } = useT();
  const next = nextMilestone(n);
  const toNext = next === null ? 0 : next - n;
  const daysWord = plural(locale, n, {
    one: t('app.clubStreakDaysOne'),
    few: t('app.clubStreakDaysFew'),
    many: t('app.clubStreakDaysMany'),
  });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-3">
        <span className="display text-6xl">{formatNumber(locale, n)}</span>
        <span className="text-[15px] text-muted">{daysWord}</span>
        {/* On the sheet's own glass, never on a fill (`contrast-usage.test.ts`). */}
        <span aria-hidden="true" className="emoji" style={{ fontSize: 22 }}>
          🔥
        </span>
      </div>
      {atRisk ? <p className="text-[14px] text-orange">{t('app.clubStreakAtRisk')}</p> : null}

      <DotCalendar
        days={week}
        size="md"
        columns={7}
        todayTone="orange"
        label={t('app.clubStreakWeek')}
      />

      <div className="flex flex-col gap-3">
        <span className="eyebrow">{t('app.clubMilestonesTitle')}</span>
        <ol className="flex items-center justify-between" aria-label={t('app.clubMilestonesTitle')}>
          {MILESTONES.map((m) => {
            const reached = m <= n;
            const isNext = m === next;
            return (
              <li key={m} className="flex flex-col items-center gap-1">
                {isNext ? (
                  /* The next landmark as a ring filling up — progress is the light blue's job. */
                  <RingProgress
                    size={40}
                    stroke={3}
                    value={n / m}
                    label={t('app.clubMilestoneRing', { n: formatNumber(locale, m) })}
                    valueText={`${n} / ${m}`}
                  >
                    <span className="numeral text-[12px] text-text">{formatNumber(locale, m)}</span>
                  </RingProgress>
                ) : (
                  <span
                    className={
                      reached
                        ? /* Reached: the club's warm gradient under ink, like the leader's circle. */
                          'numeral flex size-10 items-center justify-center rounded-pill bg-warm text-[12px] text-ink'
                        : 'numeral flex size-10 items-center justify-center rounded-pill border border-border text-[12px] text-muted-2'
                    }
                    aria-label={t(reached ? 'app.clubMilestoneDone' : 'app.clubMilestoneAhead', {
                      n: formatNumber(locale, m),
                    })}
                  >
                    {formatNumber(locale, m)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-[13px] text-muted">
          {next === null
            ? t('app.clubMilestonesAll')
            : plural(locale, toNext, {
                one: t('app.clubMilestoneNextOne', { n: formatNumber(locale, toNext) }),
                few: t('app.clubMilestoneNextFew', { n: formatNumber(locale, toNext) }),
                many: t('app.clubMilestoneNextMany', { n: formatNumber(locale, toNext) }),
              })}
        </p>
      </div>
    </div>
  );
}

/**
 * The last seven days, oldest first, as dots: done where a proof is in, orange for today, an open
 * ring for a day that went by without one. Dates are compared as the same `YYYY-MM-DD` strings
 * `my_club_days()` returns, stepped back from `today` at local noon so a DST change cannot skip a
 * day. Each dot carries the date and its day of the month for the sheet's larger calendar; the
 * pill's strip ignores both.
 */
function lastWeek(days: readonly string[], today: string, locale: Locale): DotDay[] {
  const done = new Set(days);
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  const out: DotDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = new Date(y, m - 1, d - back, 12);
    const iso = toLocalDateIso(date);
    const isToday = back === 0;
    out.push({
      key: iso,
      state: isToday ? (done.has(iso) ? 'today-done' : 'today') : done.has(iso) ? 'done' : 'open',
      day: date.getDate(),
      label: `${formatDate(locale, iso)}${done.has(iso) ? ' ✓' : ''}`,
    });
  }
  return out;
}
