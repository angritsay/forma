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
 *
 * In colour. It was monochrome, like every other photograph in the product, and the owner asked for
 * the workout's pictures as they are («картинки должны быть цветными»): this is the coach's frame of
 * the movement, not stock, and grey made it read as a placeholder (design/CHANGELOG.md §26). The
 * scrim over it is measured against a pure white frame, the brightest pixel any frame can put
 * there, so colour does not move the contrast (`contrast-usage.test.ts`).
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
      className="absolute inset-0 size-full object-cover"
    />
  );
}
