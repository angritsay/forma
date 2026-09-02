import { clsx } from 'clsx';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { useT } from '@/app/hooks/useT';
import type { PrescribedItem } from '@/lib/training/types';
import { findExercise, loadLabel, targetLabel } from './model';

export interface ItemListProps {
  items: readonly PrescribedItem[];
  /** Compact rows without thumbnails (AMRAP / For-time boards). */
  compact?: boolean;
  className?: string;
}

/** Exercises of a block with their prescribed targets. */
export function ItemList({ items, compact = false, className }: ItemListProps) {
  const { t, l, locale } = useT();
  return (
    <ul className={clsx('flex flex-col', compact ? 'gap-1.5' : 'gap-2', className)}>
      {items.map((item, i) => {
        const exercise = findExercise(item.exerciseId);
        const name = exercise ? exercise.name[locale] : item.exerciseId;
        const load = loadLabel(t, item);
        return (
          <li
            key={`${item.exerciseId}-${i}`}
            className={clsx(
              'flex items-center gap-3 rounded-inner',
              compact ? 'py-1' : 'bg-surface-2 px-3 py-2',
            )}
          >
            {!compact ? (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-inner bg-surface-3 text-text">
                <ExerciseFigure
                  animation={exercise?.animation ?? item.exerciseId}
                  variant="thumb"
                  className="h-10 w-10"
                />
              </span>
            ) : null}
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
