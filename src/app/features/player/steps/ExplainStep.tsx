import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import { FactChips } from '@/app/features/path/FactChips';
import { ExplainPanel } from '../ExplainPanel';
import { findExercise, loadLabel, targetLabel, type ExplainStep as Step } from '../model';

export interface ExplainStepProps {
  step: Step;
  onNext: () => void;
}

/**
 * An exercise the athlete has not met yet, and no rest to show it in: the coach's video plays
 * above, the name and target sit here, the words wait behind "Подробнее". One tap starts.
 */
export function ExplainStep({ step, onNext }: ExplainStepProps) {
  const { t, l, locale } = useT();
  const exercise = findExercise(step.exerciseId);
  const load = loadLabel(t, step.item);
  const original = step.item.substituted ? findExercise(step.item.originalExerciseId) : undefined;
  const facts = [targetLabel(t, step.item), ...(load ? [load] : [])];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <DisplayTitle
          as="h2"
          text={exercise ? exercise.name[locale] : step.exerciseId}
          className="text-5xl"
        />
        <FactChips items={facts} />
        {original ? (
          <p className="text-sm text-muted">
            {t('training.substitutedFrom', { name: original.name[locale] })}
          </p>
        ) : null}
        {step.item.note ? <p className="text-[15px] text-muted">{l(step.item.note)}</p> : null}
      </div>
      <ExplainPanel exerciseId={step.exerciseId} item={step.item} />
      <Button size="lg" fullWidth onClick={onNext} data-autofocus>
        {t('app.playerGo')}
      </Button>
    </div>
  );
}
