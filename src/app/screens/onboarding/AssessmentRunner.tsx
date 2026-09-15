/**
 * The assessment itself: one movement at a time, and on the screen almost nothing.
 *
 * It runs as a full-screen surface over the wizard rather than inside it. The wizard's chrome — a
 * back arrow, a step counter, a progress rule, a «Продолжить» button — is right for a form and
 * wrong for a minute of work: what is needed here is the movement and the clock, and everything
 * else is something to look at instead of the floor.
 *
 * Three moments per movement, and each shows only what that moment needs:
 *   ready  — the clip, the movement's name, the one instruction, and «Начать».
 *   work   — the clip and the count-down. Nothing else at all — except on a hold, which the
 *            athlete has to be able to end: there «Стоп» is the second thing on the screen, and it
 *            is what times the hold for them.
 *   count  — the clip, and the field for the number, pre-filled on a hold.
 *
 * The last three seconds are ticked and the end is a long low horn (`sound.ts`), because the eyes
 * are on the floor at that point and the screen cannot be the thing that says "stop". The audio
 * context is unlocked by the tap on «Начать» — browsers give sound to a gesture and to nothing
 * else — and the wake lock keeps the phone from dimming mid-minute.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatClock } from '@/i18n/index';
import { EXERCISE_BY_ID } from '@/content/registry';
import { exerciseVideoRef } from '@/app/features/player/model';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';
import { playCue, unlockAudio } from '@/app/features/player/sound';
import { useWakeLock } from '@/app/features/player/useWakeLock';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { useT } from '@/app/hooks/useT';
import { useCountdown } from '@/app/hooks/useTimer';
import { parseIntField, REPS_MAX } from './draft';
import { ASSESSMENT_MOVES } from '@content/site/assessment';

/** The last N seconds are ticked. */
const TICK_FROM_SEC = 3;

type Phase = 'ready' | 'work' | 'count';

export interface AssessmentRunnerProps {
  /** Whether the push-ups are done on the knees; the index scores the two differently. */
  onKnees: boolean;
  /** A movement's answer, the moment it is given. */
  onCount: (exerciseId: string, reps: number) => void;
  onKneesChange: (onKnees: boolean) => void;
  /** Every movement is done. */
  onDone: () => void;
  /** Left before the first movement started: the wizard shows the offer again. */
  onCancel: () => void;
}

