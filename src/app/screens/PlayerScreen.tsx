/**
 * Workout player (docs/SPEC.md §10 flow 6) at /play.
 *
 * The player is **one card**, the size of the screen, and it has two sides.
 *
 * Its front is the coach's clip — one full viewport of it, playing by itself the moment the step
 * arrives, or the drawn figure where a movement has no footage. Over it: a way out and a way to
 * stop at the top, and at the bottom the movement's name and the one number that matters, «10
 * повторов» or a countdown. Nothing else is on it. No elapsed clock, no sound control, no step
 * counter, no preview of the next movement — an athlete mid-set should not have to read anything
 * they did not come here to read.
 *
 * Its back is every word the coach wrote: how the movement goes, what he keeps correcting, who
 * should not do it. You get there by turning the card over — a swipe up, or the handle under the
 * transport — and never by scrolling, because scrolling a video is how text ends up half on top of
 * the demonstration.
 *
 * State lives in `useActiveWorkoutStore` (persisted), so leaving keeps the session resumable.
 * Keyboard: Space = pause, → next, ← previous, Esc = turn the card back over.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate } from 'react-router';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/app/components/TopBar';
import { CardBack } from '@/app/features/player/CardBack';
import { FlipCard } from '@/app/features/player/FlipCard';
import {
  FlipHandle,
  PausedOverlay,
  PlayerFooter,
  PlayerHeader,
  SectionStepper,
} from '@/app/features/player/PlayerChrome';
import {
  findBlock,
  isTestBlock,
  sectionOfStep,
  skippedResult,
  stepAnimation,
  stepTitle,
  stepVideoRef,
  workoutSections,
} from '@/app/features/player/model';
import { useSound } from '@/app/features/player/sound';
import { AmrapStep } from '@/app/features/player/steps/AmrapStep';
import { BlockIntroStep } from '@/app/features/player/steps/BlockIntroStep';
import { FortimeStep } from '@/app/features/player/steps/FortimeStep';
import { RestStep } from '@/app/features/player/steps/RestStep';
import { TestStep } from '@/app/features/player/steps/TestStep';
import { WorkRepsStep } from '@/app/features/player/steps/WorkRepsStep';
import { WorkTimerStep } from '@/app/features/player/steps/WorkTimerStep';
import { haptic, setClosingConfirmation } from '@/lib/telegram/webapp';
import { warmupSkipIndex } from '@/lib/training/player';
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
 * The demonstration: video where the movement was filmed, the drawn figure where it was not.
 *
 * **It is contained, never cropped.** It used to fill the card with `object-cover`, and on a real
 * clip that was the whole feature defeating itself: the coach films in landscape, in a garden, and
 * a landscape frame cropped to a phone-shaped hole keeps a vertical strip through the middle — the
 * squat happens off-screen and the video is worth nothing. Whatever the clip's shape, all of it is
 * on screen now, with the app's own ground either side of it.
 *
 * **It ends above the glass.** The panel at the bottom reports its height and the clip is given the
 * room above it, so the movement is never half under the words. The clip still runs a little way
 * behind the glass — that is what gives the glass something to be glass over.
 *
 * It starts by itself the moment the step changes — that is what `key={videoUrl}` and the effect
 * below are for — because the athlete arriving at a movement wants to see it, not press play on
 * it. Either way it is a silent loop: the clips are encoded with no audio track at all
 * (scripts/media/prepare-videos.mjs), so there is nothing to mute. `muted` is still set on the
 * element — without it a browser refuses to autoplay, audio track or no.
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
      {/*
       * The stage: everything above the glass, less a finger's width that slips under it.
       *
       * The panel's measured height is what this is subtracted by, so a step with a stepper and a
       * button leaves the clip correspondingly less room and the movement still ends above the
       * words. The 40px of overlap does two things at once: it puts real picture behind the top of
       * the panel, which is the only thing that makes frosted glass read as glass, and — because a
       * portrait clip is fitted by height here — it widens the frame by the same token, closing the
       * thin bars at the sides almost completely.
       */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ bottom: 'max(0px, calc(var(--player-glass-h, 0px) - 40px))' }}
      >
        {videoUrl ? (
          <video
            key={videoUrl}
            ref={video}
            src={videoUrl}
            className="size-full object-contain"
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
  registerNext,
}: StepViewProps) {
  const prescribed = session.prescribed;
  switch (step.kind) {
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
}

function Player({ session, steps, stepIndex, paused }: PlayerProps) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const sound = useSound();
  const next = useActiveWorkoutStore((s) => s.next);
  const prev = useActiveWorkoutStore((s) => s.prev);
  const goTo = useActiveWorkoutStore((s) => s.goTo);
  const recordResult = useActiveWorkoutStore((s) => s.recordResult);
  const setPaused = useActiveWorkoutStore((s) => s.setPaused);
  const tick = useActiveWorkoutStore((s) => s.tick);
  const restartStep = useActiveWorkoutStore((s) => s.restartStep);
  const stepStartedMs = useActiveWorkoutStore((s) => s.stepStartedMs);
  const finish = useActiveWorkoutStore((s) => s.finish);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  // How tall the glass panel is right now; the clip is sized against it. See ArtLayer.
  const [glassHeight, setGlassHeight] = useState(0);
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
  const videoUrl = useMediaUrl(stepVideoRef(step, locale));

  /*
   * Arriving at a new movement always shows the movement. Someone who turned the card over to read
   * the technique of the last exercise did not ask to start the next one facing away from it.
   */
  useEffect(() => {
    setFlipped(false);
  }, [stepIndex]);

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

  /*
   * The store still derives an elapsed time from timestamps — the summary reports it — and this
   * only asks it to re-derive. It is no longer drawn anywhere on the card.
   */
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
      if (e.key === 'Escape') {
        setFlipped(false);
        return;
      }
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

  /*
   * «Пропустить разминку», offered for as long as the athlete is still inside it.
   *
   * The session no longer asks "shall we warm up?" before it starts — it just starts warming up —
   * so the way out of the warm-up has to be available the whole way through it rather than once,
   * at a gate, before anyone has seen what the warm-up is.
   */
  const skipWarmupTo = warmupSkipIndex(steps, prescribed);
  const inWarmup =
    skipWarmupTo !== null && stepIndex < skipWarmupTo && step?.kind !== 'done'
      ? skipWarmupTo
      : null;

  return (
    // The player is the only route that does not go through <Screen>, so it carries the app's
    // <main> landmark itself. Fixed and clipped: the card is exactly the viewport, and the page
    // behind it does not scroll — turning the card over is the only way off the front.
    <main className="fixed inset-0 overflow-hidden bg-bg" style={courseVars}>
      <FlipCard
        flipped={flipped}
        onFlip={setFlipped}
        front={
          <div
            className="relative size-full overflow-hidden"
            style={{ '--player-glass-h': `${glassHeight}px` } as CSSProperties}
            onPointerDownCapture={unlock}
          >
            <ArtLayer animation={animation} playing={!paused} videoUrl={videoUrl} />
            <PlayerHeader
              progress={steps.length > 1 ? stepIndex / (steps.length - 1) : 0}
              paused={paused}
              onBack={() => setLeaveOpen(true)}
              onTogglePause={togglePause}
            />
            <PlayerFooter onHeight={setGlassHeight}>
              {step ? (
                <StepView
                  /*
                   * Keyed on when the step began, not on an index alone: restarting a step is the
                   * store moving that instant, and the component has to come back with it so a
                   * half-dialled rep count goes too.
                   */
                  key={`${stepIndex}:${stepStartedMs}`}
                  step={step}
                  index={stepIndex}
                  session={session}
                  paused={paused}
                  beep={sound.beep}
                  onRecord={recordResult}
                  onNext={next}
                  registerNext={registerNext}
                />
              ) : null}
              {step && step.kind !== 'done' ? (
                <FlipHandle onFlip={() => setFlipped(true)} label={t('app.playerHowTo')} />
              ) : null}
            </PlayerFooter>
          </div>
        }
        back={
          <div className="flex size-full flex-col bg-surface text-text">
            <header className="flex items-center gap-2 border-b border-border px-3 pt-[var(--safe-top)]">
              <div className="flex h-14 min-w-0 flex-1 items-center">
                <span className="font-display truncate text-[17px]">
                  {step ? stepTitle(t, locale, step, prescribed) : ''}
                </span>
              </div>
              <IconButton
                label={t('app.playerBackToVideo')}
                icon="close"
                onClick={() => setFlipped(false)}
              />
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-5 pt-5 pb-[calc(var(--safe-bottom)+32px+var(--demo-inset,0px))]">
                {step ? (
                  <SectionStepper
                    sections={workoutSections(prescribed)}
                    current={sectionOfStep(step, prescribed)}
                  />
                ) : null}
                {step ? <CardBack step={step} prescribed={prescribed} /> : null}
              </div>
            </div>
          </div>
        }
      />

      {paused && step?.kind !== 'done' ? (
        <PausedOverlay
          onResume={togglePause}
          actions={[
            ...(inWarmup !== null
              ? [
                  {
                    label: t('app.playerSkipWarmup'),
                    onClick: () => {
                      setPaused(false);
                      goTo(inWarmup);
                    },
                  },
                ]
              : []),
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
  const finishedAt = useActiveWorkoutStore((s) => s.finishedAt);

  if (!session) return <NoSession />;
  if (finishedAt) return <Navigate to={`/summary/${session.sessionId}`} replace />;
  return <Player session={session} steps={steps} stepIndex={stepIndex} paused={paused} />;
}
