/**
 * The days of a course, grouped by week — the shape of the programme at a glance.
 *
 * A day that cannot be published yet says so on the row (a training day with no workout, an
 * untitled day), because the publish tab lists problems in `CourseSchema`'s words and this is
 * where they can actually be fixed.
 */
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import type { AdminCourseDayRow, CourseDayKind, CustomWorkoutSummary } from '@/lib/api/types';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { TRAINING_KINDS } from './DayEditor';

const KIND_KEY: Record<CourseDayKind, TKey> = {
  workout: 'app.dayKindWorkout',
  rest: 'app.dayKindRest',
  test: 'app.dayKindTest',
  benchmark: 'app.dayKindBenchmark',
  milestone: 'app.dayKindMilestone',
};

export interface DayListProps {
  days: readonly AdminCourseDayRow[];
  workouts: readonly CustomWorkoutSummary[];
  onOpen: (day: AdminCourseDayRow) => void;
}

export function DayList({ days, workouts, onOpen }: DayListProps) {
  const { t } = useT();
  const byId = new Map(workouts.map((w) => [w.id, w]));

  const ordered = [...days].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.week - b.week || a.day - b.day,
  );

  // Weeks in the order the days give them, so a course numbered oddly still reads in its own order.
  const weeks: number[] = [];
  for (const d of ordered) if (!weeks.includes(d.week)) weeks.push(d.week);

  return (
    <div className="flex flex-col">
      {weeks.map((week) => (
        <section key={week}>
          <h3 className="eyebrow border-b border-border py-3">{t('app.dayWeekN', { n: week })}</h3>
          <ul className="flex flex-col">
            {ordered
              .filter((d) => d.week === week)
              .map((d) => {
                const workout = d.customWorkoutId ? byId.get(d.customWorkoutId) : undefined;
                const needsWorkout = TRAINING_KINDS.includes(d.kind) && !workout;
                const title = d.content.title?.ru?.trim();
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(d)}
                      className="flex w-full items-center gap-3 border-b border-border py-3 text-left transition-colors hover:bg-surface-2"
                    >
                      <span className="numeral tabular w-8 shrink-0 text-center text-muted">
                        {d.day}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[15px] font-medium">
                          {title || t('app.dayUntitled')}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted">
                          <span>{t(KIND_KEY[d.kind])}</span>
                          {workout ? <span className="truncate">· {workout.title}</span> : null}
                        </span>
                      </span>
                      {needsWorkout ? (
                        <Badge tone="warning" size="sm">
                          {t('app.dayNeedsWorkout')}
                        </Badge>
                      ) : null}
                      <Icon name="chevron" size={18} className="shrink-0 text-muted" />
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
