/**
 * «7 дней подряд» — серия клуба, как плашка в шапке вкладки.
 *
 * Владелец о том, где ей быть: «показывают в том же месте, как у нас это сделано на курсах,
 * только вместо иконки с наградами иконка горящего огонёчка». На «Курсах» это правый верхний угол
 * с двумя контролами на тёмно-серой плашке — пилюля с 💪 и числом, и кружок с розеткой
 * (`CoursesHead.tsx`). Здесь та же плашка и то же место, а внутри 🔥 и число дней.
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
 */
import { useEffect, useMemo, useState } from 'react';
import { DotCalendar, type DotDay } from '@/components/ui/DotCalendar';
import { formatNumber, plural } from '@/i18n/index';
import { getMyClubDays } from '@/lib/api/marathon';
import { toLocalDateIso } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';
import { clubStreak, clubStreakDoneToday } from './streak';

export function ClubStreak() {
  const { t, locale } = useT();
  const [days, setDays] = useState<readonly string[] | null>(null);
  // Fixed per mount: the streak must not change under the reader because a render happened.
  const [today] = useState(() => toLocalDateIso(new Date()));

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
  }, [today]);

  const week = useMemo(() => (days ? lastWeek(days, today) : []), [days, today]);

  if (!days) return null;
  const n = clubStreak(days, today);
  if (n === 0) return null;

  const doneToday = clubStreakDoneToday(days, today);
  const label = plural(locale, n, {
    one: t('app.clubStreakOne', { n: formatNumber(locale, n) }),
    few: t('app.clubStreakFew', { n: formatNumber(locale, n) }),
    many: t('app.clubStreakMany', { n: formatNumber(locale, n) }),
  });

  return (
    /* No side padding of its own: unlike `CoursesHead`, which lives in a `padded={false}` screen
       and carries the gutter itself, this sits inside the club's ordinary padded `<main>`. */
    <div className="flex items-start justify-end pt-1">
      {/* The rim: the crossroads gradient showing 1.5px around the pill's own ground. */}
      <span className="flex h-9 shrink-0 rounded-pill bg-cross p-[1.5px]">
        <span
          /*
           * Not a button: there is nothing behind it to open. The pill on «Курсы» opens the training
           * calendar; a streak has no second screen, and a control that does nothing when pressed is
           * worse than a fact that never invited the press.
           */
          aria-label={label}
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
        </span>
      </span>
    </div>
  );
}

/**
 * The last seven days, oldest first, as dots: done where a proof is in, orange for today, an open
 * ring for a day that went by without one. Dates are compared as the same `YYYY-MM-DD` strings
 * `my_club_days()` returns, stepped back from `today` at local noon so a DST change cannot skip a
 * day.
 */
function lastWeek(days: readonly string[], today: string): DotDay[] {
  const done = new Set(days);
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  const out: DotDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const iso = toLocalDateIso(new Date(y, m - 1, d - back, 12));
    const isToday = back === 0;
    out.push({
      key: iso,
      state: isToday ? (done.has(iso) ? 'today-done' : 'today') : done.has(iso) ? 'done' : 'open',
    });
  }
  return out;
}
