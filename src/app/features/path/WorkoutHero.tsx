/**
 * The picture at the top of a workout: a still from the coach's own clip.
 *
 * The screen once opened with a stick figure on a colour field and nothing else, which is a diagram
 * where a photograph belongs — the first thing anyone wants from «сегодняшняя тренировка» is to see
 * what it looks like. The still is found by convention (`images/exercises/<id>.jpg` in the public
 * bucket, written by scripts/media/upload-videos.mjs), so a movement filmed tomorrow shows its own
 * frame here with no code or content change.
 *
 * It is laid out as the *surface* of the block rather than as a picture inside it: absolutely
 * positioned and cropped to fill, so the workout's name, its programme and its facts can sit on it.
 * Monochrome, like every photograph in the product — colour belongs to the programme, on type.
 *
 * Where no frame exists yet there is no drawing to fall back to, by design, and no flat field of
 * the programme colour either: the title on this screen *is* that colour now, and a cyan name on a
 * cyan field is nothing at all. The block's own dark surface shows through instead, which is what
 * the «Курсы» card does with a course that has no photograph.
 */
import { ExerciseStill } from '@/components/media/ExerciseStill';
import type { Exercise } from '@/content/schema';

export interface WorkoutHeroProps {
  exercise: Exercise | undefined;
}

export function WorkoutHero({ exercise }: WorkoutHeroProps) {
  return (
    <ExerciseStill
      exerciseId={exercise?.id}
      loading="eager"
      className="photo-mono absolute inset-0 size-full object-cover"
    />
  );
}
