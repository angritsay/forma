import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useT } from '@/app/hooks/useT';
import type { PrescribedWorkout } from '@/lib/training/types';
import { BigClock } from '../BigClock';
import { ExplainPanel } from '../ExplainPanel';
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

/**
 * Rest is when the coach talks. The countdown runs, his video for the next exercise plays above,
 * its name and target sit here, and the words wait behind "Подробнее". Auto-advances at zero;
 * "Поехали" goes early.
 */
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
    <div className="flex flex-col gap-5">
      <BigClock
        seconds={clock.remainingSec}
        label={t('training.rest')}
        tone={clock.remainingSec <= 3 && clock.remainingSec > 0 ? 'accent' : 'default'}
      />
      {nextId ? (
        <div className="flex flex-col gap-2">
          <span className="eyebrow">{t('app.playerRestNext')}</span>
          <h2 className="font-display text-3xl">
            {nextExercise ? nextExercise.name[locale] : nextId}
          </h2>
          {nextItem ? (
            <div className="flex flex-wrap gap-2">
              <Chip tone="accent">{targetLabel(t, nextItem)}</Chip>
            </div>
          ) : null}
        </div>
      ) : null}
      {nextId && nextItem ? <ExplainPanel exerciseId={nextId} item={nextItem} /> : null}
      <Button size="lg" fullWidth onClick={advance}>
        {t('app.playerGo')}
      </Button>
    </div>
  );
}
