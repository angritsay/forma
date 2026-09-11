/**
 * "Workouts from the coach" on Home: the custom workouts assigned to the signed-in user.
 * Renders nothing until at least one exists, so it never shows an empty shell.
 */
import { useEffect, useState } from 'react';
import { Glyph } from '@/components/ui/Icon';
import { listMyAssignedWorkouts } from '@/lib/api/customWorkouts';
import type { AssignedWorkoutRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface AssignedWorkoutsCardProps {
  onOpen: (id: string) => void;
}

export function AssignedWorkoutsCard({ onOpen }: AssignedWorkoutsCardProps) {
  const { t } = useT();
  const [rows, setRows] = useState<AssignedWorkoutRow[]>([]);

  useEffect(() => {
    let alive = true;
    listMyAssignedWorkouts()
      .then((r) => {
        if (alive) setRows(r);
      })
      .catch(() => {
        /* A missing coach-workout list never blocks the home screen. */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <section className="mt-6 flex flex-col">
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-5 pb-1">
        <h2 className="font-display text-xl">{t('app.homeCoachWorkouts')}</h2>
        <span className="eyebrow">{String(rows.length).padStart(2, '0')}</span>
      </div>
      {rows.map((w, i) => {
        const minutes = w.estSec ? Math.max(1, Math.round(w.estSec / 60)) : null;
        return (
          /* Numeral, name, the facts as a kicker, and the points opposite — no stamp, no star. */
          <button
            key={w.id}
            type="button"
            onClick={() => onOpen(w.id)}
            className="flex items-center gap-3.5 border-t border-border py-4 text-left first:border-t-0"
          >
            <span className="numeral shrink-0 text-sm text-muted">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-display truncate text-[15px] leading-[1.24]">{w.title}</span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{t('app.customWorkoutFromCoach')}</span>
                {minutes ? (
                  <span className="tabular">· {t('app.nodeDuration', { min: minutes })}</span>
                ) : null}
              </span>
            </span>
            {w.points ? (
              <span className="numeral tabular shrink-0 text-sm text-muted">
                {t('app.nodePoints', { n: w.points })}
              </span>
            ) : null}
            <Glyph size={16} className="shrink-0 text-muted-2">
              ›
            </Glyph>
          </button>
        );
      })}
    </section>
  );
}
