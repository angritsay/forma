import { useCallback, useRef } from 'react';
import { Chip } from '@/components/ui/Chip';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import type { BlockFormat } from '@/content/schema';
import { BigClock } from '../BigClock';
import { loadLabel, setLabel, unitLabel, type WorkStep } from '../model';
import type { Cue } from '../sound';
import { useCountdownCues, useNextHandler, useStepClock } from '../useStepClock';

export interface WorkTimerStepProps {
  step: WorkStep;
  index: number;
  format: BlockFormat;
  paused: boolean;
  beep: (cue: Cue) => void;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
}

/**
 * Timed work (holds, Tabata / interval rounds, EMOM minutes): countdown, cues at 3-2-1, auto-advance
 * at zero. "Next" before zero records the seconds done — except in EMOM, where finishing the reps
 * early is the point, so it counts as the full minute.
 */
export function WorkTimerStep({
  step,
  index,
  format,
  paused,
  beep,
  onRecord,
  onNext,
  registerNext,
}: WorkTimerStepProps) {
  const { t, l } = useT();
  const duration = Math.max(1, step.durationSec ?? step.target);
  const recorded = useRef(false);
  const clock = useStepClock(!paused, duration);
  const isEmom = format === 'emom';
  const load = loadLabel(t, { ...step.item, ...(step.loadKg !== undefined ? { loadKg: step.loadKg } : {}) });

  const complete = useCallback(
    (achievedSec: number) => {
      if (recorded.current) return;
      recorded.current = true;
      const achieved = Math.min(duration, Math.max(0, Math.round(achievedSec)));
      const result: PlayerResult = {
        stepIndex: index,
        blockId: step.blockId,
        exerciseId: step.exerciseId,
        completed: achieved >= duration,
        achieved,
      };
      if (step.loadKg !== undefined) result.loadKg = step.loadKg;
      onRecord(result);
      onNext();
    },
    [duration, index, step.blockId, step.exerciseId, step.loadKg, onRecord, onNext],
  );

  const onDone = useCallback(() => complete(duration), [complete, duration]);
  useCountdownCues(clock, !paused, beep, onDone);
  useNextHandler(registerNext, () => complete(isEmom ? duration : clock.elapsedSec));

  const isHold = step.item.unit === 'seconds';
  const caption = isEmom
    ? t('training.emomMinuteHint', { n: step.target })
    : step.item.note
      ? l(step.item.note)
      : isHold
        ? t('app.playerHold')
        : t('app.playerWork');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {setLabel(t, format, step.set, step.totalSets)}
        </span>
        <BigClock
          seconds={clock.remainingSec}
          tone={clock.remainingSec <= 3 && clock.remainingSec > 0 ? 'accent' : 'default'}
          caption={caption}
        />
        <div className="flex flex-wrap justify-center gap-2">
          {!isHold ? (
            <Chip tone="accent">
              {`${step.target} ${unitLabel(t, step.item.unit)}`}
              {step.item.perSide ? ` · ${t('training.perSide')}` : ''}
            </Chip>
          ) : null}
          {load ? <Chip icon="bolt">{load}</Chip> : null}
        </div>
      </div>
    </div>
  );
}
