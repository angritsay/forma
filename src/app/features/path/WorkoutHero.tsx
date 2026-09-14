/**
 * The picture at the top of a workout: a still from the coach's own clip.
 *
 * The screen once opened with a stick figure on a colour field and nothing else, which is a diagram
 * where a photograph belongs — the first thing anyone wants from «сегодняшняя тренировка» is to see
 * what it looks like. The still is found by convention (`images/exercises/<id>.jpg` in the public
 * bucket, written by scripts/media/upload-videos.mjs), so a movement filmed tomorrow shows its own
 * frame here with no code or content change.
 *
 * Where no frame exists yet there is no drawing to fall back to, by design: the programme's colour
 * fills the block on its own, which is the brand's answer for a picture that is not there.
 */
import { ExerciseStill } from '@/components/media/ExerciseStill';
import type { Exercise } from '@/content/schema';

export interface WorkoutHeroProps {
  exercise: Exercise | undefined;
}

export function WorkoutHero({ exercise }: WorkoutHeroProps) {
  return <ExerciseStill exerciseId={exercise?.id} loading="eager" />;
}
