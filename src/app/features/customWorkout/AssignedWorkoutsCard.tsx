/**
 * «Тренировки от тренера» — то, что он собрал лично, первым блоком на «Курсах».
 *
 * Владелец: «эту тренировку нужно показывать на странице, на вкладке "Курсы" отдельно плашкой, что
 * вам выдали упражнение на сегодня… Плашка находится первой над колодой курсов, тренировка висит
 * до тех пор, пока не выполнена. Тренер может выдать несколько, и они на выбор пользователя: какую
 * хочет, такую выбирает… Сделай этот блок не так, чтобы одна тренировка под другой была, а вот
 * этот блок тренировок от тренера был каруселькой, которую ты свайпишь.»
 *
 * **До этой правки блока не было видно вообще.** Компонент существовал, был написан под «Сегодня»
 * и остался несмонтированным, когда главный экран переделали, — так что выданная тренировка не
 * появлялась нигде, и открыть её можно было только ссылкой. Тренер выдавал в пустоту.
 *
 * ## Почему карусель, а не список
 *
 * Список из одной строки — это не список, а строка, и читается как пункт меню. Карточка шириной
 * почти в экран — это предложение, которое видно; несколько таких листаются, и «какую хочет, такую
 * выбирает» становится жестом вместо чтения. Лента та же, что у фотографий клуба:
 * `.deck-scroller`, снап по кадрам, выход за оба края экрана и возврат паддингом — чтобы соседняя
 * карточка выглядывала и было понятно, что там есть ещё.
 *
 * ## Что значит «висит, пока не выполнена»
 *
 * Выполнение живёт там же, где у всего остального, — строкой в `workout_sessions` с
 * `course_id = 'custom'`, и `my_done_custom_workouts()` (0024) отдаёт короткие id сделанных.
 * Считать это по стору прогресса нельзя: там окно из последних сессий, и тренировка, сделанная
 * месяц назад, вернулась бы на экран.
 *
 * Пока ничего не выдано — не рисуется ничего. Пустая полка с заголовком на экране человека,
 * которому не выдавали, — это обещание, которого никто не давал.
 */
import { useEffect, useState } from 'react';
import { Glyph } from '@/components/ui/Icon';
import { listDoneCustomWorkouts, listMyAssignedWorkouts } from '@/lib/api/customWorkouts';
import type { AssignedWorkoutRow } from '@/lib/api/types';
import { withBase } from '@/lib/util/paths';
import { AUTHORS, authorById } from '@content/site/authors';
import { useT } from '@/app/hooks/useT';

export interface AssignedWorkoutsCardProps {
  onOpen: (id: string) => void;
}

/** Лицо и имя того, чья это работа. Ничего не рисует, если подписать некем. */
function AuthorLine({ slug }: { slug: string | null }) {
  const { l } = useT();
  const author = authorById(slug);
  if (!author) return null;
  return (
    <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
      {author.photo ? (
        <img
          src={withBase(author.photo)}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 rounded-full object-cover"
        />
      ) : null}
      <span className="truncate">{l(author.name)}</span>
    </span>
  );
}

export function AssignedWorkoutsCard({ onOpen }: AssignedWorkoutsCardProps) {
  const { t } = useT();
  const [rows, setRows] = useState<AssignedWorkoutRow[]>([]);

  useEffect(() => {
    let alive = true;
    /*
     * Оба разом, и отказ любого оставляет полку пустой, а не наполовину правдивой: показать
     * сделанную тренировку как невыполненную хуже, чем не показать ничего.
     */
    Promise.all([listMyAssignedWorkouts(), listDoneCustomWorkouts()])
      .then(([assigned, done]) => {
        if (!alive) return;
        const finished = new Set(done);
        setRows(assigned.filter((w) => !finished.has(w.shortId)));
      })
      .catch(() => {
        /* Пропавший список от тренера никогда не ломает экран курсов. */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (rows.length === 0) return null;
  const many = rows.length > 1;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl">{t('app.homeCoachWorkouts')}</h2>
        {/* Счётчик только когда есть из чего выбирать: «01» над одной карточкой — это арифметика. */}
        {many ? (
          <span className="eyebrow tabular">{String(rows.length).padStart(2, '0')}</span>
        ) : null}
      </div>

      {/*
       * `-mx-4 px-4` против собственного `px-4` экрана: лента доходит до края, соседняя карточка
       * уезжает под него, а первая по-прежнему стоит по вертикали слов над ней. `scroll-px-4`
       * заставляет снап приземлять её туда же.
       */}
      <ul className="deck-scroller -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:-mx-10 md:scroll-px-10 md:px-10">
        {rows.map((w) => {
          const minutes = w.estSec ? Math.max(1, Math.round(w.estSec / 60)) : null;
          return (
            <li
              key={w.id}
              /* Одна карточка — во всю ширину; со второй начинает выглядывать следующая, и только
                 это говорит, что лента продолжается. */
              className={many ? 'w-[86%] max-w-[420px] shrink-0 snap-start' : 'w-full'}
            >
              <button
                type="button"
                onClick={() => onOpen(w.id)}
                className="flex h-full w-full flex-col items-start gap-2.5 rounded-card border border-border bg-surface p-5 text-left transition-[background-color,transform] duration-150 ease-(--ease-out) hover:bg-surface-2 active:scale-[0.99]"
              >
                {/* Без надписи «От тренера»: она уже стоит заголовком над лентой, и на карточке
                    была бы тем же предложением в третий раз — считая экран самой тренировки.
                    Там она нужна, потому что туда приходят и по ссылке, мимо этой полки. */}
                <span className="font-display line-clamp-2 text-[19px] leading-[1.2] text-balance">
                  {w.title}
                </span>
                {/*
                  Имя автора — только когда авторов больше одного.
                  
                  Пока тренер один, «от Сергея» повторяет заголовок над лентой и не сообщает
                  ничего: других вариантов нет. С йогой вариант появляется, и тогда имя — это уже
                  новость, а не подпись ради подписи. Тот же порог, что у выбора в редакторе.
                */}
                {AUTHORS.length > 1 ? <AuthorLine slug={w.authorSlug} /> : null}
                {minutes || w.points ? (
                  <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                    {minutes ? (
                      <span className="tabular">{t('app.nodeDuration', { min: minutes })}</span>
                    ) : null}
                    {w.points ? (
                      <span className="tabular">{t('app.nodePoints', { n: w.points })}</span>
                    ) : null}
                  </span>
                ) : null}
                <span className="control-label mt-1 inline-flex items-center gap-1.5 text-[14px] text-text">
                  {t('app.customWorkoutOpen')}
                  <Glyph size={13} className="text-muted-2">
                    →
                  </Glyph>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
