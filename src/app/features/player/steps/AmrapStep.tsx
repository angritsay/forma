import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import { BigClock } from '../BigClock';
import { ItemList } from '../ItemList';
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
          <ItemList items={step.items} compact className="rounded-inner bg-surface-2 px-4 py-2" />
          <div className="flex items-center justify-between gap-3 rounded-card bg-surface-2 p-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {t('app.playerAmrapRounds')}
              </span>
              <span className="tabular text-5xl font-bold leading-none">{rounds}</span>
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
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-display text-4xl text-accent">{t('app.playerTimeUp')}</span>
            <p className="text-[15px] text-muted">{t('app.playerAmrapScoreLead')}</p>
          </div>
          <div className="flex flex-col gap-4 rounded-card bg-surface-2 p-4">
            <span className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {t('app.playerAmrapRounds')}
            </span>
            <Stepper
              value={rounds}
              onChange={setRounds}
              size="md"
              label={t('app.playerAmrapRounds')}
              decreaseLabel={t('app.playerDecrease')}
              increaseLabel={t('app.playerIncrease')}
            />
            <span className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {t('app.playerAmrapPartial')}
            </span>
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
