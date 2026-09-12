/**
 * Workout player (docs/SPEC.md §10 flow 6) at /play.
 *
 * The screen is the coach's clip — one full viewport of it, or the drawn figure where a movement has
 * no footage — and over it only what someone mid-set can read at arm's length: the step and the elapsed clock pinned to the top, the movement's own numbers and the
 * transport pinned to the bottom. Everything that is words — technique, the block's list, the
 * coach's notes — is below the fold, reached by a scroll, so it can never come between the athlete
 * and the demonstration. Both pinned ends stay put while those words scroll past.
 *
 * State lives in `useActiveWorkoutStore` (persisted), so leaving keeps the session resumable.
 * Keyboard: Space = pause, → next, ← previous.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/app/components/TopBar';
import {
  Controls,
  PausedOverlay,
  PlayerFooter,
  PlayerHeader,
  ScrollCue,
  SectionStepper,
} from '@/app/features/player/PlayerChrome';
import {
  findBlock,
  isTestBlock,
  sectionOfStep,
  skippedResult,
  stepAnimation,
  stepVideoRef,
  nextStepTitle,
  workoutSections,
} from '@/app/features/player/model';
import { useSound } from '@/app/features/player/sound';
import { StepDetails } from '@/app/features/player/StepDetails';
import { AmrapStep } from '@/app/features/player/steps/AmrapStep';
import { BlockIntroStep } from '@/app/features/player/steps/BlockIntroStep';
import { FortimeStep } from '@/app/features/player/steps/FortimeStep';
import { RestStep } from '@/app/features/player/steps/RestStep';
import { TestStep } from '@/app/features/player/steps/TestStep';
import { WarmupGateStep } from '@/app/features/player/steps/WarmupGateStep';
import { WorkRepsStep } from '@/app/features/player/steps/WorkRepsStep';
import { WorkTimerStep } from '@/app/features/player/steps/WorkTimerStep';
import { haptic, setClosingConfirmation } from '@/lib/telegram/webapp';
import { courseTileVars } from '@/lib/ui/tile';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';
import { useWakeLock } from '@/app/features/player/useWakeLock';
import { useT } from '@/app/hooks/useT';
import {
  useActiveWorkoutStore,
  type ActiveSession,
  type PlayerResult,
} from '@/app/store/activeWorkout';
import { findCourse } from '@/content/catalogue';
import type { PlayerStep } from '@/lib/training/types';

/** No tile of its own: the figure is drawn straight onto the player's ground. */
const TRANSPARENT_TILE = 'transparent';
const ELAPSED_TICK_MS = 500;

function NoSession() {
  const { t } = useT();
  const navigate = useNavigate();
  return (
    <Screen header={<TopBar back="/" title={t('app.playerNoSessionTitle')} />}>
      <EmptyState
        title={t('app.playerNoSessionTitle')}
        description={t('app.playerNoSessionBody')}
        action={<Button onClick={() => navigate('/courses')}>{t('app.tabCourses')}</Button>}
      />
    </Screen>
  );
}

interface ArtLayerProps {
  animation: string | undefined;
  playing: boolean;
  videoUrl: string | undefined;
}

/**
 * The demonstration, filling the screen: video where the movement was filmed, the drawn figure on
 * the programme colour where it was not.
 *
 * Either way it is a silent loop behind the clock. The clips are encoded with no audio track at
 * all (scripts/media/prepare-videos.mjs), so there is nothing to mute: the coach talks through
 * each movement while filming, which is worth watching once and wrong to have start up by itself
 * in the middle of someone's set. `muted` is still set on the element — without it a browser
 * refuses to autoplay, audio track or no.
 */
function ArtLayer({ animation, playing, videoUrl }: ArtLayerProps) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (playing) void el.play().catch(() => undefined);
    else el.pause();
  }, [playing, videoUrl]);

  /*
   * The ground is the app's own near-black, not the programme colour, even behind the drawn figure.
   * A screen of full-bleed yellow was the handsomer idea and it does not survive contact with the
   * chrome: the clock, the transport and the header all have to stay legible over whatever is
   * behind them, which means an ink scrim, which turns yellow to olive. Black keeps one set of
   * colours for both cases — a white line on dark, white type on dark — and the programme colour
   * still runs the course path, the section stepper and the progress bar.
   */
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-bg" aria-hidden="true">
      {videoUrl ? (
        <video
          key={videoUrl}
          ref={video}
          src={videoUrl}
          className="size-full object-cover"
          playsInline
          muted
          loop
          autoPlay
          preload="metadata"
        />
      ) : animation ? (
        <div className="flex size-full items-center justify-center p-8">
          <ExerciseFigure
            animation={animation}
            variant="hero"
            playing={playing}
            tile={TRANSPARENT_TILE}
          />
        </div>
      ) : null}
    </div>
  );
}

interface StepViewProps {
  step: PlayerStep;
  index: number;
  session: ActiveSession;
  paused: boolean;
  beep: (cue: 'tick' | 'go' | 'round' | 'end') => void;
  onRecord: (result: PlayerResult) => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  registerNext: (fn: (() => void) | null) => void;
}

