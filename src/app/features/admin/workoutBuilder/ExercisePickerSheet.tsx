/**
 * The exercise picker used by the workout builder: search the database catalogue and tap to add.
 */
import { useEffect, useMemo, useState } from 'react';
import { Glyph } from '@/components/ui/Icon';
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
          aria-label={t('app.builderSearchExercise')}
          placeholder={t('app.builderSearchExercise')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          /* Hairline rows; the `+` on the right is the whole row's verb, so it stays quiet. */
          <ul className="flex max-h-[55dvh] flex-col overflow-y-auto">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onPick(e)}
                  className="flex w-full items-center gap-3 border-t border-border py-3 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 active:bg-surface-3"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-medium">{e.nameRu}</span>
                    <span className="truncate text-[13px] text-muted">
                      {(e.primaryMuscle ?? e.muscles[0] ?? '') +
                        (e.unit === 'seconds' ? ` · ${t('app.builderUnitSeconds')}` : '')}
                    </span>
                  </span>
                  <Glyph size={16} className="shrink-0 text-muted-2">
                    +
                  </Glyph>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="border-t border-border py-6 text-[15px] text-muted">
                {t('app.builderNoMatches')}
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
