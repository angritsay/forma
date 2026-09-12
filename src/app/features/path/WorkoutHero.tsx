/**
 * The picture at the top of a workout: a still from the coach's own clip, or the drawn figure.
 *
 * The screen opened with a stick figure on a colour field and nothing else, which is a diagram
 * where a photograph belongs — the first thing anyone wants from «сегодняшняя тренировка» is to
 * see what it looks like. The still is found by convention (`images/exercises/<id>.jpg` in the
 * public bucket, written by scripts/media/upload-videos.mjs), so a movement filmed tomorrow shows
 * its own frame here with no code or content change.
 *
 * The figure is the fallback, and it is not a degraded state: it is the same blueprint style the
 * rest of the app is drawn in, on the programme's own colour.
 */
import { useState } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { exerciseStillUrl } from '@/lib/api/storage';
import type { Exercise } from '@/content/schema';

export interface WorkoutHeroProps {
  exercise: Exercise | undefined;
  /** The course's tile, so the drawn fallback takes its ink from the programme colour. */
  tile: string;
  label?: string | undefined;
}

export function WorkoutHero({ exercise, tile, label }: WorkoutHeroProps) {
  const [stillFailed, setStillFailed] = useState(false);
  const still = exercise && !stillFailed ? exerciseStillUrl(exercise.id) : undefined;

  if (still) {
    return (
      <img
        src={still}
        alt={label ?? ''}
        className="size-full object-cover"
        decoding="async"
        // No frame uploaded for this movement yet: fall back to the drawing, never to a broken
        // image icon.
        onError={() => setStillFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-full max-h-full items-center justify-center">
      {/*
       * The course's own tile, not a transparent one. `ExerciseFigure` derives its ink from
       * whatever tile it is given, and a transparent tile reads as dark — which drew a white
       * figure on the yellow cover. The block behind is already this colour, so passing it changes
       * nothing but the line, which goes to the black the brandbook asks for.
       */}
      <ExerciseFigure
        animation={exercise?.animation ?? 'air_squat'}
        variant="hero"
        tile={tile}
        className="h-full w-auto"
        {...(label ? { label } : {})}
      />
    </div>
  );
}
