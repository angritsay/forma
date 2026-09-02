import { useCallback, useRef } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import type { PrescribedWorkout } from '@/lib/training/types';
import { BigClock } from '../BigClock';
import { findBlock, findExercise, targetLabel, type RestStep as Step } from '../model';
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

/** Rest countdown with the next exercise preview; skippable, auto-advances at zero. */
export function RestStep({ step, prescribed, paused, beep, onNext, registerNext }: RestStepProps) {
  const { t, locale } = useT();
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
  const nextExercise = nextId ? findExercise(nextId) : undefined;
  const nextItem = nextId
    ? findBlock(prescribed, step.blockId)?.items.find((it) => it.exerciseId === nextId)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <BigClock
        seconds={clock.remainingSec}
        label={t('training.rest')}
        tone={clock.remainingSec <= 3 && clock.remainingSec > 0 ? 'accent' : 'default'}
      />
      {nextId ? (
        <div className="flex items-center gap-3 rounded-inner bg-surface-2 px-4 py-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-inner bg-surface-3 text-text">
            <ExerciseFigure
              animation={nextExercise?.animation ?? nextId}
              variant="thumb"
              className="h-10 w-10"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {t('app.playerRestNext')}
            </span>
            <span className="block truncate text-[15px] font-medium">
              {nextExercise ? nextExercise.name[locale] : nextId}
            </span>
          </span>
          {nextItem ? (
            <span className="tabular shrink-0 text-sm font-semibold">{targetLabel(t, nextItem)}</span>
          ) : null}
        </div>
      ) : null}
      <Button size="lg" fullWidth variant="secondary" onClick={advance}>
        {t('app.playerSkipRest')}
      </Button>
    </div>
  );
}
