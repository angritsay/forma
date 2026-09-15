/**
 * The five movements of the self-test: a picture and a name each.
 *
 * Both screens that lead into the assessment were words alone — the offer («Хочешь адаптировать
 * тренировки под себя?») and the warning before the first movement — and the owner said so about
 * each of them. This is what they were missing: «нужно будет сказать, сколько раз ты выполнишь
 * 5 упражнений за 10 минут» is an abstraction until you see which five.
 *
 * Nothing new was shot for it. Every frame is the coach's own still for that movement, the same one
 * the runner shows a second later and the same one the library uses everywhere else
 * (`ExerciseStill`).
 *
 * **The name is under the frame, and that is not decoration.** One of the five (the plank) has no
 * clip yet, and a still is a signed file in a bucket that can be slow or absent — a strip that
 * carries only pictures degrades into five blank squares, which reads as a broken screen rather
 * than as an answer to "which five". With the names it answers the question either way, and the
 * pictures make it quick rather than make it possible. That is also why this is a real list with a
 * label instead of `aria-hidden` ornament.
 *
 * Full-bleed, because the owner asked for pictures that fill the width of the screen and because
 * five frames inside a 24px gutter would be five thumbnails.
 */
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { EXERCISE_BY_ID } from '@/content/registry';
import { useT } from '@/app/hooks/useT';
import { ASSESSMENT_MOVES } from '@content/site/assessment';

export function AssessmentStrip() {
  const { t, l } = useT();
  return (
    <ul className="-mx-6 flex gap-px bg-border lg:-mx-10" aria-label={t('app.onbAssessOfferTitle')}>
      {ASSESSMENT_MOVES.map((move, i) => {
        const exercise = EXERCISE_BY_ID.get(move.exerciseId);
        return (
          <li key={move.exerciseId} className="flex min-w-0 flex-1 flex-col bg-bg">
            <div className="relative aspect-square w-full bg-surface-2">
              <ExerciseStill exerciseId={move.exerciseId} className="size-full object-cover" />
              {/* The numeral over the frame, in the pair the whole product counts with. Difference
                  blending keeps it readable on a photograph and on the flat tile behind it. */}
              <span className="numeral tabular absolute bottom-1 left-1.5 text-[11px] text-paper mix-blend-difference">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <span className="mt-1.5 line-clamp-2 px-1 text-[11px] leading-tight text-muted-2">
              {exercise ? l(exercise.name) : move.exerciseId}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
