import { clsx } from 'clsx';
import { useT } from '@/app/hooks/useT';
import type { PrescribedItem } from '@/lib/training/types';
import { exerciseVideoRef, findExercise, loadLabel, targetLabel } from './model';

export interface ItemListProps {
  items: readonly PrescribedItem[];
  /** Tighter rows without the swap and coach notes (AMRAP / For-time boards). */
  compact?: boolean;
  className?: string;
  /**
   * Makes each filmed row a button that puts its clip behind the board. The row whose clip is
   * playing is `activeIndex`; a movement with no footage stays a plain row.
   */
  onSelect?: (index: number) => void;
  activeIndex?: number;
}

/**
 * Exercises of a block with their prescribed targets, as a numbered ruled list: 01/02/03, the
 * name, the target on the right. The thumbnails that used to open each row are gone — the art
 * above the panel already shows the movement, and a list is read by its numbers.
 */
export function ItemList({
  items,
  compact = false,
  className,
  onSelect,
  activeIndex,
}: ItemListProps) {
  const { t, l, locale } = useT();
  return (
    <ul className={clsx('flex flex-col', className)}>
      {items.map((item, i) => {
        const exercise = findExercise(item.exerciseId);
        const name = exercise ? exercise.name[locale] : item.exerciseId;
        const load = loadLabel(t, item);
        const selectable = onSelect !== undefined && !!exerciseVideoRef(item.exerciseId, locale);
        const active = selectable && activeIndex === i;
        const rowClass = clsx(
          'flex w-full items-center gap-3.5 text-left',
          compact ? 'py-2' : 'py-3',
        );
        const row = (
          <>
            {/* The number turns into a play mark on the row whose clip is on screen. */}
            <span
              className={clsx(
                'numeral tabular w-6 shrink-0 text-sm',
                active ? 'text-accent' : 'text-muted',
              )}
            >
              {active ? '▶' : String(i + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={clsx('block truncate text-[15px] font-medium', active && 'text-accent')}
              >
                {name}
              </span>
              {item.substituted && !compact ? (
                <span className="block truncate text-xs text-muted">
                  {t('training.substitutedFrom', {
                    name:
                      findExercise(item.originalExerciseId)?.name[locale] ??
                      item.originalExerciseId,
                  })}
                </span>
              ) : null}
              {item.note && !compact ? (
                <span className="block text-xs text-muted">{l(item.note)}</span>
              ) : null}
            </span>
            <span className="tabular shrink-0 text-right text-sm font-semibold">
              {targetLabel(t, item)}
              {load ? <span className="block text-xs font-medium text-muted">{load}</span> : null}
            </span>
          </>
        );
        return (
          <li key={`${item.exerciseId}-${i}`} className="border-t border-border first:border-t-0">
            {selectable ? (
              <button
                type="button"
                className={clsx(
                  rowClass,
                  'transition-colors duration-150 ease-(--ease-out) active:opacity-70',
                )}
                aria-pressed={active}
                onClick={() => onSelect(i)}
              >
                {row}
              </button>
            ) : (
              <div className={rowClass}>{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
