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
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Navigate, useNavigate } from 'react-router';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/app/components/TopBar';
import { ArtFeed, type FeedSlide } from '@/app/features/player/ArtFeed';
import { CardBack } from '@/app/features/player/CardBack';
import {
  FEED_MS,
  feedDecision,
  feedOffset,
  type FeedMove,
  type SwipeHold,
} from '@/app/features/player/feed';
import { FlipCard } from '@/app/features/player/FlipCard';
import {
  PausedOverlay,
  PlayerFooter,
  PlayerHeader,
  PlayerTimerBand,
  SectionStepper,
} from '@/app/features/player/PlayerChrome';
import {
  boardItems,
  exerciseName,
  findBlock,
  findExercise,
  firstFilmedIndex,
  isTestBlock,
  sectionOfStep,
  sessionAudioRefs,
  sessionVideoRefs,
  skippedResult,
  stepArtExerciseId,
  stepFitSec,
  stepTitle,
  stepVideoRef,
  stepVoiceRef,
  workoutSections,
} from '@/app/features/player/model';
import { useSound, type Cue } from '@/app/features/player/sound';
import { playVoice, prefetchVoice, stopVoice } from '@/app/features/player/voice';
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
import { signMediaUrls } from '@/lib/api/storage';
import { courseTileVars } from '@/lib/ui/tile';
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
        action={<Button onClick={() => navigate('/')}>{t('app.tabCourses')}</Button>}
      />
    </Screen>
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
  /** The board row whose clip is playing, and how a tap on a row picks another. */
  clip: number | undefined;
  onClip: (index: number) => void;
  holdSwipe: (hold: SwipeHold | null) => void;
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
  clip,
  onClip,
  holdSwipe,
}: StepViewProps) {
  const prescribed = session.prescribed;
  switch (step.kind) {
    case 'block_intro':
      return <BlockIntroStep step={step} prescribed={prescribed} onNext={onNext} />;
    case 'work': {
      const block = findBlock(prescribed, step.blockId);
      const format = block?.format ?? 'sets';
      const shared = { step, index, onRecord, onNext, registerNext };
      if (isTestBlock(block)) {
        return <TestStep {...shared} paused={paused} beep={beep} holdSwipe={holdSwipe} />;
      }
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
          clip={clip}
          onClip={onClip}
          holdSwipe={holdSwipe}
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
          clip={clip}
          onClip={onClip}
          holdSwipe={holdSwipe}
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
  // How tall the glass panel is right now; the clip is sized against it. See ArtFeed.
  const [glassHeight, setGlassHeight] = useState(0);
  // And how tall the clock's band is — zero on a step that has no clock, which is most of them.
  const [timerHeight, setTimerHeight] = useState(0);
  // Стабильная ссылка: `useSound()` отдаёт новый объект каждый рендер, а эффекты ниже зависят от
  // сигнала и перезапускались бы на каждом тике часов.
  const beep = sound.beep;
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

  /*
   * Sign every clip and every spoken name of the session in one request, before the first slide
   * asks for its own.
   *
   * A layout effect on purpose: those run before any passive effect in the tree, so the first
   * clip's `useMediaUrl` finds the batch already in flight and waits for it rather than signing
   * the same clip alone a moment earlier. Every step after the first then has its URL at hand.
   * The names are then fetched and decoded straight away (`prefetchVoice` waits on the same
   * batch), so the first movement's name is ready by the time its step arrives.
   */
  useLayoutEffect(() => {
    const audioRefs = sessionAudioRefs(prescribed, locale);
    void signMediaUrls([...sessionVideoRefs(prescribed, locale), ...audioRefs]);
    void prefetchVoice(audioRefs);
  }, [prescribed, locale]);

  /*
   * The movement's name, spoken as its step begins — once per beginning. Keyed on when the step
   * started rather than its index alone, so a restarted step and a repeated set of the same
   * movement are each announced again, and a re-render is not. A step that arrives paused (a
   * session resumed after a reload) is announced when it is resumed instead; pausing cuts the
   * voice and resuming does not pick it back up — see `voice.ts`.
   */
  const spoken = useRef<string | null>(null);
  useEffect(() => {
    if (!step || paused) return;
    const key = `${stepIndex}:${stepStartedMs}`;
    if (spoken.current === key) return;
    spoken.current = key;
    playVoice(stepVoiceRef(step, locale));
  }, [step, stepIndex, stepStartedMs, paused, locale]);
  useEffect(() => {
    if (paused) stopVoice();
  }, [paused]);
  useEffect(() => () => stopVoice(), []);

  /*
   * Which movement of a board (AMRAP, for time, a block's title card) is playing: a tap on a row
   * of the list picks it. Remembered with the step it belongs to, so it is gone on the next one.
   */
  const [clipPick, setClipPick] = useState<{ step: number; item: number } | null>(null);
  const pick = clipPick?.step === stepIndex ? clipPick.item : undefined;
  const board = boardItems(step, prescribed);
  const clip = board.length > 0 ? (pick ?? firstFilmedIndex(board, locale)) : undefined;
  const onClip = useCallback((item: number) => setClipPick({ step: stepIndex, item }), [stepIndex]);

  // Directions the step on screen holds shut (a running AMRAP holds both). See `SwipeHold`.
  const [hold, setHold] = useState<SwipeHold | null>(null);

  /*
   * --- the feed --------------------------------------------------------------------------------
   *
   * `feed.y` is where the track of slides is, in px from rest; `animate` says whether getting
   * there is a snap (a transition) or a finger (immediate). `moving` is a snap on its way out that
   * will turn the page when it lands. `fromGesture` tells the index change that follows that the
   * picture is already in place, so it must not be slid in a second time.
   */
  const [feed, setFeed] = useState({ y: 0, animate: false });
  const [dragging, setDragging] = useState(false);
  // A released drag on its way to turning the page: the old step's words stay dimmed until it does.
  const [leaving, setLeaving] = useState(false);
  const moving = useRef<FeedMove | null>(null);
  const fromGesture = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const track = useRef<HTMLDivElement>(null);
  // Which way the last change of step went: the panel's content arrives from that side.
  const [dir, setDir] = useState<1 | -1>(1);
  const shownIndex = useRef(stepIndex);

  const feedHeight = () => track.current?.clientHeight || window.innerHeight || 1;
  const reducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const allowed = {
    next: !!step && step.kind !== 'done' && !hold?.next && !overlayOpen,
    prev: stepIndex > 0 && !hold?.prev && !overlayOpen,
  };

  /*
   * Arriving at a new movement always shows the movement — someone who turned the card over to
   * read the last exercise's technique did not ask to start the next one facing away from it —
   * and slides it in from the side it is coming from.
   *
   * After a swipe the picture is already there: the snap carried it, and all that is left is to
   * put the track back to rest now that the slides have moved up one place under it. After a
   * button, a key or a clock running out, it slides in the same 280ms a swipe would have taken.
   * A jump of more than one step (skipping the warm-up) and reduced motion just cut.
   */
  useLayoutEffect(() => {
    const d = stepIndex - shownIndex.current;
    shownIndex.current = stepIndex;
    if (d === 0) return;
    setFlipped(false);
    setHold(null);
    setDir(d > 0 ? 1 : -1);
    // The step changed some other way while a swipe was still landing: that swipe is spent.
    if (moving.current) {
      moving.current = null;
      window.clearTimeout(settleTimer.current);
      setLeaving(false);
    }
    const glide = !fromGesture.current && Math.abs(d) === 1 && !reducedMotion();
    fromGesture.current = false;
    if (!glide) {
      setFeed({ y: 0, animate: false });
      return;
    }
    setFeed({ y: d * feedHeight(), animate: false });
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setFeed({ y: 0, animate: true }));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [stepIndex]);

  /*
   * Переход к следующему упражнению — и его звук, один на все дороги сюда.
   *
   * Сюда приходят все: вышло время на холде, нажали «Готово» после десяти повторов, свайпнули,
   * пропустили шаг, нажали → на клавиатуре. Раньше звучали только те переходы, у которых был
   * таймер, — то есть человек, делающий подход за подходом, не слышал вообще ничего и узнавал о
   * смене упражнения только глазами, в тот момент, когда глаза заняты полом.
   *
   * Последний шаг — `done`, и он не упражнение: перед ним звучит не «дальше», а конец тренировки
   * (эффект ниже). Иначе два сигнала подряд, и оба про одно.
   */
  const advance = useCallback(() => {
    if (steps[stepIndex + 1]?.kind !== 'done') beep('next');
    next();
  }, [steps, stepIndex, beep, next]);

  /*
   * The last step is `done`: close the session and hand over to the summary.
   *
   * Здесь же — единственный за тренировку звук, которому позволено быть длинным. Он играет до
   * `navigate`, а не на экране итогов: на итоги можно прийти по ссылке через неделю, а «сделал»
   * бывает один раз, ровно в эту секунду.
   */
  useEffect(() => {
    if (step?.kind !== 'done') return;
    stopVoice();
    haptic('success');
    beep('finish');
    finish();
    navigate(summaryPath, { replace: true });
  }, [step?.kind, beep, finish, navigate, summaryPath]);

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
    (nextHandler.current ?? advance)();
  }, [advance, unlock]);
  const doPrev = useCallback(() => {
    unlock();
    prev();
  }, [prev, unlock]);
  /** The snap has landed: turn the page it was carrying, or simply come to rest. */
  const settle = useCallback(() => {
    window.clearTimeout(settleTimer.current);
    const move = moving.current;
    moving.current = null;
    setLeaving(false);
    if (!move) {
      setFeed((f) => (f.animate ? { ...f, animate: false } : f));
      return;
    }
    const before = useActiveWorkoutStore.getState().stepIndex;
    fromGesture.current = true;
    if (move === 'next') doNext();
    else doPrev();
    if (useActiveWorkoutStore.getState().stepIndex === before) {
      // The step's own «next» did something other than move on: bring the picture back.
      fromGesture.current = false;
      setFeed({ y: 0, animate: !reducedMotion() });
    }
  }, [doNext, doPrev]);

  const onDragY = (dy: number) => {
    if (moving.current) return;
    setDragging(true);
    setFeed({ y: feedOffset(dy, feedHeight(), allowed), animate: false });
  };

  const onReleaseY = (dy: number, velocity: number) => {
    if (moving.current) return;
    setDragging(false);
    const h = feedHeight();
    const move = feedDecision(dy, velocity, h, allowed);
    const instant = reducedMotion();
    if (!move) {
      if (dy !== 0 && ((dy < 0 && !allowed.next) || (dy > 0 && !allowed.prev))) haptic('light');
      setFeed({ y: 0, animate: !instant && dy !== 0 });
      return;
    }
    moving.current = move;
    if (instant) {
      settle();
      return;
    }
    setLeaving(true);
    setFeed({ y: move === 'next' ? -h : h, animate: true });
    // `transitionend` can go missing (a backgrounded tab, a zero-length move): never strand it.
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settle, FEED_MS + 120);
  };

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

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
    advance();
  };

  const endWorkout = () => {
    setEndOpen(false);
    stopVoice();
    finish();
    navigate(summaryPath, { replace: true });
  };
  const leave = () => {
    setLeaveOpen(false);
    stopVoice();
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

  /*
   * The slides on the track: the step before, this one and the next. The closing `done` step is
   * not a movement and has no slide — swiping up from the last movement shows the ground before
   * the summary takes over.
   *
   * Each slide carries its clip's mode and its own step's length, the neighbours included: they
   * are only preloading, but a swipe makes one of them current without remounting it, so the rate
   * it was given has to be the right one for the step it lands on.
   */
  const slides: (FeedSlide & { offset: number })[] = [];
  for (let i = stepIndex - 1; i <= stepIndex + 1; i++) {
    const s = steps[i];
    if (!s || s.kind === 'done') continue;
    const item = i === stepIndex ? pick : undefined;
    const exerciseId = stepArtExerciseId(s, prescribed, locale, item);
    slides.push({
      index: i,
      offset: i - stepIndex,
      exerciseId,
      videoRef: stepVideoRef(s, locale, prescribed, item),
      name: exerciseId ? exerciseName(exerciseId, locale) : stepTitle(t, locale, s, prescribed),
      videoMode: exerciseId ? findExercise(exerciseId)?.videoMode : undefined,
      stepSec: stepFitSec(s),
    });
  }
  const panelOpacity = leaving
    ? 0.35
    : dragging
      ? Math.max(0.35, 1 - (1.5 * Math.abs(feed.y)) / feedHeight())
      : 1;

  return (
    // The player is the only route that does not go through <Screen>, so it carries the app's
    // <main> landmark itself. Fixed and clipped: the card is exactly the viewport, and the page
    // behind it does not scroll — turning the card over is the only way off the front.
    <main className="fixed inset-0 overflow-hidden bg-bg" style={courseVars}>
      <FlipCard
        flipped={flipped}
        onFlip={setFlipped}
        /*
         * Up and down on the front drag the feed, and a drag that turns the page means the same
         * thing the → and ← keys already mean: "next" runs the step's own finishing action where
         * it has one — a set of ten is recorded as ten, not abandoned — and only falls back to
         * plain navigation where it does not.
         */
        onDragY={onDragY}
        onReleaseY={onReleaseY}
        front={
          <div
            className="relative size-full overflow-hidden"
            style={
              {
                '--player-glass-h': `${glassHeight}px`,
                '--player-top-h': `${timerHeight}px`,
              } as CSSProperties
            }
            onPointerDownCapture={unlock}
          >
            <PlayerTimerBand onHeight={setTimerHeight}>
              <ArtFeed
                slides={slides}
                playing={!paused}
                y={feed.y}
                animate={feed.animate}
                onSettled={settle}
                trackRef={track}
              />
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
                {/*
                 * While a finger drags the page away, what is written on it goes with it — dimmed
                 * rather than moved, because the glass stays where it is.
                 */}
                {step ? (
                  <div
                    className={clsx('player-feed-panel', dragging && 'is-dragging')}
                    style={{ opacity: panelOpacity }}
                  >
                    <div
                      key={`anim-${stepIndex}:${stepStartedMs}`}
                      className="player-step-in"
                      style={{ '--step-from': `${dir * 24}px` } as CSSProperties}
                    >
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
                        onNext={advance}
                        registerNext={registerNext}
                        clip={clip}
                        onClip={onClip}
                        holdSwipe={setHold}
                      />
                    </div>
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
            </PlayerTimerBand>
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
