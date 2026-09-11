/**
 * Workout player (docs/SPEC.md §10 flow 6) at /play.
 *
 * Immersive layout: the course's tile as full-bleed art carrying the coach's clip for the exercise
 * on screen — or the animated figure where there is none — behind a top bar, then a dark panel with
 * the step progress row, the current step and the Previous / Pause / Next controls. State lives in
 * `useActiveWorkoutStore` (persisted), so leaving keeps the session resumable.
 * Keyboard: Space = pause, → next, ← previous.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { TopBar } from '@/app/components/TopBar';
import {
  Controls,
  PausedOverlay,
  PlayerHeader,
  ProgressRow,
  SectionStepper,
} from '@/app/features/player/PlayerChrome';
import {
  findBlock,
  isTestBlock,
  sectionOfStep,
  skippedResult,
  stepAnimation,
  stepVideoRef,
  stepTitle,
  workoutSections,
} from '@/app/features/player/model';
import { useSound } from '@/app/features/player/sound';
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

/** The figure's own tile is transparent so the full-bleed course art shows through without a seam. */
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
 * The demonstration, as video when there is one and as the drawn figure when there is not.
 *
 * Either way it is a silent loop behind the timer. The clips are encoded with no audio track at
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

  return (
    <div
      className="hero-art pointer-events-none absolute inset-x-0 top-0 h-[42dvh] overflow-hidden"
      aria-hidden="true"
    >
      {videoUrl ? (
        <>
          <video
            key={videoUrl}
            ref={video}
            src={videoUrl}
            className="h-full w-full object-cover"
            playsInline
            muted
            loop
            autoPlay
            preload="metadata"
          />
          {/* A scrim under the header so its white title reads on a bright frame. */}
          <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-bg/60 to-transparent" />
        </>
      ) : animation ? (
        <div className="mx-auto w-[min(100%,42dvh)]">
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [restartNonce, setRestartNonce] = useState(0);
  const nextHandler = useRef<(() => void) | null>(null);
  const registerNext = useCallback((fn: (() => void) | null) => {
    nextHandler.current = fn;
  }, []);

  const overlayOpen = menuOpen || leaveOpen || endOpen;
  const step = steps[stepIndex];
  const prescribed = session.prescribed;
  const summaryPath = `/summary/${session.sessionId}`;
  // The programme colour for the art, the phase kicker and the progress bar — and the ink to match.
  const courseVars = courseTileVars(findCourse(session.courseId)?.tile);

  const title = step ? stepTitle(t, locale, step, prescribed) : '';
  const animation = step ? stepAnimation(step, prescribed) : undefined;
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
    setMenuOpen(false);
    if (step) {
      const skipped = skippedResult(step, stepIndex);
      if (skipped) recordResult(skipped);
    }
    next();
  };
  const restartStep = () => {
    setMenuOpen(false);
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
    <main
      className="relative flex min-h-dvh flex-col bg-bg"
      style={courseVars}
      onPointerDownCapture={unlock}
    >
      <ArtLayer animation={animation} playing={!paused} videoUrl={videoUrl} />
      <PlayerHeader
        title={title}
        muted={sound.muted}
        overVideo={Boolean(videoUrl)}
        onBack={() => setLeaveOpen(true)}
        onToggleSound={sound.toggle}
        onMenu={() => setMenuOpen(true)}
      />
      {/*
       * There is no unmute button over the video any more. The clips carry no audio track at all
       * now (scripts/media/prepare-videos.mjs), so the button toggled nothing — it just promised
       * a voice that was not there. The header's sound control is a different thing and stays:
       * that one is the app's own timer cues.
       */}
      <div className="h-[calc(42dvh-56px)] shrink-0" aria-hidden="true" />
      {/* The panel meets the art on a straight edge — no rounded shoulder, no shadow. */}
      <section className="relative z-10 flex flex-1 flex-col bg-bg">
        {step ? (
          <SectionStepper
            sections={workoutSections(prescribed)}
            current={sectionOfStep(step, prescribed)}
          />
        ) : null}
        <ProgressRow stepIndex={stepIndex} totalSteps={steps.length} elapsedSec={elapsedSec} />
        <div className="relative flex-1 px-5 pb-6 pt-2">
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
          {paused && step?.kind !== 'done' ? <PausedOverlay onResume={togglePause} /> : null}
        </div>
        <Controls
          paused={paused}
          canPrev={stepIndex > 0}
          onPrev={doPrev}
          onTogglePause={togglePause}
          onNext={doNext}
        />
      </section>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t('app.playerMenu')}>
        {/* Three words on three lines; the rows carry no marks, the danger one is red. */}
        <div className="-mx-4 flex flex-col">
          <ListRow title={t('app.playerSkipStep')} onClick={skipStep} trailing={null} />
          <ListRow title={t('app.playerRestartStep')} onClick={restartStep} trailing={null} />
          <ListRow
            title={<span className="text-danger">{t('app.playerEndWorkout')}</span>}
            onClick={() => {
              setMenuOpen(false);
              setEndOpen(true);
            }}
            trailing={null}
          />
        </div>
      </Sheet>

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
