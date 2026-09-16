/**
 * The assessment itself: one movement at a time, drawn the way the player draws a step.
 *
 * It runs as a full-screen surface over the wizard rather than inside it. The wizard's chrome — a
 * back arrow, a step counter, a progress rule, a «Продолжить» button — is right for a form and
 * wrong for a minute of work: what is needed here is the movement and the clock, and everything
 * else is something to look at instead of the floor.
 *
 * The owner called the player the one good screen, so this reads like it: the clip full-bleed
 * behind everything, a pane of glass along the foot (`.glass-bar`, the player's own material), and
 * on the glass the movement's name in the display face and one thing under it. Three moments per
 * movement, and each shows only what that moment needs:
 *   ready  — the name, one short line, and «Начать».
 *   work   — the name and the clock inside a ring that drains with it. Nothing else at all —
 *            except on a hold, which the athlete has to be able to end: there «Стоп» is the second
 *            thing on the screen, and it is what times the hold for them.
 *   count  — the name and the field for the number, pre-filled on a hold.
 *
 * The clip is drawn the player's way (`ART` below, and the note in `screens/PlayerScreen.tsx`):
 * as wide as the stage on a phone, with the stage cropping whatever the frame's own height runs
 * past, and contained on a laptop. It is geometry rather than a measurement, so there is no moment
 * at which the answer is missing and the frame falls back to bars down both sides.
 *
 * The last three seconds are ticked and the end is a long low horn (`sound.ts`), because the eyes
 * are on the floor at that point and the screen cannot be the thing that says "stop". The audio
 * context is unlocked by the tap on «Начать» — browsers give sound to a gesture and to nothing
 * else — and the wake lock keeps the phone from dimming mid-minute.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { RingProgress } from '@/components/ui/RingProgress';
import { formatClock } from '@/i18n/index';
import { EXERCISE_BY_ID } from '@/content/registry';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
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

/**
 * The picture behind everything: the clip, or the still while there is no clip.
 *
 * The stage is the whole screen, and the clip is fitted to it per its own shape — see the file
 * comment and the player's `ArtLayer`, which this repeats in miniature rather than imports,
 * because that layer is sized against the player's measured panel and this one is not.
 */
/**
 * The same one rule the player draws its movement by (`screens/PlayerScreen.tsx`, `ART`): full
 * width on a phone with the stage cropping the overflow, contained on a laptop. It used to measure
 * the clip and choose between `cover` and `contain`, and the choice could simply not arrive — see
 * the note in the player for the screenshot that proved it.
 */
const ART = 'w-full h-auto md:h-full md:w-auto md:max-h-full md:max-w-full object-contain';

function Art({ exerciseId, videoUrl }: { exerciseId: string | undefined; videoUrl?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={stage}
      className="pointer-events-none absolute inset-0 flex items-center overflow-hidden bg-bg"
      aria-hidden="true"
    >
      {videoUrl ? (
        <video
          key={videoUrl}
          ref={video}
          src={videoUrl}
          className={ART}
          playsInline
          muted
          loop
          autoPlay
          preload="metadata"
        />
      ) : (
        <ExerciseStill key={exerciseId} exerciseId={exerciseId} className={ART} loading="eager" />
      )}
      {/* The header's plate: a short fade from the top so the way out and the count read on any frame. */}
      <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-ink/55 to-transparent" />
    </div>
  );
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
  const total = move?.seconds ?? 0;
  const timer = useCountdown(total);
  /*
   * Show the movement being done, not the movement the entry is named after.
   *
   * Ticking «с колен» used to change how the number was scored and nothing else: the screen kept
   * playing the full push-up clip under the full push-up's name while asking for knee push-ups.
   * In the one minute that decides the next eight weeks of programming, the demonstration has to
   * be of the thing the athlete is actually doing.
   */
  const shownId = move ? (onKnees && move.kneeExerciseId) || move.exerciseId : undefined;
  const videoUrl = useMediaUrl(exerciseVideoRef(shownId, locale));
  const exercise = shownId ? EXERCISE_BY_ID.get(shownId) : undefined;
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
    setReps(String(Math.max(0, total - timer.remainingSec)));
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
  const last = index + 1 >= ASSESSMENT_MOVES.length;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg text-paper">
      <Art exerciseId={shownId} videoUrl={videoUrl} />

      {/*
       * The top edge: the way out, and where you are as the numeral pair the whole product counts
       * with. The way out is offered only before the first movement has started; once a minute has
       * been counted, leaving would throw it away, and the wizard is one tap on from the last one.
       */}
      <header className="relative z-10 flex h-14 items-center justify-between px-3 pt-[var(--safe-top)]">
        <div className="w-11">
          {index === 0 && phase === 'ready' ? (
            <IconButton label={t('common.back')} icon="back" variant="on-art" onClick={onCancel} />
          ) : null}
        </div>
        <span className="numeral tabular pr-2 text-sm">
          <span className="text-paper">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-paper/55">/{String(ASSESSMENT_MOVES.length).padStart(2, '0')}</span>
        </span>
      </header>

      <div className="flex-1" />

      {/* The glass at the foot — the player's panel, with the player's alphas. */}
      <div className="relative z-10">
        <div
          aria-hidden="true"
          className="glass-bar glass-sheer pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-full h-16 bg-linear-to-t from-bg/45 to-transparent"
        />
        <div className="relative mx-auto flex w-full max-w-[560px] flex-col items-center gap-5 px-6 pt-6 pb-[calc(var(--safe-bottom)+16px+var(--demo-inset,0px))] text-center">
          <DisplayTitle as="h2" text={name} className="text-3xl text-paper" />

          {phase === 'ready' ? (
            <>
              {/* One line, not the paragraph that stood here: the screen before this one has
                  already said not to squeeze out a maximum, and beside a clip nobody reads more. */}
              <p className="text-[14px] text-paper/70">
                {hold ? t('app.onbAssessInstructionHold') : t('app.onbAssessInstruction')}
              </p>
              {move.kneeExerciseId ? (
                /* «С колен» is a choice, so it is a chip that selects rather than a checkbox that
                   labels: the same control the rest of the app uses to pick a variant. */
                <Chip
                  role="checkbox"
                  aria-checked={onKnees}
                  selected={onKnees}
                  tone="on-art"
                  onClick={() => onKneesChange(!onKnees)}
                >
                  {t('app.onbAssessOnKnees')}
                </Chip>
              ) : null}
              <Button size="lg" fullWidth onClick={start}>
                {t('common.start')}
              </Button>
            </>
          ) : null}

          {phase === 'work' ? (
            <>
              {/*
               * The ring drains with the minute, white because no course is in scope, with the
               * clock inside it — the prototype's timer («0:37» in a ring over the clip). The ring
               * is what makes «0:12» mean something: a minute-long window and a twenty-second one
               * read the same in digits and nothing alike as an arc.
               */}
              <RingProgress
                value={total > 0 ? timer.remainingSec / total : 0}
                size={200}
                stroke={6}
                tone="primary"
                label={name}
                valueText={formatClock(timer.remainingSec)}
              >
                <span aria-live="off" className="numeral tabular text-[52px] leading-none">
                  {formatClock(timer.remainingSec)}
                </span>
              </RingProgress>
              {hold ? (
                <Button size="lg" fullWidth onClick={stopHold}>
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
                className="numeral text-center text-3xl"
                wrapperClassName="w-full"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
              <Button
                size="lg"
                fullWidth
                disabled={parseIntField(reps, maxAnswer) === undefined}
                onClick={accept}
              >
                {last ? t('common.done') : t('common.continue')}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