export function AssessmentRunner({
  onKnees,
  onCount,
  onKneesChange,
  onDone,
  onCancel,
}: AssessmentRunnerProps) {
  const { t, l, locale } = useT();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [reps, setReps] = useState('');
  const move = ASSESSMENT_MOVES[index];
  const timer = useCountdown(move?.seconds ?? 0);
  const videoUrl = useMediaUrl(exerciseVideoRef(move?.exerciseId, locale));
  const exercise = move ? EXERCISE_BY_ID.get(move.exerciseId) : undefined;
  const ticked = useRef<number | null>(null);

  useWakeLock(phase === 'work');

  // 3, 2, 1 — once per second, however often the clock is polled.
  useEffect(() => {
    if (phase !== 'work') return;
    const left = timer.remainingSec;
    if (ticked.current === left) return;
    ticked.current = left;
    if (left > 0 && left <= TICK_FROM_SEC) playCue('tick');
  }, [phase, timer.remainingSec]);

  useEffect(() => {
    if (phase !== 'work' || !timer.done) return;
    playCue('horn');
    setPhase('count');
  }, [phase, timer.done]);

  if (!move || !exercise) return null;

  const start = () => {
    unlockAudio();
    ticked.current = null;
    setPhase('work');
    timer.restart();
  };

  /** A hold ends when the back does: the screen records how far into the window that was. */
  const stopHold = () => {
    setReps(String(Math.max(0, (move?.seconds ?? 0) - timer.remainingSec)));
    timer.pause();
    playCue('horn');
    setPhase('count');
  };

  const accept = () => {
    const value = parseIntField(reps, maxAnswer);
    if (value === undefined) return;
    onCount(move.exerciseId, value);
    if (index + 1 >= ASSESSMENT_MOVES.length) {
      onDone();
      return;
    }
    setIndex(index + 1);
    setReps('');
    setPhase('ready');
    timer.reset();
  };

  const name = l(exercise.name);
  const hold = move.metric === 'seconds';
  /* A count has no ceiling worth naming; a hold cannot outlast the window that timed it. */
  const maxAnswer = hold ? move.seconds : REPS_MAX;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg pt-[var(--safe-top)] pb-[calc(var(--safe-bottom)+16px)]">
      {/*
       * Where you are, as the numeral pair the whole product counts with. It is the only thing on
       * the screen that is not the movement, the clock or the way on.
       */}
      <div className="flex items-center gap-3 px-6 pt-4">
        <span className="font-display min-w-0 flex-1 truncate text-base">{name}</span>
        <span className="numeral tabular shrink-0 text-sm">
          <span className="text-text">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-muted-2">/{String(ASSESSMENT_MOVES.length).padStart(2, '0')}</span>
        </span>
      </div>

      {/*
       * The clip, edge to edge.
       *
       * It used to be `size-full object-contain`, which fits the clip inside the stage on whichever
       * side runs out first — and on a phone that is the height, so a vertical clip sat in a
       * letterbox with a black bar down each side and the movement shrank into the middle.
       *
       * `w-full h-auto` reverses which side wins: the clip is as wide as the screen, and its height
       * is whatever its own shape gives. Nothing is cropped, which matters more here than it looks.
       * The first fix tried was `object-cover`, and the player's own notes one screen over record
       * why that was reverted the last time: some movements are filmed in landscape, and a
       * landscape frame cropped into a phone-shaped hole keeps a vertical strip through the middle
       * — the squat happens off-screen and the clip is worth nothing.
       *
       * `max-h-full` is the floor under all of it: a clip taller than the stage is fitted to the
       * height instead, because a movement that runs off the bottom of the screen is worse than
       * one with room at its sides.
       */}
      <div className="relative mt-5 flex min-h-0 flex-1 items-center overflow-hidden">
        {videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            className="h-auto max-h-full w-full object-contain"
            playsInline
            muted
            loop
            autoPlay
            preload="metadata"
          />
        ) : (
          <ExerciseStill
            exerciseId={move.exerciseId}
            className="h-auto max-h-full w-full object-contain"
            loading="eager"
          />
        )}
      </div>

      <div className="flex flex-col gap-5 px-6 pt-6">
        {phase === 'ready' ? (
          <>
            <p className="text-[15px] leading-snug text-muted">
              {hold ? t('app.onbAssessInstructionHold') : t('app.onbAssessInstruction')}
            </p>
            {move.kneeOption ? (
              <label className="flex items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  checked={onKnees}
                  onChange={(e) => onKneesChange(e.target.checked)}
                  className="size-5 accent-primary"
                />
                {t('app.onbAssessOnKnees')}
              </label>
            ) : null}
            <Button size="lg" fullWidth onClick={start}>
              {t('common.start')}
            </Button>
            {index === 0 ? (
              <Button variant="ghost" fullWidth onClick={onCancel}>
                {t('common.back')}
              </Button>
            ) : null}
          </>
        ) : null}

        {phase === 'work' ? (
          <>
            <div aria-live="off" className="numeral tabular text-center text-7xl leading-none">
              {formatClock(timer.remainingSec)}
            </div>
            {hold ? (
              <Button variant="secondary" size="lg" fullWidth onClick={stopHold}>
                {t('app.onbAssessStop')}
              </Button>
            ) : null}
          </>
        ) : null}

        {phase === 'count' ? (
          <>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={maxAnswer}
              aria-label={hold ? t('app.onbAssessHoldLabel') : t('app.onbAssessCountLabel')}
              placeholder="0"
              autoFocus
              className="text-center text-2xl"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <Button
              size="lg"
              fullWidth
              disabled={parseIntField(reps, maxAnswer) === undefined}
              onClick={accept}
            >
              {index + 1 >= ASSESSMENT_MOVES.length ? t('common.done') : t('common.continue')}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
