/**
 * Workout player (docs/SPEC.md §10 flow 6) at /play.
 *
 * The player is **one card**, the size of the screen, and it has two sides.
 *
 * Its front is the coach's clip — one full viewport of it, playing by itself the moment the step
 * arrives. Over it: a way out and a way to
 * stop at the top, and at the bottom the movement's name and the one number that matters, «10
 * повторов» or a countdown. Nothing else is on it. No elapsed clock, no sound control, no step
 * counter, no preview of the next movement — an athlete mid-set should not have to read anything
 * they did not come here to read.
 *
 * Its back is every word the coach wrote: how the movement goes, what he keeps correcting, who
 * should not do it. You get there by turning the card over — a swipe from right to left, or the
 * handle under the transport — and never by scrolling, because scrolling a video is how text ends
 * up half on top of the demonstration. Up and down walk the workout instead, the way a feed of
 * short video does; see {@link FlipCard} for why the two axes are that way round.
 *
 * State lives in `useActiveWorkoutStore` (persisted), so leaving keeps the session resumable.
 * Keyboard: Space = pause, → next, ← previous, Esc = turn the card back over.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/app/components/TopBar';
import { CardBack } from '@/app/features/player/CardBack';
import { FlipCard } from '@/app/features/player/FlipCard';
import {
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
  stepExerciseId,
  stepTitle,
  stepVideoRef,
  workoutSections,
} from '@/app/features/player/model';
import { useSound, type Cue } from '@/app/features/player/sound';
import { AmrapStep } from '@/app/features/player/steps/AmrapStep';
import { BlockIntroStep } from '@/app/features/player/steps/BlockIntroStep';
import { FortimeStep } from '@/app/features/player/steps/FortimeStep';
import { RestStep } from '@/app/features/player/steps/RestStep';
import { TestStep } from '@/app/features/player/steps/TestStep';
import { WorkRepsStep } from '@/app/features/player/steps/WorkRepsStep';
import { WorkTimerStep } from '@/app/features/player/steps/WorkTimerStep';
import { haptic, setClosingConfirmation } from '@/lib/telegram/webapp';
import { warmupSkipIndex } from '@/lib/training/player';
import { SkipRow } from '@/app/features/player/SkipRow';
import { TapToPause } from '@/app/features/player/TapToPause';
import { exerciseStillUrl } from '@/lib/api/storage';
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

const ELAPSED_TICK_MS = 500;

function NoSession() {
  const { t } = useT();
  const navigate = useNavigate();
  return (
    <Screen header={<TopBar back="/" title={t('app.playerNoSessionTitle')} />}>
      <EmptyState
        title={t('app.playerNoSessionTitle')}
        description={t('app.playerNoSessionBody')}
        action={<Button onClick={() => navigate('/courses')}>{t('app.tabPrograms')}</Button>}
      />
    </Screen>
  );
}

interface ArtLayerProps {
  exerciseId: string | undefined;
  playing: boolean;
  videoUrl: string | undefined;
}

/**
 * The demonstration: the coach's own clip of the movement.
 *
 * A still from that same clip is the poster, so the frame the athlete arrives on is the movement
 * rather than a black rectangle while the signed URL is fetched — and it is the whole picture for
 * a movement whose clip has not been uploaded yet. Nothing is drawn: a diagram of a movement we
 * film is a worse picture of it, and a diagram of one we do not film is a promise we cannot keep.
 *
 * **The fit is decided per clip, from the clip's own shape, and the clip always fills the width.**
 * This is the third answer to the same question and the first one true for both kinds of footage
 * the coach shoots.
 *
 * `object-cover` was tried once as a blanket rule and reverted, for a reason worth keeping written
 * down: he films some movements in landscape, in a garden, and a landscape frame cropped to a
 * phone-shaped hole keeps a vertical strip through the middle — the squat happens off-screen and
 * the video is worth nothing. The replacement, `w-full h-auto max-h-full object-contain`, was
 * documented here as «as wide as the screen … no bar at the sides in the ordinary case». It was
 * not: `max-h-full` wins whenever the clip is taller than the stage, and the owner sent a
 * screenshot of a portrait squat painted 239px wide between two 76px bars of black.
 *
 * Both rules were right about their own footage and wrong about the other's, because one
 * **The clip is as wide as the screen, always, and that is geometry rather than a decision.**
 * `w-full h-auto` sets the width to the stage's and lets the height follow the clip's own shape;
 * the stage hides what runs past it. A clip taller than the stage is therefore cropped evenly top
 * and bottom — the same result `object-cover` gives — and a shorter one sits centred with space
 * above and below. Neither case can put a bar down the side, because nothing is ever fitted by
 * height.
 *
 * It used to read the clip's `videoWidth`/`videoHeight` on `loadedmetadata` and choose `cover` or
 * `contain` from the two shapes. The arithmetic was right and the reading was not: the owner's
 * phone showed «ЗАМИНКА И РАСТЯЖКА» with 37pt of black down both sides. Measuring her screenshot
 * gave the reason — the stage was 402×740 and the clip was drawn 329×740, fitted by height, which
 * is what `contain` does when the decision never arrived. The coach's clips are about 9:20 (0.44),
 * taller than the 9:16 the sizing below was written for, so every one of them depended on that
 * decision landing. It only has to fail once — a metadata event that fired before the listener,
 * a stage measured while the panel below still reported zero height — and the fallback is the
 * bars. Geometry has no such moment.
 *
 * From `md` the stage is wider than it is tall and the same rule would crop half a movement away
 * to fill a width nobody was short of, so there the clip is contained instead — `md:h-full
 * md:w-auto`, letterboxed, which a laptop has the room for.
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
/**
 * How a movement is drawn, clip or still, in one string.
 *
 * Phone: `w-full h-auto` — the width is the stage's, the height follows the frame's own shape, and
 * the stage crops whatever runs past. Laptop (`md`, where the stage is wider than it is tall):
 * `h-full w-auto`, contained, because filling that width would crop half the movement away.
 *
 * Both halves are pure CSS. Nothing here reads the clip's dimensions, so there is no moment at
 * which the answer can be missing — which is the bug this replaced.
 */
