/**
 * The stories player: a full-screen set of slides with the gestures every stories surface has
 * taught a thumb — tap right to go on, tap left to go back, hold to pause, swipe down or × to
 * leave — and a segmented rule along the top, one segment per slide, the current one filling
 * over `AUTO_MS`.
 *
 * **`fixed inset-0`, and that is why it lives where it lives.** The onboarding and `/intro` both
 * render under `FocusShell`, which applies no transform; a screen inside `AppShell` arrives on a
 * `screen-in-*` transform, a transformed ancestor is a containing block, and a `fixed` panel there
 * measures itself against the screen instead of the viewport (see the `/assessment` route in
 * router.tsx for the same reasoning). Do not mount this inside the tabbed shell.
 *
 * **The rule is the kit's `ProgressBar`, one per slide.** The kit's fill moves in 280ms; here the
 * fill *is* the clock, so a wrapper variant sets its duration from `--story-ms` — the time left on
 * the slide — and a linear ease, and the value flips from 0 to 1 a frame after the slide mounts.
 * A hold freezes it at the fraction elapsed with a zero duration; letting go sets it moving again
 * over what remains. Under `prefers-reduced-motion` nothing moves and nothing advances on its own:
 * the current segment is drawn full, and the set waits for a tap.
 *
 * **Chrome colour follows the slide.** White on the field and on graphite; ink on the club's warm
 * gradient, where white would sink into the beige (`SLIDE_CHROME`).
 *
 * **Taps are pointer events, not clicks.** One layer under the chrome takes the pointer: down
 * pauses, up decides — a swipe down leaves, a short press without travel is a tap and goes where
 * its third says (`tapZone`), anything longer was a hold and does nothing more. The two buttons
 * inside the layer exist for a keyboard and a screen reader: their `onClick` fires only for a
 * keyboard activation (`detail === 0`), so a pointer tap is never counted twice. ← → Esc work
 * from anywhere on the page.
 */
import { clsx } from 'clsx';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { prefersReducedMotion } from '@/lib/ui/motion';
import { useT } from '@/app/hooks/useT';
import { SLIDE_CHROME, SLIDES } from './slides';
import {
  AUTO_MS,
  HOLD_MS,
  nextIndex,
  SWIPE_DOWN_PX,
  tapZone,
  type StoryId,
  type TapZone,
} from './stories';

export interface StoryProps {
  slides: readonly StoryId[];
  /** The set ran to its end: the last slide's button, or a tap forward on it. */
  onDone: () => void;
  /** × or a swipe down: the set is left early. */
  onExit: () => void;
  /** Back from the first slide. When absent the first slide simply stays. */
  onBackOut?: () => void;
  /** The button on the last slide. Without it the last slide advances on a tap like the others. */
  finalLabel?: string;
  /** «04/05» — the wizard's counter, kept in the top row so the set reads as part of its step. */
  stepOfTotal?: string;
}

/** Travel (px) under which a press is still a tap. */
const TAP_SLOP_PX = 12;

interface Fill {
  /** Where the current segment's fill is heading, 0..1. */
  value: number;
  /** How long it takes to get there. 0 jumps. */
  ms: number;
}

