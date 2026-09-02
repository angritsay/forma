import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import type { ExerciseUnit } from '@/content/schema';
import { BigClock } from '../BigClock';
import { Stepper } from '../Stepper';
import { findExercise, unitLabel, type WorkStep } from '../model';
import type { Cue } from '../sound';
import { useCountdownCues, useNextHandler, useStepClock } from '../useStepClock';

export interface TestStepProps {
  step: WorkStep;
  index: number;
  paused: boolean;
  beep: (cue: Cue) => void;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
}

type Phase = 'ready' | 'running' | 'result';

/**
 * Max-effort test item. Timed tests count down the window (the athlete may stop early), then ask
 * for the result: reps for rep exercises, the held seconds for timed ones. The measurement is
 * stored as `testValue`/`testUnit` (fed to benchmarks); the step counts as complete once done.
 */
export function TestStep({
  step,
  index,
  paused,
  beep,
  onRecord,
  onNext,
  registerNext,
}: TestStepProps) {
  const { t, l } = useT();
  const exercise = findExercise(step.exerciseId);
  const measureUnit: ExerciseUnit = exercise?.unit ?? 'reps';
  const timed = step.mode === 'timer' && (step.durationSec ?? 0) > 0;
  const window = timed ? (step.durationSec ?? step.target) : undefined;

  const [phase, setPhase] = useState<Phase>(timed ? 'ready' : 'result');
  const [value, setValue] = useState(0);
  const clock = useStepClock(phase === 'running' && !paused, window);

  const toResult = useCallback(
    (seconds: number) => {
      setPhase('result');
      if (measureUnit === 'seconds') setValue(Math.round(seconds));
    },
    [measureUnit],
  );
  const onDone = useCallback(() => toResult(window ?? 0), [toResult, window]);
  useCountdownCues(clock, phase === 'running' && !paused, beep, onDone);

  const start = () => {
    beep('go');
    setPhase('running');
  };
  const stop = () => toResult(clock.elapsedSec);
  const save = () => {
    onRecord({
      stepIndex: index,
      blockId: step.blockId,
      exerciseId: step.exerciseId,
      completed: true,
      testValue: value,
      testUnit: measureUnit,
    });
    onNext();
  };

  useNextHandler(registerNext, () => {
    if (phase === 'ready') start();
    else if (phase === 'running') stop();
    else save();
  });

  const targetChip = timed
    ? `${t('training.block_test')} · ${Math.round((window ?? 0) / 60) > 0 ? t('common.minutesShort', { n: Math.round((window ?? 0) / 60) }) : `${window} ${t('training.seconds')}`}`
    : t('training.block_test');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {t('training.testHint')}
        </span>

        {phase === 'result' ? (
          <>
            <p className="text-[15px] text-muted">
              {measureUnit === 'seconds'
                ? t('app.playerTestSecondsQuestion')
                : t('app.playerTestRepsQuestion')}
            </p>
            <Stepper
              value={value}
              onChange={setValue}
              max={measureUnit === 'seconds' ? 7200 : undefined}
              unit={unitLabel(t, measureUnit)}
              label={t('app.playerTestResultLabel')}
              decreaseLabel={t('app.playerDecrease')}
              increaseLabel={t('app.playerIncrease')}
            />
          </>
        ) : (
          <BigClock
            seconds={phase === 'ready' ? (window ?? 0) : clock.remainingSec}
            tone={phase === 'running' && clock.remainingSec <= 3 ? 'accent' : 'default'}
            caption={step.item.note ? l(step.item.note) : undefined}
          />
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <Chip tone="accent">{targetChip}</Chip>
        </div>
      </div>

      {phase === 'ready' ? (
        <Button size="lg" fullWidth onClick={start} icon={<Icon name="play" size={20} />}>
          {t('app.playerTestStart')}
        </Button>
      ) : phase === 'running' ? (
        <Button size="lg" fullWidth variant="secondary" onClick={stop}>
          {t('app.playerStop')}
        </Button>
      ) : (
        <Button size="lg" fullWidth onClick={save}>
          {t('app.playerTestSave')}
        </Button>
      )}
    </div>
  );
}
