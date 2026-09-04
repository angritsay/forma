import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useT } from '@/app/hooks/useT';
import { findExercise, loadLabel, targetLabel, type ExplainStep as Step } from '../model';

export interface ExplainStepProps {
  step: Step;
  onNext: () => void;
}

/** Exercise name, prescribed target and 2–3 technique cues; "Got it" moves on. */
export function ExplainStep({ step, onNext }: ExplainStepProps) {
  const { t, l, locale } = useT();
  const exercise = findExercise(step.exerciseId);
  const cues = exercise ? exercise.cues.slice(0, 3) : [];
  const load = loadLabel(t, step.item);
  const original = step.item.substituted ? findExercise(step.item.originalExerciseId) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-4xl">
          {exercise ? exercise.name[locale] : step.exerciseId}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Chip tone="accent">{targetLabel(t, step.item)}</Chip>
          {load ? <Chip>{load}</Chip> : null}
        </div>
        {original ? (
          <p className="text-sm text-muted">
            {t('training.substitutedFrom', { name: original.name[locale] })}
          </p>
        ) : null}
        {step.item.note ? <p className="text-[15px] text-muted">{l(step.item.note)}</p> : null}
      </div>
      {cues.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="eyebrow">{t('app.playerCues')}</span>
          <ol className="flex flex-col gap-2">
            {cues.map((cue, i) => (
              <li key={i} className="flex gap-3 rounded-inner bg-surface-2 px-4 py-3">
                <span className="tabular shrink-0 font-semibold text-accent">{i + 1}</span>
                <span className="text-[15px]">{l(cue)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <Button size="lg" fullWidth onClick={onNext}>
        {t('app.playerGotIt')}
      </Button>
    </div>
  );
}
