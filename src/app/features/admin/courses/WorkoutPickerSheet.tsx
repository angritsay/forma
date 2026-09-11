/**
 * Pick a workout out of the library to put on a course day.
 *
 * The same idea as the exercise picker one level down: search what already exists and reuse it.
 * A flow written once ends up on every day of every course that uses it, and editing it there
 * updates all of them — which is the point, and the reason the day stores a reference rather than
 * a copy of the structure.
 */
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { listCustomWorkouts } from '@/lib/api/customWorkouts';
import type { CustomWorkoutSummary } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface WorkoutPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (workout: CustomWorkoutSummary) => void;
}

export function WorkoutPickerSheet({ open, onClose, onPick }: WorkoutPickerSheetProps) {
  const { t } = useT();
  const [rows, setRows] = useState<CustomWorkoutSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  /*
   * Reloaded every time the sheet opens, unlike the exercise picker which caches for the session.
   * The list changes while the coach works — she builds a workout on one day and puts it on the
   * next — and a stale cache would hide the workout she just made.
   */
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    listCustomWorkouts()
      .then((r) => {
        if (alive) setRows(r);
      })
      .catch(() => undefined)
      .finally(() => {
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
      (w) => w.title.toLowerCase().includes(q) || (w.description ?? '').toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <Sheet open={open} onClose={onClose} title={t('app.dayPickWorkout')}>
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t('app.daySearchWorkout')}
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
            {filtered.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => onPick(w)}
                  className="flex w-full items-center gap-3 rounded-inner px-2 py-2.5 text-left transition-colors hover:bg-surface-3"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-medium">{w.title}</span>
                    <span className="tabular truncate text-xs text-muted">
                      {w.estSec
                        ? t('app.nodeDuration', { min: Math.max(1, Math.round(w.estSec / 60)) })
                        : (w.description ?? '')}
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
