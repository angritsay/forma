import { useCallback, useRef } from 'react';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import type { BlockFormat } from '@/content/schema';
import { BigClock } from '../BigClock';
import { exerciseName, loadLabel, setLabel, unitLabel, type WorkStep } from '../model';
import type { Cue } from '../sound';
import { useCountdownCues, useNextHandler, useStepClock } from '../useStepClock';
import { StepHeading } from './StepHeading';

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
  const { t, locale } = useT();
  const duration = Math.max(1, step.durationSec ?? step.target);
  const recorded = useRef(false);
  const clock = useStepClock(!paused, duration);
  const isEmom = format === 'emom';
  const load = loadLabel(t, {
    ...step.item,
    ...(step.loadKg !== undefined ? { loadKg: step.loadKg } : {}),
  });

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
  /*
   * How many, and with what — one line, not two chips.
   *
   * A hold has no count worth printing: the number to watch is the one counting down, and
   * «Держим» underneath it said what the clock was already saying.
   */
  const facts = [
    isHold
      ? undefined
      : `${step.target} ${unitLabel(t, step.item.unit)}${step.item.perSide ? ` · ${t('training.perSide')}` : ''}`,
    load,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-4">
      <StepHeading
        eyebrow={step.totalSets > 1 ? setLabel(t, format, step.set, step.totalSets) : undefined}
        title={exerciseName(step.exerciseId, locale)}
      />
      <div className="flex flex-col items-center gap-1.5">
        <BigClock
          seconds={clock.remainingSec}
          tone={clock.remainingSec <= 3 && clock.remainingSec > 0 ? 'accent' : 'default'}
          {...(isEmom ? { caption: t('training.emomMinuteHint', { n: step.target }) } : {})}
        />
        {facts.length > 0 ? (
          <span className="text-[13px] text-paper/70">{facts.join(' · ')}</span>
        ) : null}
      </div>
    </div>
  );
}
