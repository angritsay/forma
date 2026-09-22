import { Chip } from '@/components/ui/Chip';
import { findExercise } from '@/content/catalogue';
import { formatDuration } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import type { PrescribedBlock, PrescribedItem, PrescribedWorkout } from '@/lib/training/types';
import { mainOnly } from './mainWork';
import { blockMetaLabel, exerciseName, itemLoadLabel, itemTargetLabel } from './plan';

/**
 * One movement of a block: its number, its name (with the swap note and the coach's note under
 * it) and the target on the right. The number replaces the thumbnail that used to sit here — a
 * plan is read as a list, and 01/02/03 is how the brand numbers a list.
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
      <span className="numeral tabular w-6 shrink-0 text-sm text-muted">
        {String(n).padStart(2, '0')}
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
          className="flex w-full items-center gap-3.5 py-3 text-left transition-colors duration-150 ease-(--ease-out) hover:text-text"
        >
          {inner}
        </button>
      ) : (
        <span className="flex items-center gap-3.5 py-3">{inner}</span>
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
