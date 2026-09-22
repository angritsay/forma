/**
 * Пять движений теста — списком, с тем, что по каждому уже записано.
 *
 * Владелец прислала экран со словами «это что за ужас»: полоска из пяти квадратиков, заголовок,
 * две пилюли — и полэкрана пустоты под ними. Экран не говорил ни что делать, ни что спросят, ни
 * что из этого уже сдано.
 *
 * Её же формулировка, чем это должно стать: «сделай эту страничку как хаб, где ты постепенно в
 * разное время можешь заполнять информацию. То есть мы показываем: планка ту ду, отжимания: 10
 * (если пользователь уже отметил выполнение)».
 *
 * ## Список, а не полоска
 *
 * Полоска отвечала ровно на один вопрос — «какие пять», — и на него хватало пяти миниатюр. Хаб
 * отвечает ещё на два: что меряют в каждом (повторения или секунды) и что уже сдано. Это по
 * строке текста на движение, и в подпись под квадратиком 60×60 они не помещаются: в присланном
 * скриншоте «Reverse lunge» уже переносится на две строки и режется.
 *
 * Строка на движение — то же решение, что на экране профиля и в плане тренировки, и читается она
 * сверху вниз, как и всё остальное в продукте.
 *
 * ## Кадр остаётся
 *
 * Уменьшается до 56px и уезжает влево. Движение по названию узнают не все, и картинка здесь
 * работает ровно так же, как в плане тренировки. Кадра может не быть вовсе — планку ещё не сняли,
 * — и тогда на его месте остаётся плитка с номером: `ExerciseStill` ничего не рисует, а номер
 * лежит под ним всегда, а не поверх картинки.
 *
 * ## «Ту ду» пишется словом
 *
 * Прочерк на месте числа читается как «ноль», а ноль — законный результат теста. Поэтому там, где
 * не сдано, стоит слово, а не знак.
 */
import { Glyph } from '@/components/ui/Icon';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { EXERCISE_BY_ID } from '@/content/registry';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import type { RecordedMove } from './recorded';

export interface AssessmentListProps {
  rows: readonly RecordedMove[];
  /** Открыть движение крупно. Без него строки не нажимаются. */
  onOpen?: (exerciseId: string) => void;
}

export function AssessmentList({ rows, onOpen }: AssessmentListProps) {
  const { t, l, locale } = useT();

  return (
    <ul className="flex flex-col border-t border-border">
      {rows.map(({ move, value, onKnees }, i) => {
        const exercise = EXERCISE_BY_ID.get(move.exerciseId);
        const name = exercise ? l(exercise.name) : move.exerciseId;
        const unit =
          move.metric === 'seconds' ? t('app.assessUnitSeconds') : t('app.assessUnitReps');
        const done = value !== undefined;
        const open = exercise && onOpen ? () => onOpen(move.exerciseId) : null;

        const body = (
          <>
            {/* Номер под кадром, а не поверх: кадра может не быть, и тогда номер — единственное,
                что остаётся на его месте. */}
            <span className="relative size-14 shrink-0 overflow-hidden rounded-control bg-surface-2">
              <span className="numeral tabular absolute inset-0 flex items-center justify-center text-[13px] text-muted-2">
                {String(i + 1).padStart(2, '0')}
              </span>
              <ExerciseStill
                exerciseId={move.exerciseId}
                className="relative size-full object-cover"
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-medium">{name}</span>
              <span className="truncate text-[13px] text-muted-2">
                {onKnees ? `${unit} · ${t('app.onbAssessOnKnees')}` : unit}
              </span>
            </span>
            <span className="shrink-0 text-right">
              {done ? (
                <span className="tabular text-[15px] font-semibold">
                  {formatNumber(locale, value)}
                </span>
              ) : (
                <span className="text-[13px] text-muted-2">{t('app.assessTodo')}</span>
              )}
            </span>
            {open ? (
              <Glyph size={13} className="shrink-0 text-muted-2">
                ›
              </Glyph>
            ) : null}
          </>
        );

        return (
          <li key={move.exerciseId} className="border-b border-border">
            {open ? (
              <button
                type="button"
                onClick={open}
                className="flex w-full items-center gap-3.5 py-3 text-left transition-colors duration-150 ease-(--ease-out) hover:text-text"
              >
                {body}
              </button>
            ) : (
              <span className="flex items-center gap-3.5 py-3">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
