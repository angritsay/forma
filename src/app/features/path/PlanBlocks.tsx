import { clsx } from 'clsx';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { Pill } from '@/components/ui/Pill';
import { findExercise } from '@/content/catalogue';
import { formatDuration } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import type { PrescribedBlock, PrescribedItem, PrescribedWorkout } from '@/lib/training/types';
import { mainOnly } from './mainWork';
import { blockChips } from './blockChips';
import { itemLoadLabel } from './plan';

/**
 * One movement of a block, as a card that is mostly picture: the colour still, the target large,
 * the name small.
 *
 * It was a list row — a 56px grey thumbnail, the name, the coach's note under it and the target on
 * the right — and the owner, looking at «Тренировка 1»: the pictures should be in colour and
 * larger, and there should be far less text. So the frame takes the card's width at 4:3 (a lead
 * card in an odd count takes both columns at 16:9, so three or five movements still close the grid
 * without a hole), the number is the one thing set large under it — the prototype's rule: minimum
 * text, big numbers — and the name sits beneath in small type. The coach's note is not lost: it is
 * on the back of the card this opens (`ExercisePreview`), where the player keeps it too.
 *
 * The load and the rest after the movement, when there is one, shrink to a single small chip. The
 * number is still the fallback in the frame when a movement has no still yet, so the grid never
 * shows an empty box and the order stays readable.
 *
 * Colour, not `.photo-mono`: these are the coach's own frames of the movement, and on this screen
 * the owner asked for them as they are (design/CHANGELOG.md §26).
 */
function PlanItem({
  item,
  n,
  lead,
  onOpen,
}: {
  item: PrescribedItem;
  n: number;
  /** Spans both columns: the first card of an odd count. */
  lead: boolean;
  onOpen?: ((item: PrescribedItem) => void) | undefined;
}) {
  const tr = useT();
  const { t, l } = tr;
  const exercise = findExercise(item.exerciseId);
  const name = exercise ? l(exercise.name) : item.exerciseId;
  const extra = [
    itemLoadLabel(tr, item),
    item.restAfterSec > 0 ? t('app.nodeRestAfter', { s: item.restAfterSec }) : undefined,
  ].filter(Boolean);
  /*
   * Строка становится кнопкой, только когда упражнение есть в базе и открывать правда есть что.
   * Иначе это `<li>`, как было: элемент, который выглядит нажимаемым и ничего не делает, хуже
   * обычной строки.
   */
  const open = exercise && onOpen ? () => onOpen(item) : null;
  const inner = (
    <>
      <span
        className={clsx(
          'relative flex w-full items-center justify-center overflow-hidden rounded-tile bg-surface-2',
          lead ? 'aspect-[16/9]' : 'aspect-[4/3]',
        )}
      >
        <ExerciseStill
          exerciseId={exercise ? item.exerciseId : undefined}
          className="absolute inset-0 size-full object-cover transition-transform duration-280 ease-(--ease-out) group-hover:scale-[1.03] motion-reduce:transition-none"
          fallback={
            <span className="numeral tabular text-2xl text-muted">
              {String(n).padStart(2, '0')}
            </span>
          }
        />
      </span>
      <span className="flex flex-col gap-1 px-0.5">
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="numeral tabular text-[28px] leading-none">{item.target}</span>
          <span className="text-xs text-muted">
            {t(`training.${item.unit}`)}
            {item.perSide ? ` · ${t('training.perSide')}` : ''}
          </span>
        </span>
        <span className="line-clamp-2 text-sm leading-snug font-medium">{name}</span>
        {extra.length > 0 ? (
          <span className="mt-0.5 self-start rounded-pill border border-border px-2 py-0.5 text-[11px] text-muted">
            {extra.join(' · ')}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <li className={clsx('min-w-0', lead && 'col-span-2')}>
      {open ? (
        <button
          type="button"
          onClick={open}
          className="group flex w-full flex-col gap-2.5 rounded-tile text-left"
        >
          {inner}
        </button>
      ) : (
        <span className="flex flex-col gap-2.5">{inner}</span>
      )}
    </li>
  );
}

/**
 * A block: its title and length on one line, its shape as a line of pills, then its movements.
 *
 * The coach's paragraph about the block («Три круга. 1-я минута — …») is no longer here: it is
 * folded under «Что внутри» on the screen, word for word, and what stands in its place is the same
 * information generated from the block's numbers (`blockChips`).
 */
function PlanBlock({
  block,
  onOpen,
}: {
  block: PrescribedBlock;
  onOpen?: ((item: PrescribedItem) => void) | undefined;
}) {
  const tr = useT();
  const { t, l, locale } = tr;
  const odd = block.items.length % 2 === 1;
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
      <ul className="flex flex-wrap gap-1.5">
        {blockChips(tr, block).map((chip, i) => (
          <li key={i} className="flex min-w-0">
            <Pill tone={block.type === 'test' ? 'sky' : 'neutral'}>{chip}</Pill>
          </li>
        ))}
      </ul>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 pt-1">
        {block.items.map((item, i) => (
          <PlanItem
            key={`${item.exerciseId}-${i}`}
            item={item}
            n={i + 1}
            lead={odd && i === 0}
            onOpen={onOpen}
          />
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
