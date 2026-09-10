/**
 * "Workouts from the coach" on Home: the custom workouts assigned to the signed-in user.
 * Renders nothing until at least one exists, so it never shows an empty shell.
 */
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
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
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg">{t('app.homeCoachWorkouts')}</h2>
      <div className="flex flex-col gap-2">
        {rows.map((w) => {
          const minutes = w.estSec ? Math.max(1, Math.round(w.estSec / 60)) : null;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onOpen(w.id)}
              className="flex items-center gap-3 rounded-card border border-border bg-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner bg-accent/15 text-accent">
                <Icon name="play" size={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-semibold">{w.title}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{t('app.customWorkoutFromCoach')}</span>
                  {minutes ? (
                    <span className="tabular">· {t('app.nodeDuration', { min: minutes })}</span>
                  ) : null}
                </span>
              </span>
              {w.points ? (
                <Badge tone="accent" size="sm" icon="star">
                  {w.points}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
