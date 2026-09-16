/**
 * The one question the onboarding asks about the body, and the two answers to it.
 *
 * It replaces three screens — max push-ups, squats in a minute, a maximum plank — each with its
 * own heading, lead, timer and field. Those asked a beginner for three maximum efforts before they
 * had trained once, which is the thing the coach's rules forbid outright (docs/COACH_RULES.md),
 * and they asked for them as a form: the wizard's «Продолжить» waiting under a number field.
 *
 * What is asked now is a choice, in the athlete's own words: fit the training to you? What saying
 * yes costs is two pills under it — five movements, ten minutes — not a sentence; a fact that is
 * not a control is a pill (design/CHANGELOG.md §10). «Сейчас» opens the runner; «Не сейчас»
 * postpones the whole thing, and it comes back as a task on the home screen rather than as
 * something lost.
 *
 * Nothing is lost either way: the fitness index is built to score a missing self-test from the
 * rest of the profile (docs/TRAINING_SCIENCE.md §2), so a postponed assessment costs precision,
 * not the programme.
 *
 * Between «Сейчас» and the first movement there is one more screen, and it is the most important
 * one here: it says not to squeeze out a maximum. It used to say it three times — a heading, a
 * lead, and a paragraph explaining that a number forced out today makes the next six weeks too
 * heavy. The owner cut it: «тут просто нужно сказать, что не выжимаем максимум… конец. Не нужно
 * bloat-нода текста». So it is her sentence and nothing else, over the still of the first
 * movement, which shows the ordinary pace the words are asking for.
 *
 * The warning still cannot ride along with the movement: beside a running clock and a
 * demonstration nobody reads anything, and this is the instruction everything the assessment
 * produces depends on.
 *
 * This step draws its own controls. Every other step of the wizard sits on the shared
 * «Продолжить» footer; here the two answers *are* the step, and a third button under them saying
 * "continue" would be a third answer.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { Pill } from '@/components/ui/Pill';
import { EXERCISE_BY_ID } from '@/content/registry';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { AssessmentRunner } from './AssessmentRunner';
import { AssessmentStrip } from './AssessmentStrip';
import { assessmentDone } from './draft';
import { Question } from './Question';
import type { StepProps } from './types';
import { ASSESSMENT_MOVES, ASSESSMENT_TOTAL_MIN } from '@content/site/assessment';

/** offer → the warning → the movements. */
type Phase = 'offer' | 'warning' | 'running';

export function StepAssess({ draft, update, next }: StepProps) {
  const { t, l, locale } = useT();
  const [phase, setPhase] = useState<Phase>('offer');
  const done = assessmentDone(draft);

  const setCount = (exerciseId: string, reps: number) =>
    update({
      assess: {
        ...draft.assess,
        later: false,
        counts: { ...draft.assess.counts, [exerciseId]: reps },
      },
    });

  const restart = () => {
    update({ assess: { ...draft.assess, later: false, counts: {} } });
    setPhase('warning');
  };

  if (phase === 'running') {
    return (
      <AssessmentRunner
        onKnees={draft.assess.onKnees}
        onCount={setCount}
        onKneesChange={(onKnees) => update({ assess: { ...draft.assess, onKnees } })}
        onDone={() => {
          setPhase('offer');
          next();
        }}
        onCancel={() => setPhase('offer')}
      />
    );
  }

  if (phase === 'warning') {
    return (
      <div className="flex flex-col gap-6">
        {/*
         * The first movement, full width, before a word is read — the owner's note on this screen
         * was that it is text and nothing else. A still of somebody doing an air squat at an
         * ordinary pace is the instruction; the line under it only names what the picture
         * already shows.
         */}
        <div className="-mx-6 aspect-3/2 overflow-hidden bg-surface-2 md:-mx-10">
          <ExerciseStill
            exerciseId={ASSESSMENT_MOVES[0]?.exerciseId}
            className="size-full object-cover"
            loading="eager"
          />
        </div>
        <Question text={t('app.onbAssessWarnTitle')} />
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth onClick={() => setPhase('running')}>
            {t('app.onbAssessWarnCta')}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setPhase('offer')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    /* Coming back to a finished assessment: the five numbers, and the way to do it again. */
    return (
      <div className="flex flex-col gap-6">
        <Question text={t('app.onbAssessDoneTitle')} />
        <ul className="flex flex-col border-b border-border">
          {ASSESSMENT_MOVES.map((move, i) => {
            const exercise = EXERCISE_BY_ID.get(move.exerciseId);
            return (
              <li
                key={move.exerciseId}
                className="flex items-center gap-3 border-t border-border py-3"
              >
                <span className="numeral w-8 text-sm text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px]">
                  {exercise ? l(exercise.name) : move.exerciseId}
                </span>
                {/* The number is the point of the row, so it is the biggest thing on it. */}
                <span className="numeral tabular text-xl">
                  {draft.assess.counts[move.exerciseId]}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth onClick={next}>
            {t('common.continue')}
          </Button>
          <Button variant="ghost" fullWidth onClick={restart}>
            {t('app.onbAssessRetake')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Which five, and in what order — the pill under the question says «5 упражнений», and
          this is the only place the athlete can find out what that means before agreeing to it. */}
      <AssessmentStrip />
      <Question text={t('app.onbAssessOfferTitle')} />
      <div className="flex flex-wrap gap-2">
        <Pill>{t('app.onbAssessMoves', { n: formatNumber(locale, ASSESSMENT_MOVES.length) })}</Pill>
        <Pill>{t('common.minutesShort', { n: formatNumber(locale, ASSESSMENT_TOTAL_MIN) })}</Pill>
      </div>
      <div className="flex flex-col gap-2">
        <Button size="lg" fullWidth onClick={() => setPhase('warning')}>
          {t('app.onbAssessNow')}
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => {
            update({ assess: { ...draft.assess, later: true, counts: {} } });
            next();
          }}
        >
          {t('app.onbAssessLater')}
        </Button>
      </div>
    </div>
  );
}
