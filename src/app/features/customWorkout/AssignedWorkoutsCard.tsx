/**
 * «Тренировки от тренера» — what the coach assembled personally, the first thing above the deck
 * on «Курсы».
 *
 * Owner: «эту тренировку нужно показывать на странице, на вкладке "Курсы" отдельно плашкой, что
 * вам выдали упражнение на сегодня… Плашка находится первой над колодой курсов, тренировка висит
 * до тех пор, пока не выполнена. Тренер может выдать несколько, и они на выбор пользователя: какую
 * хочет, такую выбирает… Сделай этот блок не так, чтобы одна тренировка под другой была, а вот
 * этот блок тренировок от тренера был каруселькой, которую ты свайпишь.»
 *
 * **Before this block was mounted it was not visible at all.** The component existed, was written
 * for «Сегодня» and stayed unmounted when the main screen was rebuilt — so an assigned workout
 * appeared nowhere and could only be opened by a link. The coach was assigning into a void.
 *
 * ## Why a carousel and not a list
 *
 * A list of one row is not a list but a row, and reads as a menu item. A card nearly as wide as
 * the screen is an offer that can be seen; several of them swipe, and «какую хочет, такую
 * выбирает» becomes a gesture instead of reading. The strip is the club photographs' own:
 * `.deck-scroller`, snapped per frame, bleeding past both edges of the screen and pulled back with
 * padding, so the next card peeks in and it is plain there is more.
 *
 * ## What «висит, пока не выполнена» means
 *
 * Completion lives where everything else's does — a row in `workout_sessions` with
 * `course_id = 'custom'`, and `my_done_custom_workouts()` (0024) returns the short ids of the
 * ones done. It cannot be counted off the progress store: that holds a window of recent sessions,
 * and a workout done a month ago would come back onto the screen.
 *
 * While nothing is assigned, nothing is drawn. An empty shelf with a heading, on the screen of a
 * person who was never assigned anything, is a promise nobody made.
 *
 * ## No heading, no counter, no author line, no «Открыть» (design/CHANGELOG.md §18)
 *
 * The block used to carry a section heading («Тренировки от тренера») with a «02» counter beside
 * it, and each card stacked five pieces: the tag, the title, the author's face and name, the meta
 * and «Открыть →». Owner, of the whole screen: «Слишком много типографики и элементов». So the
 * shelf is now the strip alone, with the heading kept as the list's accessible name, and every
 * card has the one grammar every card on «Курсы» has — **tag → title → one bottom row**:
 *
 *   - the **tag** is the «Тренер» pill, and when there is more than one author it says the
 *     author's name instead. The heading said «from the coach» once, the tag said it again, and
 *     the author line said it a third time; a tag that names the person says all three at once.
 *     While the coach is the only author the name is news to nobody, so the tag keeps the section
 *     word — the same threshold the editor's author picker uses;
 *   - the **title**, 22px display at 800, clamped to two lines — the same title every course card
 *     has, so the coach's field and the course photograph read as one deck;
 *   - the **bottom row**: minutes and equipment on the left («~24 мин · Стул»), and on the right
 *     the arrow in its dark circle — the same circle the course buttons carry inside their pill.
 *     The word «Открыть» is gone: the whole card is the button, and a label saying so was the
 *     card's fifth line. Owner on the meta: «вместо points нужно необходимое оборудование
 *     писать» — points are learnt after a workout, dumbbells are needed before it, and of
 *     everything that fits on this line only the equipment can change the decision.
 *
 * ## Why the cards are bright fields and not glass
 *
 * Owner: «для тренировок от тренера — яркие цвета» (design/CHANGELOG.md §17). Courses are
 * photographs under glass, the club is a gradient, and a workout the coach assigned is a solid
 * colour field: the one object on «Курсы» without a photograph, and colour here says «this was
 * made for you» louder than any label. The fields alternate by index — ciel, orange, neon
 * (`coachCardFill.ts`): ciel is the coach's colour and a single card is always ciel; the second
 * and third colours exist only so several cards in the strip tell apart on a swipe. Ink #111111
 * on all three, on the meta as well as the title and without transparency — ink at 80% over ciel
 * gives 3.9 and fails as small text, so the hierarchy is by size. The tag is dense glass tinted
 * from the ground with a white word (`Pill` `ink`), because a solid ciel tag on a ciel card
 * disappears, and neon on the card is identity, not «now».
 */
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { coachCardFill } from './coachCardFill';
import { listDoneCustomWorkouts, listMyAssignedWorkouts } from '@/lib/api/customWorkouts';
import type { CustomWorkoutStructure } from '@/lib/training/customWorkout';
import { workoutEquipment } from '@/lib/training/equipment';
import type { AssignedWorkoutRow } from '@/lib/api/types';
import { EXERCISE_BY_ID } from '@/content/registry';
import { AUTHORS, authorById } from '@content/site/authors';
import { useT } from '@/app/hooks/useT';