function StepView({
  step,
  index,
  session,
  paused,
  beep,
  onRecord,
  onNext,
  onGoTo,
  registerNext,
}: StepViewProps) {
  const prescribed = session.prescribed;
  switch (step.kind) {
    case 'warmup_gate':
      return <WarmupGateStep onGo={onNext} onSkip={() => onGoTo(step.skipToIndex)} />;
    case 'block_intro':
      return <BlockIntroStep step={step} prescribed={prescribed} onNext={onNext} />;
    case 'work': {
      const block = findBlock(prescribed, step.blockId);
      const format = block?.format ?? 'sets';
      const shared = { step, index, onRecord, onNext, registerNext };
      if (isTestBlock(block)) return <TestStep {...shared} paused={paused} beep={beep} />;
      if (step.mode === 'timer' && (step.durationSec ?? 0) > 0) {
        return <WorkTimerStep {...shared} format={format} paused={paused} beep={beep} />;
      }
      return <WorkRepsStep {...shared} format={format} />;
    }
    case 'rest':
      return (
        <RestStep
          step={step}
          prescribed={prescribed}
          paused={paused}
          beep={beep}
          onNext={onNext}
          registerNext={registerNext}
        />
      );
    case 'amrap':
      return (
        <AmrapStep
          step={step}
          index={index}
          paused={paused}
          beep={beep}
          onRecord={onRecord}
          onNext={onNext}
          registerNext={registerNext}
        />
      );
    case 'fortime':
      return (
        <FortimeStep
          step={step}
          index={index}
          paused={paused}
          beep={beep}
          onRecord={onRecord}
          onNext={onNext}
          registerNext={registerNext}
        />
      );
    case 'done':
      return null;
  }
}

interface PlayerProps {
  session: ActiveSession;
  steps: PlayerStep[];
  stepIndex: number;
  paused: boolean;
  elapsedSec: number;
}

