import { ExerciseStill } from '@/components/media/ExerciseStill';
import { Chip } from '@/components/ui/Chip';
import { findExercise } from '@/content/catalogue';
import { formatDuration } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import type { PrescribedBlock, PrescribedItem, PrescribedWorkout } from '@/lib/training/types';
import { mainOnly } from './mainWork';
import { blockMetaLabel, exerciseName, itemLoadLabel, itemTargetLabel } from './plan';

/**
 * One movement of a block: a still of the movement, its name (with the swap note and the coach's
 * note under it) and the target on the right.
 *
 * The still is back. For a while the number stood in for it, because a plan is read as a list and
 * 01/02/03 is how the brand numbers one. The owner asked for the pictures again («тут надо добавить
 * картинки превью упражнений»): the name alone does not tell a newcomer what a movement looks
 * like, and the frame does at a glance. The number has not gone. It is the fallback inside the
 * same square when a movement has no frame yet, so the row never shows an empty box or a broken
 * image, and the order stays readable.
 */
function PlanItem({
  item,
  n,
  onOpen,
}: {
  item: PrescribedItem;
  n: number;
  onOpen?: ((item: PrescribedItem) => void) | undefined;
}) {
  const tr = useT();
  const { t, l } = tr;
  const exercise = findExercise(item.exerciseId);
  const name = exercise ? l(exercise.name) : item.exerciseId;
  const load = itemLoadLabel(tr, item);
  /*
   * Строка становится кнопкой, только когда упражнение есть в базе и открывать правда есть что.
   * Иначе это `<li>`, как было: элемент, который выглядит нажимаемым и ничего не делает, хуже
   * обычной строки.
   */
  const open = exercise && onOpen ? () => onOpen(item) : null;
  const inner = (
    <>
      <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-surface-2">
        <ExerciseStill
          exerciseId={exercise ? item.exerciseId : undefined}
          className="photo-mono absolute inset-0 size-full object-cover"
          fallback={
            <span className="numeral tabular text-sm text-muted">{String(n).padStart(2, '0')}</span>
          }
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{name}</span>
        {item.substituted ? (
          <span className="block truncate text-xs text-muted">
            {t('training.substitutedFrom', { name: exerciseName(tr, item.originalExerciseId) })}
          </span>
        ) : null}
        {item.note ? <span className="block text-xs text-muted">{l(item.note)}</span> : null}
      </span>
      <span className="flex shrink-0 flex-col items-end text-right">
        <span className="tabular text-sm font-semibold">{itemTargetLabel(tr, item)}</span>
        {load ? <span className="text-xs text-muted">{load}</span> : null}
        {item.restAfterSec > 0 ? (
          <span className="text-xs text-muted-2">
            {t('app.nodeRestAfter', { s: item.restAfterSec })}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <li className="border-t border-border first:border-t-0">
      {open ? (
        <button
          type="button"
          onClick={open}
          className="flex w-full items-center gap-3.5 py-2.5 text-left transition-colors duration-150 ease-(--ease-out) hover:text-text"
        >
          {inner}
        </button>
      ) : (
        <span className="flex items-center gap-3.5 py-2.5">{inner}</span>
      )}
    </li>
  );
}

/** A block: its title and length on one line, the format chip, the description, then its items. */
function PlanBlock({
  block,
  onOpen,
}: {
  block: PrescribedBlock;
  onOpen?: ((item: PrescribedItem) => void) | undefined;
}) {
  const tr = useT();
  const { t, l, locale } = tr;
  const between = block.restBetweenSetsSec || block.restBetweenRoundsSec;
  return (
    <section className="flex flex-col gap-3 border-t border-border-strong pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-display text-[15px]">
          {block.title ? l(block.title) : t(`training.block_${block.type}`)}
        </h4>
        <span className="numeral tabular text-xs text-muted">
          {formatDuration(locale, block.estimatedSec)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" tone={block.type === 'test' ? 'accent' : 'default'}>
          {blockMetaLabel(tr, block)}
        </Chip>
        {between > 0 ? (
          <span className="text-xs text-muted">{t('app.nodeRestAfter', { s: between })}</span>
        ) : null}
      </div>
      {block.description ? <p className="text-sm text-muted">{l(block.description)}</p> : null}
      <ul className="flex flex-col">
        {block.items.map((item, i) => (
          <PlanItem key={`${item.exerciseId}-${i}`} item={item} n={i + 1} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Предписанный план: блоки с их форматом и конкретными целями.
 *
 * `work` оставляет только рабочую часть: владелец, глядя на такой же список, — «скрывай разминку и
 * заминку». Почему именно их и что бывает, когда работы не осталось, написано в `mainWork.ts`.
 *
 * `onOpen` делает строки нажимаемыми. Без него компонент ровно такой, каким был: он стоит и в
 * плеере, где нажимать на упражнение посреди подхода незачем.
 */
export function PlanBlocks({
  prescribed,
  work = false,
  onOpen,
}: {
  prescribed: PrescribedWorkout;
  /** Только рабочая часть, без разминки и заминки. */
  work?: boolean;
  onOpen?: (item: PrescribedItem) => void;
}) {
  const blocks = work ? mainOnly(prescribed.blocks, (b) => b.type) : prescribed.blocks;
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block) => (
        <PlanBlock key={block.blockId} block={block} onOpen={onOpen} />
      ))}
    </div>
  );
}
