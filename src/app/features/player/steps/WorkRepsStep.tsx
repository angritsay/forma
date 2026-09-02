import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import type { BlockFormat } from '@/content/schema';
import { Stepper } from '../Stepper';
import { loadLabel, setLabel, unitLabel, type WorkStep } from '../model';
import { useNextHandler } from '../useStepClock';

export interface WorkRepsStepProps {
  step: WorkStep;
  index: number;
  format: BlockFormat;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
}

/** Rep-based work: the target as a big adjustable number; "Done" records what was achieved. */
export function WorkRepsStep({
  step,
  index,
  format,
  onRecord,
  onNext,
  registerNext,
}: WorkRepsStepProps) {
  const { t, l } = useT();
  const [count, setCount] = useState(step.target);
  const load = loadLabel(t, { ...step.item, ...(step.loadKg !== undefined ? { loadKg: step.loadKg } : {}) });

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {setLabel(t, format, step.set, step.totalSets)}
        </span>
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
        <div className="flex flex-wrap justify-center gap-2">
          {load ? <Chip icon="bolt">{load}</Chip> : null}
          {count !== step.target ? (
            <Chip tone="warning">{`${t('app.playerTarget')}: ${step.target}`}</Chip>
          ) : null}
        </div>
        {step.item.note ? <p className="text-[15px] text-muted">{l(step.item.note)}</p> : null}
      </div>
      <p className="text-center text-sm text-muted">{t('app.playerAdjustHint')}</p>
      <Button size="lg" fullWidth onClick={done}>
        {t('common.done')}
      </Button>
    </div>
  );
}
