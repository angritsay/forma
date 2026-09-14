/**
 * The one question the onboarding asks about the body, and the two answers to it.
 *
 * It replaces three screens — max push-ups, squats in a minute, a maximum plank — each with its
 * own heading, lead, timer and field. Those asked a beginner for three maximum efforts before they
 * had trained once, which is the thing the coach's rules forbid outright (docs/COACH_RULES.md),
 * and they asked for them as a form: the wizard's «Продолжить» waiting under a number field.
 *
 * What is asked now is a choice, in the athlete's own words: do you want the training fitted to
 * you? Under it, in one line, exactly what saying yes costs — five movements, ten minutes, a count
 * for each. «Сейчас» opens the runner; «Не сейчас» postpones the whole thing, and it comes back as
 * a task on the home screen rather than as something lost.
 *
 * Nothing is lost either way: the fitness index is built to score a missing self-test from the
 * rest of the profile (docs/TRAINING_SCIENCE.md §2), so a postponed assessment costs precision,
 * not the programme.
 *
 * Between «Сейчас» and the first movement there is one more screen, and it is the most important
 * one here: it says not to squeeze out a maximum, and it says why in the athlete's own interest —
 * a number forced out today is a programme that is too heavy for the next six weeks. That warning
 * cannot ride along with the movement: beside a running clock and a demonstration nobody reads a
 * paragraph, and this is the instruction everything the assessment produces depends on.
 *
 * This step draws its own controls. Every other step of the wizard sits on the shared
 * «Продолжить» footer; here the two answers *are* the step, and a third button under them saying
 * "continue" would be a third answer.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PageTitle } from '@/components/ui/PageTitle';
import { EXERCISE_BY_ID } from '@/content/registry';
import { useT } from '@/app/hooks/useT';
import { AssessmentRunner } from './AssessmentRunner';
import { assessmentDone } from './draft';
import type { StepProps } from './types';
import { ASSESSMENT_MOVES, ASSESSMENT_TOTAL_MIN } from '@content/site/assessment';

/** offer → the warning → the movements. */
type Phase = 'offer' | 'warning' | 'running';

export function StepAssess({ draft, update, next }: StepProps) {
  const { t, l } = useT();
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
        <PageTitle title={t('app.onbAssessWarnTitle')} subtitle={t('app.onbAssessWarnBody')} />
        <p className="hairline pt-5 text-[15px] leading-relaxed text-muted">
          {t('app.onbAssessWarnBody2')}
        </p>
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
        <PageTitle title={t('app.onbAssessDoneTitle')} subtitle={t('app.onbAssessDoneLead')} />
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
                <span className="numeral tabular text-sm">
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
      <PageTitle
        title={t('app.onbAssessOfferTitle')}
        subtitle={t('app.onbAssessOfferLead', {
          n: ASSESSMENT_MOVES.length,
          min: ASSESSMENT_TOTAL_MIN,
        })}
      />
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