const ART = 'w-full h-auto md:h-full md:w-auto md:max-h-full md:max-w-full object-contain';

function ArtLayer({ exerciseId, playing, videoUrl }: ArtLayerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const still = exerciseId ? exerciseStillUrl(exerciseId) : undefined;
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
       * The stage: everything above the glass, less a good deal that slips under it.
       *
       * The panel's measured height is what this is subtracted by, so a step with a stepper and a
       * button leaves the clip correspondingly less room.
       *
       * The overlap is 120px, and that number is the fix for the black bars. A 9:16 clip in a
       * 390px-wide stage wants to be 693px tall. At the old 40px the stage was 424px, so `contain`
       * fitted it by height and painted 239px of picture between two 76px bars — the screenshot
       * that started this. At 120px the stage is about 700px and the same `contain` fits by width
       * instead: 390 across, no bars, nothing cropped.
       *
       * Filling that width by cropping was the other way to do it and it costs too much: `cover`
       * in a 424px stage throws away 39% of the frame's height, which on a standing movement is
       * the head and the feet. Better to let the foot of the clip run behind the glass, where the
       * panel is at its sheerest, than to cut it off. The overlap also puts real picture behind
       * the panel, which is the only thing that makes frosted glass read as glass — it now earns
       * that keep several times over.
       *
       * `TapToPause` keeps the old 40px deliberately: it decides what counts as tapping the
       * picture, and the part of the picture behind the panel belongs to the panel's buttons.
       */}
      <div
        /*
         * Centred, because a clip that is only as tall as its own shape no longer fills the stage
         * on its own — the leftover room is split above and below it rather than left at the foot.
         *
         * From `md` the panel is a column on the right (`PlayerFooter`), so the stage gives up
         * width instead of height: `right` is the panel's 380px less the same 40px of overlap that
         * puts real picture behind the glass, and the measured height stops applying.
         */
        /*
         * The bottom inset is a class, not an inline style. It used to be inline, and inline wins
         * over a utility for the same property — so `md:bottom-0` could never take effect and the
         * stage would have kept reserving room for a panel that is no longer underneath it.
         */
        /*
         * `overflow-hidden` on the stage itself, not only on the layer around it. The clip is now
         * as wide as the stage and as tall as its own shape asks, so a 9:20 clip is taller than
         * the stage and has to be cropped by something. The layer outside runs the whole screen,
         * so clipping there would let the frame bleed up over the header.
         */
        ref={stage}
        className="absolute inset-x-0 top-0 bottom-[max(0px,calc(var(--player-glass-h,0px)-120px))] flex items-center overflow-hidden md:right-85 md:bottom-0"
      >
        {/*
         * `player-art-in` is the arrival: the next movement's picture settles in over 0.42s rather
         * than replacing the last one on the spot, keyed on the source so every step replays it.
         *
         * `ART` is the one rule both the clip and the still obey — full width on a phone, contained
         * on a laptop. See the note at the top of this file for why it is geometry and not a
         * measurement.
         */}
        {videoUrl ? (
          <video
            key={videoUrl}
            ref={video}
            src={videoUrl}
            poster={still}
            className={`player-art-in ${ART}`}
            playsInline
            muted
            loop
            autoPlay
            preload="metadata"
          />
        ) : (
          <ExerciseStill
            key={exerciseId}
            exerciseId={exerciseId}
            className={`player-art-in ${ART}`}
            loading="eager"
          />
        )}
      </div>
    </div>
  );
}

