import { clsx } from 'clsx';
import { useT } from '@/app/hooks/useT';
import type { PrescribedItem } from '@/lib/training/types';
import { findExercise, loadLabel, targetLabel } from './model';

export interface ItemListProps {
  items: readonly PrescribedItem[];
  /** Tighter rows without the swap and coach notes (AMRAP / For-time boards). */
  compact?: boolean;
  className?: string;
}

/**
 * Exercises of a block with their prescribed targets, as a numbered ruled list: 01/02/03, the
 * name, the target on the right. The thumbnails that used to open each row are gone — the art
 * above the panel already shows the movement, and a list is read by its numbers.
 */
export function ItemList({ items, compact = false, className }: ItemListProps) {
  const { t, l, locale } = useT();
  return (
    <ul className={clsx('flex flex-col', className)}>
      {items.map((item, i) => {
        const exercise = findExercise(item.exerciseId);
        const name = exercise ? exercise.name[locale] : item.exerciseId;
        const load = loadLabel(t, item);
        return (
          <li
            key={`${item.exerciseId}-${i}`}
            className={clsx(
              'flex items-center gap-3.5 border-t border-border first:border-t-0',
              compact ? 'py-2' : 'py-3',
            )}
          >
            <span className="numeral tabular w-6 shrink-0 text-sm text-muted">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium">{name}</span>
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
          </li>
        );
      })}
    </ul>
  );
}