function Player({ session, steps, stepIndex, paused, elapsedSec }: PlayerProps) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const sound = useSound();
  const next = useActiveWorkoutStore((s) => s.next);
  const prev = useActiveWorkoutStore((s) => s.prev);
  const goTo = useActiveWorkoutStore((s) => s.goTo);
  const recordResult = useActiveWorkoutStore((s) => s.recordResult);
  const setPaused = useActiveWorkoutStore((s) => s.setPaused);
  const tick = useActiveWorkoutStore((s) => s.tick);
  const finish = useActiveWorkoutStore((s) => s.finish);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [restartNonce, setRestartNonce] = useState(0);
  const nextHandler = useRef<(() => void) | null>(null);
  const registerNext = useCallback((fn: (() => void) | null) => {
    nextHandler.current = fn;
  }, []);

  const overlayOpen = leaveOpen || endOpen;
  const step = steps[stepIndex];
  const prescribed = session.prescribed;
  const summaryPath = `/summary/${session.sessionId}`;
  // The programme colour for the art, the phase kicker and the progress bar — and the ink to match.
  const courseVars = courseTileVars(findCourse(session.courseId)?.tile);

  const animation = step ? stepAnimation(step, prescribed) : undefined;
  /*
   * «Дальше: приседания», under the transport.
   *
   * She asked for it in as many words — "чтобы он сразу понимал, что он делает сейчас и что он
   * делает потом" — and it is the one piece of text this screen gained while losing four others.
   */
  const nextTitle = nextStepTitle(t, locale, steps, stepIndex, prescribed);
  const videoUrl = useMediaUrl(stepVideoRef(step, locale));

  // The last step is `done`: close the session and hand over to the summary.
  useEffect(() => {
    if (step?.kind !== 'done') return;
    haptic('success');
    finish();
    navigate(summaryPath, { replace: true });
  }, [step?.kind, finish, navigate, summaryPath]);

  // Inside Telegram, closing the Mini App mid-workout would lose the session: ask first.
  useEffect(() => {
    setClosingConfirmation(true);
    return () => setClosingConfirmation(false);
  }, []);

  // Elapsed clock: the store derives seconds from timestamps; this only asks it to re-derive.
  useEffect(() => {
    if (paused) return;
    tick();
    const id = window.setInterval(tick, ELAPSED_TICK_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [paused, tick]);

  useWakeLock(!paused);

  const unlock = sound.unlock;
  const doNext = useCallback(() => {
    unlock();
    (nextHandler.current ?? next)();
  }, [next, unlock]);
  const doPrev = useCallback(() => {
    unlock();
    prev();
  }, [prev, unlock]);
  const togglePause = useCallback(() => {
    unlock();
    setPaused(!paused);
  }, [paused, setPaused, unlock]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlayOpen || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable)
        return;
      if (e.key === ' ' || e.code === 'Space') {
        if (tag === 'BUTTON') return;
        e.preventDefault();
        togglePause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        doNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        doPrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlayOpen, togglePause, doNext, doPrev]);

  const skipStep = () => {
    if (step) {
      const skipped = skippedResult(step, stepIndex);
      if (skipped) recordResult(skipped);
    }
    next();
  };
  const restartStep = () => {
    setRestartNonce((n) => n + 1);
  };
  const endWorkout = () => {
    setEndOpen(false);
    finish();
    navigate(summaryPath, { replace: true });
  };
  const leave = () => {
    setLeaveOpen(false);
    setPaused(true);
    // A custom workout has no course path to return to.
    navigate(session.courseId === 'custom' ? '/' : `/courses/${session.courseId}`);
  };

  return (
    // The player is the only route that does not go through <Screen>, so it carries the app's
    // <main> landmark itself.
    <main className="relative bg-bg" style={courseVars} onPointerDownCapture={unlock}>
      {/*
       * The stage: one viewport of the demonstration and nothing in it. The header floats over the
       * top of it and the footer over the bottom, so the frame really does run edge to edge.
       */}
      <section className="relative h-dvh w-full overflow-hidden">
        <ArtLayer animation={animation} playing={!paused} videoUrl={videoUrl} />
      </section>

      {/*
       * Below the fold. Nothing here is needed to do the set — it is the part someone scrolls to
       * when they want to check how the movement goes, or what else is in this block.
       */}
      <section /*
       * `pb-8` clears the fade the footer draws above itself: it is decoration over the page,
       * and without the room the last line of the technique ends underneath it.
       */
        className="relative z-10 mx-auto flex w-full max-w-[560px] flex-col gap-5 bg-bg px-5 pt-5 pb-8"
      >
        {step ? (
          <SectionStepper
            sections={workoutSections(prescribed)}
            current={sectionOfStep(step, prescribed)}
          />
        ) : null}
        {step ? <StepDetails step={step} prescribed={prescribed} /> : null}
      </section>

      <PlayerHeader
        progress={steps.length > 1 ? stepIndex / (steps.length - 1) : 0}
        elapsedSec={elapsedSec}
        onBack={() => setLeaveOpen(true)}
      />
      {/*
       * There is no unmute button over the video. The clips carry no audio track at all
       * (scripts/media/prepare-videos.mjs), so the button toggled nothing — it just promised a
       * voice that was not there. The header's sound control is a different thing and stays: that
       * one is the app's own timer cues.
       */}
      <PlayerFooter>
        {step ? (
          <StepView
            key={`${stepIndex}:${restartNonce}`}
            step={step}
            index={stepIndex}
            session={session}
            paused={paused}
            beep={sound.beep}
            onRecord={recordResult}
            onNext={next}
            onGoTo={goTo}
            registerNext={registerNext}
          />
        ) : null}
        {nextTitle ? (
          <p className="mt-4 truncate text-center text-[13px] text-paper/70">
            <span className="control-label text-[10px] text-paper/50">
              {t('app.playerNextLabel')}
            </span>{' '}
            {nextTitle}
          </p>
        ) : null}
        <div className="mt-4">
          <Controls paused={paused} onTogglePause={togglePause} />
        </div>
        <ScrollCue label={t('app.playerMoreBelow')} />
      </PlayerFooter>
      {paused && step?.kind !== 'done' ? (
        <PausedOverlay
          onResume={togglePause}
          actions={[
            ...(stepIndex > 0
              ? [
                  {
                    label: t('app.playerPrevStep'),
                    onClick: () => {
                      setPaused(false);
                      doPrev();
                    },
                  },
                ]
              : []),
            {
              label: t('app.playerRestartStep'),
              onClick: () => {
                setPaused(false);
                restartStep();
              },
            },
            {
              label: t('app.playerSkipStep'),
              onClick: () => {
                setPaused(false);
                skipStep();
              },
            },
            { label: t('app.playerEndWorkout'), danger: true, onClick: () => setEndOpen(true) },
          ]}
        />
      ) : null}

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t('app.playerLeaveTitle')}
        description={t('app.playerLeaveBody')}
        confirmLabel={t('app.playerLeaveConfirm')}
        cancelLabel={t('app.playerStay')}
        onConfirm={leave}
      />
      <Modal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title={t('app.playerEndTitle')}
        description={t('app.playerEndBody')}
        confirmLabel={t('app.playerEndConfirm')}
        cancelLabel={t('app.playerStay')}
        onConfirm={endWorkout}
        danger
      />
    </main>
  );
}

export default function PlayerScreen() {
  const session = useActiveWorkoutStore((s) => s.session);
  const steps = useActiveWorkoutStore((s) => s.steps);
  const stepIndex = useActiveWorkoutStore((s) => s.stepIndex);
  const paused = useActiveWorkoutStore((s) => s.paused);
  const elapsedSec = useActiveWorkoutStore((s) => s.elapsedSec);
  const finishedAt = useActiveWorkoutStore((s) => s.finishedAt);

  if (!session) return <NoSession />;
  if (finishedAt) return <Navigate to={`/summary/${session.sessionId}`} replace />;
  return (
    <Player
      session={session}
      steps={steps}
      stepIndex={stepIndex}
      paused={paused}
      elapsedSec={elapsedSec}
    />
  );
}
