import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import type { PrescribedWorkout } from '@/lib/training/types';
import { BigClock } from '../BigClock';
import { findBlock, targetLabel, type RestStep as Step } from '../model';
import type { Cue } from '../sound';
import { useCountdownCues, useNextHandler, useStepClock } from '../useStepClock';

export interface RestStepProps {
  step: Step;
  prescribed: PrescribedWorkout;
  paused: boolean;
  beep: (cue: Cue) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
}

/**
 * Rest is when the coach talks: the countdown runs and his clip for the next exercise plays above.
 *
 * The name of that exercise is not repeated here. The player says «Дальше: …» once, under the
 * transport, on every kind of step — so a rest screen that also announced it was printing the same
 * sentence twice, one above the other. What is left is the number that matters and the way out of
 * it. Auto-advances at zero; «Поехали» goes early.
 */
export function RestStep({ step, prescribed, paused, beep, onNext, registerNext }: RestStepProps) {
  const { t } = useT();
  const advanced = useRef(false);
  const clock = useStepClock(!paused, Math.max(1, step.durationSec));

  const advance = useCallback(() => {
    if (advanced.current) return;
    advanced.current = true;
    onNext();
  }, [onNext]);

  useCountdownCues(clock, !paused, beep, advance);
  useNextHandler(registerNext, advance);

  const nextId = step.nextExerciseId;
  // How much of it, though — «12 повторов» is the thing you spend the rest deciding about.
  const nextItem = nextId
    ? findBlock(prescribed, step.blockId)?.items.find((it) => it.exerciseId === nextId)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <BigClock
        seconds={clock.remainingSec}
        label={t('training.rest')}
        tone={clock.remainingSec <= 3 && clock.remainingSec > 0 ? 'accent' : 'default'}
        {...(nextItem ? { caption: targetLabel(t, nextItem) } : {})}
      />
      <Button size="lg" fullWidth onClick={advance}>
        {t('app.playerGo')}
      </Button>
    </div>
  );
}
