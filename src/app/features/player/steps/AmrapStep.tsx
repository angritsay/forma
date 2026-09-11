import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import { BigClock } from '../BigClock';
import { Stepper } from '../Stepper';
import { clampCount, type AmrapStep as Step } from '../model';
import type { Cue } from '../sound';
import { useCountdownCues, useNextHandler, useStepClock } from '../useStepClock';

export interface AmrapStepProps {
  step: Step;
  index: number;
  paused: boolean;
  beep: (cue: Cue) => void;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
}

type Phase = 'running' | 'result';

/** AMRAP: countdown, movement board, round counter; at zero, partial reps and the score. */
export function AmrapStep({
  step,
  index,
  paused,
  beep,
  onRecord,
  onNext,
  registerNext,
}: AmrapStepProps) {
  const { t } = useT();
  const [phase, setPhase] = useState<Phase>('running');
  const [rounds, setRounds] = useState(0);
  const [extraReps, setExtraReps] = useState(0);
  const duration = Math.max(1, step.durationSec);
  const clock = useStepClock(phase === 'running' && !paused, duration);

  const timeUp = useCallback(() => setPhase('result'), []);
  useCountdownCues(clock, phase === 'running' && !paused, beep, timeUp);

  const addRound = () => {
    setRounds((r) => clampCount(r + 1));
    beep('round');
  };
  const save = () => {
    onRecord({ stepIndex: index, blockId: step.blockId, completed: true, rounds, extraReps });
    onNext();
  };
  useNextHandler(registerNext, () => {
    if (phase === 'running') setPhase('result');
    else save();
  });

  const minutes = Math.round(duration / 60);

  return (
    <div className="flex flex-col gap-6">
      {phase === 'running' ? (
        <>
          <BigClock
            seconds={clock.remainingSec}
            label={t('training.format_amrap')}
            tone={clock.remainingSec <= 3 && clock.remainingSec > 0 ? 'accent' : 'default'}
            caption={`${t('training.amrapHint', { min: minutes })} · ${t('training.amrapExpected', { n: step.expectedRounds })}`}
          />
          {/* The round count on a rule, the two controls opposite it — no box. */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex flex-col">
              <span className="eyebrow">{t('app.playerAmrapRounds')}</span>
              <span className="numeral tabular mt-1 text-5xl leading-none">{rounds}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconButton
                label={t('app.playerAmrapRemoveRound')}
                icon="minus"
                variant="surface"
                onClick={() => setRounds((r) => Math.max(0, r - 1))}
                disabled={rounds === 0}
              />
              <Button size="lg" onClick={addRound} className="px-6">
                {t('app.playerRoundDone')}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="display text-center text-5xl">{t('app.playerTimeUp')}</h2>
          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <span className="eyebrow text-center">{t('app.playerAmrapRounds')}</span>
            <Stepper
              value={rounds}
              onChange={setRounds}
              size="md"
              label={t('app.playerAmrapRounds')}
              decreaseLabel={t('app.playerDecrease')}
              increaseLabel={t('app.playerIncrease')}
            />
            <span className="eyebrow-sentence text-center">{t('app.playerAmrapPartial')}</span>
            <Stepper
              value={extraReps}
              onChange={setExtraReps}
              size="md"
              unit={t('training.reps')}
              label={t('app.playerAmrapPartial')}
              decreaseLabel={t('app.playerDecrease')}
              increaseLabel={t('app.playerIncrease')}
            />
          </div>
          <Button size="lg" fullWidth onClick={save}>
            {t('app.playerSaveScore')}
          </Button>
        </>
      )}
    </div>
  );
}
