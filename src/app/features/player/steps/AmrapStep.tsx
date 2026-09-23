import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useT } from '@/app/hooks/useT';
import type { PlayerResult } from '@/app/store/activeWorkout';
import { BigClock } from '../BigClock';
import type { SwipeHold } from '../feed';
import { ItemList } from '../ItemList';
import { PlayerTimerSlot } from '../PlayerChrome';
import { Stepper } from '../Stepper';
import { amrapExpectedText, clampCount, type AmrapStep as Step } from '../model';
import type { Cue } from '../sound';
import { useCountdownCues, useNextHandler, useStepClock, useSwipeHold } from '../useStepClock';

export interface AmrapStepProps {
  step: Step;
  index: number;
  paused: boolean;
  beep: (cue: Cue) => void;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  registerNext: (fn: (() => void) | null) => void;
  /** Which row's clip is behind the board, and how a tap on a row changes it. */
  clip?: number;
  onClip?: (index: number) => void;
  holdSwipe?: (hold: SwipeHold | null) => void;
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
  clip,
  onClip,
  holdSwipe,
}: AmrapStepProps) {
  const { t, locale } = useT();
  const [phase, setPhase] = useState<Phase>('running');
  const [rounds, setRounds] = useState(0);
  const [extraReps, setExtraReps] = useState(0);
  const duration = Math.max(1, step.durationSec);
  const clock = useStepClock(phase === 'running' && !paused, duration);

  const timeUp = useCallback(() => setPhase('result'), []);
  useCountdownCues(clock, phase === 'running' && !paused, beep, timeUp);

  // Max reps (one movement): the count is reps, and it is saved as `{ rounds: 0, extraReps }`,
  // which session.ts reads as total / target.
  const maxReps = step.maxReps === true;
  const goal = step.items[0]?.target ?? 0;
  const addReps = (n: number) => {
    setExtraReps((r) => clampCount(r + n));
    if (n > 0) beep('round');
  };

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
  /*
   * A running AMRAP is not swiped away. Swiping up used to be «next», and «next» here is «time's
   * up» — so a thumb brushing the screen between rounds ended a twelve-minute piece at minute
   * three. The feed now holds both ways while the clock runs; the pause menu and the keys still
   * move on, because those are asked for on purpose.
   */
  useSwipeHold(holdSwipe, phase === 'running', phase === 'running');

  const minutes = Math.round(duration / 60);

  if (maxReps) {
    return (
      <div className="flex flex-col gap-6">
        {phase === 'running' ? (
          <>
            <PlayerTimerSlot>
              <BigClock
                seconds={clock.remainingSec}
                label={t('training.format_amrap')}
                tone={clock.remainingSec <= 3 && clock.remainingSec > 0 ? 'urgent' : 'default'}
                caption={`${t('training.maxRepsHint', { min: minutes })} · ${t('training.maxRepsGoal', { n: goal })}`}
              />
            </PlayerTimerSlot>
            <ItemList items={step.items} compact onSelect={onClip} activeIndex={clip} />
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-col">
                <span className="eyebrow">{t('app.playerMaxRepsCount')}</span>
                <span className="numeral tabular mt-1 text-5xl leading-none">{extraReps}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconButton
                  label={t('app.playerMaxRepsRemove')}
                  icon="minus"
                  variant="surface"
                  onClick={() => addReps(-1)}
                  disabled={extraReps === 0}
                />
                <IconButton
                  label={t('app.playerMaxRepsAddOne')}
                  icon="plus"
                  variant="surface"
                  onClick={() => addReps(1)}
                />
                <Button
                  variant="action"
                  size="lg"
                  onClick={() => addReps(5)}
                  className="px-6"
                  aria-label={t('app.playerMaxRepsAddFive')}
                >
                  +5
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="display text-center text-5xl">{t('app.playerTimeUp')}</h2>
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <span className="eyebrow text-center">{t('app.playerMaxRepsQuestion')}</span>
              <Stepper
                value={extraReps}
                onChange={setExtraReps}
                size="lg"
                unit={t('training.reps')}
                label={t('app.playerMaxRepsQuestion')}
                decreaseLabel={t('app.playerDecrease')}
                increaseLabel={t('app.playerIncrease')}
              />
              <div className="flex justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => addReps(-5)}>
                  −5
                </Button>
                <Button variant="secondary" size="sm" onClick={() => addReps(5)}>
                  +5
                </Button>
              </div>
            </div>
            <Button variant="action" size="lg" fullWidth onClick={save}>
              {t('app.playerMaxRepsSave')}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {phase === 'running' ? (
        <>
          {/* Running: the clock is up in the band, the round count and its two controls are here. */}
          <PlayerTimerSlot>
            <BigClock
              seconds={clock.remainingSec}
              label={t('training.format_amrap')}
              tone={clock.remainingSec <= 3 && clock.remainingSec > 0 ? 'urgent' : 'default'}
              caption={`${t('training.amrapHint', { min: minutes })} · ${amrapExpectedText(t, locale, step.expectedRounds)}`}
            />
          </PlayerTimerSlot>
          {/*
           * The board: what one round is. It used to be only on the card's back, which left the
           * front of an AMRAP a clock, a zero and nothing to do — the screenshot the owner sent.
           * A tap on a row plays that movement's clip behind it.
           */}
          <ItemList items={step.items} compact onSelect={onClip} activeIndex={clip} />
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
              <Button variant="action" size="lg" onClick={addRound} className="px-6">
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
            {/* A hint, not a kicker: 13px muted at regular weight. `.eyebrow` is the same size and
                colour at 600, and it is reserved for the two or three words that mark a section —
                this is a sentence telling you what the stepper under it counts. */}
            <span className="text-center text-[13px] leading-[1.3] text-muted">
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
          <Button variant="action" size="lg" fullWidth onClick={save}>
            {t('app.playerSaveScore')}
          </Button>
        </>
      )}
    </div>
  );
}
