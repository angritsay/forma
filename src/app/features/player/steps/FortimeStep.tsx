import { clsx } from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import { formatClock } from '@/i18n/index';
import { BigClock } from '../BigClock';
import { ItemList } from '../ItemList';
import type { FortimeStep as Step } from '../model';
import type { Cue } from '../sound';
import { useCountdownCues, useNextHandler, useStepClock } from '../useStepClock';

export interface FortimeStepProps {
  step: Step;
  index: number;
  paused: boolean;
  beep: (cue: Cue) => void;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
}

type Phase = 'running' | 'finished' | 'capped';

/** For time: stopwatch against a cap, per-round checklist; "Finished" records the time. */
export function FortimeStep({
  step,
  index,
  paused,
  beep,
  onRecord,
  onNext,
  registerNext,
}: FortimeStepProps) {
  const { t } = useT();
  const [phase, setPhase] = useState<Phase>('running');
  const [roundsDone, setRoundsDone] = useState(0);
  const recorded = useRef(false);
  const cap = step.capSec > 0 ? step.capSec : undefined;
  const clock = useStepClock(phase === 'running' && !paused, cap);

  const record = useCallback(
    (result: Omit<PlayerResult, 'stepIndex' | 'blockId'>) => {
      if (recorded.current) return;
      recorded.current = true;
      onRecord({ stepIndex: index, blockId: step.blockId, ...result });
    },
    [index, step.blockId, onRecord],
  );

  const finish = useCallback(() => {
    if (phase !== 'running') return;
    setPhase('finished');
    beep('end');
    record({ completed: true, timeSec: clock.elapsedSec });
  }, [phase, beep, record, clock.elapsedSec]);

  const onCap = useCallback(() => {
    setPhase('capped');
    record({ completed: false, timeSec: cap ?? clock.elapsedSec });
  }, [record, cap, clock.elapsedSec]);
  useCountdownCues(clock, phase === 'running' && !paused, beep, onCap);

  const roundDone = () => {
    const next = roundsDone + 1;
    setRoundsDone(next);
    if (next >= step.rounds) finish();
    else beep('round');
  };

  useNextHandler(registerNext, () => {
    if (phase === 'running') finish();
    else onNext();
  });

  const remaining = cap !== undefined ? cap - clock.elapsedSec : undefined;

  return (
    <div className="flex flex-col gap-6">
      {phase === 'running' ? (
        <>
          <BigClock
            seconds={clock.elapsedSec}
            label={t('training.format_fortime')}
            tone={remaining !== undefined && remaining <= 30 ? 'warning' : 'default'}
            caption={t('app.playerFortimeRound', { n: Math.min(roundsDone + 1, step.rounds), total: step.rounds })}
          />
          {cap !== undefined ? (
            <div className="flex justify-center">
              <Chip icon="clock">{t('app.playerFortimeCap', { time: formatClock(cap) })}</Chip>
            </div>
          ) : null}
          <ItemList items={step.items} compact className="rounded-inner bg-surface-2 px-4 py-2" />
          <ol className="flex flex-wrap justify-center gap-2" aria-label={t('app.playerAmrapRounds')}>
            {Array.from({ length: step.rounds }, (_, i) => {
              const done = i < roundsDone;
              const current = i === roundsDone;
              return (
                <li
                  key={i}
                  aria-current={current ? 'step' : undefined}
                  className={clsx(
                    'tabular flex h-9 min-w-9 items-center justify-center gap-1 rounded-pill border px-3 text-sm font-semibold',
                    done
                      ? 'border-success/30 bg-success/15 text-success'
                      : current
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-border bg-surface-2 text-muted',
                  )}
                >
                  {done ? <Icon name="check" size={14} /> : null}
                  {i + 1}
                </li>
              );
            })}
          </ol>
          <Button size="lg" fullWidth onClick={roundDone}>
            {roundsDone + 1 >= step.rounds ? t('app.playerFortimeFinished') : t('app.playerRoundDone')}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className={clsx('font-display text-4xl', phase === 'finished' ? 'text-accent' : 'text-warning')}>
              {phase === 'finished' ? t('app.playerFortimeFinished') : t('app.playerFortimeCapReached')}
            </span>
            <p className="text-[15px] text-muted">
              {phase === 'finished' ? t('app.playerFortimeYourTime') : t('app.playerFortimeCapBody')}
            </p>
            <span className="tabular text-6xl font-bold leading-none">
              {formatClock(phase === 'finished' ? clock.elapsedSec : (cap ?? clock.elapsedSec))}
            </span>
          </div>
          <Button size="lg" fullWidth onClick={onNext}>
            {t('common.continue')}
          </Button>
        </>
      )}
    </div>
  );
}