export interface AssignedWorkoutsCardProps {
  onOpen: (id: string) => void;
}

export function AssignedWorkoutsCard({ onOpen }: AssignedWorkoutsCardProps) {
  const { t, l } = useT();
  const [rows, setRows] = useState<AssignedWorkoutRow[]>([]);

  useEffect(() => {
    let alive = true;
    /*
     * Both at once, and either one failing leaves the shelf empty rather than half true: showing
     * a finished workout as unfinished is worse than showing nothing.
     */
    Promise.all([listMyAssignedWorkouts(), listDoneCustomWorkouts()])
      .then(([assigned, done]) => {
        if (!alive) return;
        const finished = new Set(done);
        setRows(assigned.filter((w) => !finished.has(w.shortId)));
      })
      .catch(() => {
        /* A missing list from the coach never breaks the courses screen. */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (rows.length === 0) return null;
  const many = rows.length > 1;

  /*
   * `-mx-4 px-4` against the screen's own `px-4`: the strip reaches the edge, the next card slides
   * under it, and the first still stands on the vertical of the head above. `scroll-px-4` makes
   * the snap land it there too. The heading is gone from the screen (§18), so the list carries it
   * as its name instead.
   */
  return (
    <ul
      aria-label={t('app.homeCoachWorkouts')}
      className="deck-scroller -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:-mx-10 md:scroll-px-10 md:px-10"
    >
      {rows.map((w, i) => {
        const minutes = w.estSec ? Math.max(1, Math.round(w.estSec / 60)) : null;
        const fill = coachCardFill(i);
        /*
         * Equipment is known by the exercise, not the workout: the workout has only a list of ids.
         * It comes from the compiled library — in the bundle, not waiting on the network — so the
         * line appears with the card and not a moment after it.
         */
        const gear = workoutEquipment(
          w.structure as CustomWorkoutStructure | null,
          (id) => EXERCISE_BY_ID.get(id)?.equipment,
        );
        const meta = [
          minutes ? t('app.nodeDuration', { min: minutes }) : null,
          gear.length > 0 ? gear.map((e) => t(`common.equipment_${e}`)).join(' · ') : null,
        ].filter((part): part is string => part !== null);
        /*
         * The author's name is the tag only once there is more than one author to tell apart;
         * with one, the section word. An assigned workout whose author no longer resolves falls
         * back to the section word as well, rather than to an empty pill.
         */
        const author = AUTHORS.length > 1 ? authorById(w.authorSlug) : null;
        const tag = author ? l(author.name) : t('app.tabCoach');
        return (
          <li
            key={w.id}
            /* One card fills the width; from the second the next one starts to peek, and that
               alone says the strip goes on. */
            className={many ? 'w-[86%] max-w-[420px] shrink-0 snap-start' : 'w-full'}
          >
            <button
              type="button"
              onClick={() => onOpen(w.id)}
              /* A field, not a plate: the colour by index (`coachCardFill`), ink on everything.
                 Hover is opacity rather than a surface: a solid colour has no «one step lighter». */
              className={clsx(
                'flex h-full w-full flex-col items-start gap-3 rounded-card p-4 text-left text-ink transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-90 active:scale-[0.99]',
                fill.className,
              )}
            >
              <Pill tone="ink">{tag}</Pill>
              <span className="font-display line-clamp-2 text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em] text-balance">
                {w.title}
              </span>
              {/* The bottom row: meta left, the arrow right. An empty span keeps the arrow at the
                  right end when a workout has neither a length nor equipment. The minutes are
                  `tabular` so «~24 мин» sits still beside the gear word. */}
              <span className="mt-auto flex w-full items-center justify-between gap-3">
                {meta.length > 0 ? (
                  <span className="tabular min-w-0 truncate text-[13px]">{meta.join(' · ')}</span>
                ) : (
                  <span />
                )}
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper"
                >
                  <Glyph size={13}>→</Glyph>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
