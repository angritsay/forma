/**
 * «За тренировку» — every movement in the session, as pictures.
 *
 * The plan below this is a numbered list of names, which is the right thing for checking the
 * detail and the wrong thing for the question someone actually opens this screen with: *what am I
 * about to do*. A row of names answers it by making you read eight of them; a row of shapes
 * answers it at a glance, and a still from the coach's own clip answers it as "this, with him".
 *
 * The still is found by convention rather than written into the content files
 * (`images/exercises/<id>.jpg` in the public bucket — see scripts/media/upload-videos.mjs), which
 * means a clip uploaded tomorrow shows up here with no code or content change; until then the tile
 * is the flat surface with the name under it.
 */
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { findExercise } from '@/content/catalogue';
import type { PrescribedWorkout } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

/** The movements of a workout, in order, each one once. */
export function workoutExerciseIds(prescribed: PrescribedWorkout): string[] {
  const seen: string[] = [];
  for (const block of prescribed.blocks) {
    for (const item of block.items) {
      if (!seen.includes(item.exerciseId)) seen.push(item.exerciseId);
    }
  }
  return seen;
}

function Tile({ exerciseId }: { exerciseId: string }) {
  const { l } = useT();
  const exercise = findExercise(exerciseId);
  const name = exercise ? l(exercise.shortName ?? exercise.name) : exerciseId;

  return (
    <li className="flex min-w-0 flex-col gap-1.5">
      {/*
       * Neutral, not the course colour. Seventeen yellow squares in a grid drown the one piece of
       * art above them that is supposed to be the course — the programme's colour is worth
       * something precisely because it is spent once per screen.
       */}
      <div className="relative aspect-square overflow-hidden rounded-inner bg-surface-2 text-text">
        <ExerciseStill exerciseId={exerciseId} />
      </div>
      <span className="truncate text-xs text-muted" title={name}>
        {name}
      </span>
    </li>
  );
}

export interface WorkoutStripProps {
  prescribed: PrescribedWorkout;
}

export function WorkoutStrip({ prescribed }: WorkoutStripProps) {
  const { t } = useT();
  const ids = workoutExerciseIds(prescribed);
  if (ids.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-5">
        <h2 className="font-display text-xl">{t('app.nodeInWorkout')}</h2>
        <span className="eyebrow">{String(ids.length).padStart(2, '0')}</span>
      </div>
      {/* Three across on a phone: big enough to recognise a shape, small enough that eight fit. */}
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {ids.map((id) => (
          <Tile key={id} exerciseId={id} />
        ))}
      </ul>
    </section>
  );
}
