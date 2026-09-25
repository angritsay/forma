import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import type { ExerciseUnit } from '@/content/schema';
import { BigClock } from '../BigClock';
import { PlayerTimerSlot } from '../PlayerChrome';
import { Stepper } from '../Stepper';
import { findExercise, unitLabel, type WorkStep } from '../model';
import type { SwipeHold } from '../feed';
import type { Cue } from '../sound';
import { useCountdownCues, useNextHandler, useStepClock, useSwipeHold } from '../useStepClock';

export interface TestStepProps {
  step: WorkStep;
  index: number;
  paused: boolean;
  beep: (cue: Cue) => void;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
  holdSwipe?: (hold: SwipeHold | null) => void;
}

type Phase = 'ready' | 'running' | 'result';

/**
 * Max-effort test item. Timed tests count down the windowSec (the athlete may stop early), then ask
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
  holdSwipe,
}: TestStepProps) {
  const { t, l } = useT();
  const exercise = findExercise(step.exerciseId);
  const measureUnit: ExerciseUnit = exercise?.unit ?? 'reps';
  const timed = step.mode === 'timer' && (step.durationSec ?? 0) > 0;
  const windowSec = timed ? (step.durationSec ?? step.target) : undefined;

  const [phase, setPhase] = useState<Phase>(timed ? 'ready' : 'result');
  const [value, setValue] = useState(0);
  const clock = useStepClock(phase === 'running' && !paused, windowSec);

  const toResult = useCallback(
    (seconds: number) => {
      setPhase('result');
      if (measureUnit === 'seconds') setValue(Math.round(seconds));
    },
    [measureUnit],
  );
  const onDone = useCallback(() => toResult(windowSec ?? 0), [toResult, windowSec]);
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
  /*
   * «Next» on a test starts it and then stops it — neither of which is the page turning, and a
   * feed that slid away and came back would say otherwise. So up is held until there is a result
   * to save, and down while the clock runs.
   */
  useSwipeHold(holdSwipe, phase !== 'result', phase === 'running');

  const targetChip = timed
    ? `${t('training.block_test')} · ${Math.round((windowSec ?? 0) / 60) > 0 ? t('common.minutesShort', { n: Math.round((windowSec ?? 0) / 60) }) : `${windowSec} ${t('training.seconds')}`}`
    : t('training.block_test');

  return (
    <div className="flex flex-col gap-6 md:flex-1">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* A hint, not a kicker — a sentence in the quiet register rather than a section mark.
            See `.eyebrow` in global.css for the line the two sit either side of. */}
        <span className="text-[13px] leading-[1.3] text-muted">{t('training.testHint')}</span>

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
          /* Before and during the test the clock is in the band; the result phase has no clock,
             only the stepper the athlete types the number into. */
          <PlayerTimerSlot>
            <BigClock
              seconds={phase === 'ready' ? (windowSec ?? 0) : clock.remainingSec}
              tone={phase === 'running' && clock.remainingSec <= 3 ? 'urgent' : 'default'}
              caption={step.item.note ? l(step.item.note) : undefined}
            />
          </PlayerTimerSlot>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <Chip tone="accent">{targetChip}</Chip>
        </div>
      </div>

      {phase === 'ready' ? (
        <Button variant="action" size="lg" fullWidth onClick={start} className="md:mt-auto">
          {t('app.playerTestStart')}
        </Button>
      ) : phase === 'running' ? (
        <Button size="lg" fullWidth variant="secondary" onClick={stop} className="md:mt-auto">
          {t('app.playerStop')}
        </Button>
      ) : (
        <Button variant="action" size="lg" fullWidth onClick={save} className="md:mt-auto">
          {t('app.playerTestSave')}
        </Button>
      )}
    </div>
  );
}
