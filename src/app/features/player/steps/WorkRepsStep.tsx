import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import type { BlockFormat } from '@/content/schema';
import { Stepper } from '../Stepper';
import { exerciseName, loadLabel, setLabel, unitLabel, type WorkStep } from '../model';
import { useNextHandler } from '../useStepClock';
import { StepHeading } from './StepHeading';

export interface WorkRepsStepProps {
  step: WorkStep;
  index: number;
  format: BlockFormat;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
}

/**
 * Rep-based work: the movement's name, the target as a big adjustable number, and one button.
 *
 * This renders into the player's footer, over the clip, so it carries only what is read and tapped
 * mid-set. There were two chips under the number — the load, and a warning when the count differed
 * from the target — and neither survived: the load is a fact, so it is a line, and the target is
 * what the stepper already opens on, so a chip announcing that you have changed it is telling
 * someone what they just did. The coach's note and the technique sit below the fold (StepDetails).
 */
export function WorkRepsStep({
  step,
  index,
  format,
  onRecord,
  onNext,
  registerNext,
}: WorkRepsStepProps) {
  const { t, locale } = useT();
  const [count, setCount] = useState(step.target);
  const load = loadLabel(t, {
    ...step.item,
    ...(step.loadKg !== undefined ? { loadKg: step.loadKg } : {}),
  });

  const done = () => {
    const result: PlayerResult = {
      stepIndex: index,
      blockId: step.blockId,
      exerciseId: step.exerciseId,
      completed: count >= step.target,
      achieved: count,
    };
    if (step.loadKg !== undefined) result.loadKg = step.loadKg;
    onRecord(result);
    onNext();
  };
  useNextHandler(registerNext, done);

  return (
    <div className="flex flex-col gap-4">
      <StepHeading
        eyebrow={step.totalSets > 1 ? setLabel(t, format, step.set, step.totalSets) : undefined}
        title={exerciseName(step.exerciseId, locale)}
      />
      <div className="flex flex-col items-center gap-1.5">
        <Stepper
          value={count}
          onChange={setCount}
          unit={
            step.item.perSide
              ? `${unitLabel(t, step.item.unit)} · ${t('training.perSide')}`
              : unitLabel(t, step.item.unit)
          }
          label={t('app.playerAdjustReps')}
          decreaseLabel={t('app.playerDecrease')}
          increaseLabel={t('app.playerIncrease')}
        />
        {load ? <span className="text-[13px] text-paper/70">{load}</span> : null}
      </div>
      <Button size="lg" fullWidth onClick={done}>
        {t('app.playerDone')}
      </Button>
    </div>
  );
}
