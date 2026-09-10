/**
 * The exercise picker used by the workout builder: search the database catalogue and tap to add.
 */
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { listExerciseCatalog } from '@/lib/api/exercises';
import type { ExerciseCatalogRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface ExercisePickerSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: ExerciseCatalogRow) => void;
}

let cache: ExerciseCatalogRow[] | null = null;

export function ExercisePickerSheet({ open, onClose, onPick }: ExercisePickerSheetProps) {
  const { t } = useT();
  const [rows, setRows] = useState<ExerciseCatalogRow[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || cache) return;
    let alive = true;
    setLoading(true);
    listExerciseCatalog()
      .then((r) => {
        cache = r;
        if (alive) {
          setRows(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (e) =>
        e.nameRu.toLowerCase().includes(q) ||
        e.id.includes(q) ||
        e.tags.some((tg) => tg.includes(q)),
    );
  }, [rows, query]);

  return (
    <Sheet open={open} onClose={onClose} title={t('app.builderPickExercise')}>
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t('app.builderSearchExercise')}
          leading={<Icon name="search" size={18} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <ul className="-mx-2 flex max-h-[55dvh] flex-col overflow-y-auto">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onPick(e)}
                  className="flex w-full items-center gap-3 rounded-inner px-2 py-2.5 text-left transition-colors hover:bg-surface-3"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-medium">{e.nameRu}</span>
                    <span className="truncate text-xs text-muted">
                      {(e.primaryMuscle ?? e.muscles[0] ?? '') +
                        (e.unit === 'seconds' ? ` · ${t('app.builderUnitSeconds')}` : '')}
                    </span>
                  </span>
                  <Icon name="plus" size={18} className="shrink-0 text-accent" />
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-muted">
                {t('app.builderNoMatches')}
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