interface StepViewProps {
  step: PlayerStep;
  index: number;
  session: ActiveSession;
  paused: boolean;
  beep: (cue: Cue) => void;
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

  const exerciseId = step ? stepExerciseId(step, prescribed) : undefined;
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
   *
   * It is offered twice over: on the panel, in the quiet row with «Как делать» (SkipRow), and in
   * the pause overlay. Neither fades — a control that has quietly gone is the app deciding it
   * knows better than the person who warmed up an hour ago.
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
        /*
         * Up and down on the front are the same thing the → and ← keys already mean: "next" runs
         * the step's own finishing action where it has one — a set of ten is recorded as ten, not
         * abandoned — and only falls back to plain navigation where it does not.
         */
        onSwipeNext={doNext}
        onSwipePrev={doPrev}
        front={
          <div
            className="relative size-full overflow-hidden"
            style={{ '--player-glass-h': `${glassHeight}px` } as CSSProperties}
            onPointerDownCapture={unlock}
          >
            <ArtLayer exerciseId={exerciseId} playing={!paused} videoUrl={videoUrl} />
            {/* The picture is the pause button; the panel below it is not. */}
            {step && step.kind !== 'done' && !paused ? <TapToPause onTap={togglePause} /> : null}
            <PlayerHeader
              progress={steps.length > 1 ? stepIndex / (steps.length - 1) : 0}
              paused={paused}
              onBack={() => setLeaveOpen(true)}
              onTogglePause={togglePause}
            />
            <PlayerFooter onHeight={setGlassHeight}>
              {/*
               * The panel's content arrives with the step rather than replacing it. Keyed exactly
               * as StepView is, so the motion belongs to the step and not to a re-render.
               */}
              {step ? (
                <div key={`anim-${stepIndex}:${stepStartedMs}`} className="player-step-in">
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
                </div>
              ) : null}
              {step && step.kind !== 'done' ? (
                <SkipRow
                  onSkipWarmup={
                    inWarmup !== null
                      ? () => {
                          setPaused(false);
                          goTo(inWarmup);
                        }
                      : null
                  }
                  /*
                   * Every step but the last is skippable, the cool-down included — the owner asked
                   * for that by name. `docs/COACH_RULES.md` says of the cool-down «Never skipped»;
                   * this is her call over his rule, and it is recorded in the PR rather than
                   * quietly resolved here.
                   */
                  onSkipStep={skipStep}
                  onFlip={() => setFlipped(true)}
                />
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
            {/* `data-card-scroll`: FlipCard asks this element whether a downward drag is a pull
                to close or the athlete scrolling back up through the technique. */}
            <div data-card-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-6 pt-5 pb-[calc(var(--safe-bottom)+32px+var(--demo-inset,0px))]">
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