export function Story({ slides, onDone, onExit, onBackOut, finalLabel, stepOfTotal }: StoryProps) {
  const { t } = useT();
  const still = useMemo(() => prefersReducedMotion(), []);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<'right' | 'left'>('right');
  const [paused, setPaused] = useState(false);
  const [fill, setFill] = useState<Fill>({ value: still ? 1 : 0, ms: 0 });

  const remaining = useRef(AUTO_MS);
  const startedAt = useRef(0);
  const timer = useRef<number | null>(null);
  const press = useRef<{ x: number; y: number; t: number } | null>(null);
  const hiddenPause = useRef(false);
  const zone = useRef<HTMLDivElement>(null);

  const id = slides[Math.min(index, count - 1)] ?? slides[0]!;
  const Slide = SLIDES[id];
  const ink = SLIDE_CHROME[id] === 'ink';
  const isLast = index === count - 1;

  const go = useCallback(
    (where: TapZone) => {
      const to = nextIndex(index, where, count);
      if (to < 0) {
        onBackOut?.();
        return;
      }
      if (to >= count) {
        onDone();
        return;
      }
      setDir(where === 'back' ? 'left' : 'right');
      setIndex(to);
    },
    [index, count, onBackOut, onDone],
  );

  /* The timeout reads the latest `go` through a ref, so a slide change never leaves a stale one. */
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  }, [go]);

  const stop = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    startedAt.current = performance.now();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      goRef.current('next');
    }, remaining.current);
    setFill({ value: 1, ms: remaining.current });
  }, [stop]);

  /* A new slide: the clock resets, the segment starts empty and begins to fill a frame later. */
  useEffect(() => {
    remaining.current = AUTO_MS;
    setPaused(false);
    if (still) {
      setFill({ value: 1, ms: 0 });
      return;
    }
    setFill({ value: 0, ms: 0 });
    const raf = window.requestAnimationFrame(() => start());
    return () => {
      window.cancelAnimationFrame(raf);
      stop();
    };
  }, [index, still, start, stop]);

  const pause = useCallback(() => {
    if (still || paused) return;
    stop();
    remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current));
    setPaused(true);
    setFill({ value: 1 - remaining.current / AUTO_MS, ms: 0 });
  }, [still, paused, stop]);

  const resume = useCallback(() => {
    if (still || !paused) return;
    setPaused(false);
    start();
  }, [still, paused, start]);

  /* A backgrounded tab does not get to finish the set unseen. */
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (!paused) {
          hiddenPause.current = true;
          pause();
        }
      } else if (hiddenPause.current) {
        hiddenPause.current = false;
        resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [paused, pause, resume]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === 'ArrowRight') go('next');
      else if (e.key === 'ArrowLeft') go('back');
      else if (e.key === 'Escape') onExit();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onExit]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    press.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    // Capture, so the release reaches this layer even when the finger drifted off it.
    e.currentTarget.setPointerCapture(e.pointerId);
    pause();
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    resume();
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (dy > SWIPE_DOWN_PX && dy > Math.abs(dx)) {
      onExit();
      return;
    }
    if (performance.now() - p.t > HOLD_MS || Math.hypot(dx, dy) > TAP_SLOP_PX) return;
    const rect = zone.current?.getBoundingClientRect();
    go(tapZone(e.clientX - (rect?.left ?? 0), rect?.width ?? 0));
  };

  const onPointerCancel = () => {
    press.current = null;
    resume();
  };

  /* Keyboard activation only: a pointer tap is already handled above (`detail` is 0 for keys). */
  const onKeyClick = (where: TapZone) => (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) go(where);
  };

  const style = { '--story-ms': `${fill.ms}ms` } as CSSProperties;

  return (
    <div
      role="group"
      aria-label={t('app.introRow')}
      className="fixed inset-0 z-30 bg-bg text-text select-none"
    >
      {/* The slide, arriving from the side the tap came from; keyed so the entrance replays. */}
      <div
        key={index}
        className={clsx('absolute inset-0', dir === 'right' ? 'screen-in-right' : 'screen-in-left')}
      >
        <Slide />
      </div>

      {/* The tap layer: under the chrome, over the slide. */}
      <div
        ref={zone}
        className="absolute inset-0 touch-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <button
          type="button"
          aria-label={t('app.onbStoryBack')}
          className="absolute inset-y-0 left-0 w-1/3 cursor-default rounded-none bg-transparent focus-visible:outline-none"
          onClick={onKeyClick('back')}
        />
        <button
          type="button"
          aria-label={t('app.onbStoryNext')}
          className="absolute inset-y-0 right-0 w-2/3 cursor-default rounded-none bg-transparent focus-visible:outline-none"
          onClick={onKeyClick('next')}
        />
      </div>

      {/* The top row: the segments, the wizard's counter, the way out. */}
      <div
        className="absolute inset-x-0 top-0 flex items-center gap-3 px-4"
        style={{ ...style, paddingTop: 'calc(var(--safe-top) + 10px)' }}
      >
        <div
          className={clsx(
            'flex flex-1 gap-1.5',
            '[&_[role=progressbar]>div]:duration-(--story-ms) [&_[role=progressbar]>div]:ease-linear',
            ink && '[&_[role=progressbar]]:bg-ink/15 [&_[role=progressbar]>div]:bg-ink',
          )}
        >
          {slides.map((slide, i) => (
            <ProgressBar
              key={slide}
              size="sm"
              ground="field"
              value={i < index ? 1 : i === index ? fill.value : 0}
              label={`${i + 1}/${count}`}
              className="flex-1"
            />
          ))}
        </div>
        {stepOfTotal ? (
          <span
            className={clsx(
              'numeral tabular shrink-0 text-[13px]',
              ink ? 'text-ink' : 'text-on-field/85',
            )}
          >
            {stepOfTotal}
          </span>
        ) : null}
        <IconButton
          label={t('common.close')}
          icon={
            <span className={ink ? 'text-ink' : 'text-on-field'}>
              <Icon name="close" size={16} />
            </span>
          }
          variant="ghost"
          size="sm"
          className="-mr-2.5"
          onClick={onExit}
        />
      </div>

      {/* The last slide's one button. Neon: the set is not a club screen. */}
      {isLast && finalLabel ? (
        <div
          className="absolute inset-x-0 bottom-0 px-6"
          style={{ paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}
        >
          <Button variant="action" size="lg" fullWidth onClick={onDone}>
            {finalLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
