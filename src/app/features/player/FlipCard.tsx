/**
 * The player is one card, and it has two sides.
 *
 * The front is the coach's clip with the movement's numbers on it. The back is everything that is
 * words. They are not a page you scroll through — scrolling down a video is how the text ends up
 * half over the demonstration — they are two faces of the same object, and getting from one to the
 * other is a turn: swipe up, or use the corner control.
 *
 * Sideways on the front walks the workout: right to left is the next movement, left to right the
 * one before. It is the gesture every photo app has taught everybody, and it is why the two
 * chevrons that used to sit either side of Pause are not missed.
 *
 * The turn is a real rotation rather than a cross-fade because the athlete has to know the clip did
 * not go anywhere. Under `prefers-reduced-motion` it becomes an instant swap, which says the same
 * thing without the movement.
 *
 * Which face is showing is decided by `visibility`, not by `backface-visibility` — see the note on
 * the faces below for why the obvious way does not survive contact with iOS.
 */
import { clsx } from 'clsx';
import { useRef, type ReactNode } from 'react';

/** Travel (px) that counts as a deliberate swipe rather than a tap that wandered. */
const SWIPE_PX = 48;
/** Sideways travel needed to change movement — longer, because it is the costlier mistake. */
const SWIPE_X_PX = 64;

export type Swipe = 'up' | 'down' | 'left' | 'right' | null;

/**
 * Which way a touch went, or null when it did not go far enough to mean anything.
 *
 * The dominant axis wins outright: a drag that is mostly sideways is never a turn and a drag that
 * is mostly up is never a change of movement, so a finger that wobbles cannot do two things at
 * once. Each axis keeps its own threshold.
 */
export function swipeOf(dx: number, dy: number): Swipe {
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) < SWIPE_X_PX) return null;
    return dx < 0 ? 'left' : 'right';
  }
  if (Math.abs(dy) < SWIPE_PX) return null;
  return dy < 0 ? 'up' : 'down';
}

/** Track one touch and report the swipe it turned out to be. */
function useSwipe(onSwipe: (swipe: Exclude<Swipe, null>, target: EventTarget | null) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      start.current = t ? { x: t.clientX, y: t.clientY } : null;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const from = start.current;
      start.current = null;
      const t = e.changedTouches[0];
      if (!from || !t) return;
      const swipe = swipeOf(t.clientX - from.x, t.clientY - from.y);
      if (swipe) onSwipe(swipe, e.target);
    },
  };
}

/**
 * One face of the card. The delay classes are added per face; 250ms is half of `duration-500`
 * below, which is the moment the card is edge-on.
 */
const FACE = clsx(
  'absolute inset-0',
  // `duration-0` so the switch happens exactly on the delay rather than a frame or two after it.
  'transition-[visibility] duration-0 motion-reduce:delay-0',
  '[backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
);

export interface FlipCardProps {
  flipped: boolean;
  onFlip: (flipped: boolean) => void;
  front: ReactNode;
  back: ReactNode;
  /** Swiped right to left on the front: on to the next movement. */
  onSwipeNext?: () => void;
  /** Swiped left to right on the front: back to the one before. */
  onSwipePrev?: () => void;
}

export function FlipCard({
  flipped,
  onFlip,
  front,
  back,
  onSwipeNext,
  onSwipePrev,
}: FlipCardProps) {
  /*
   * The front reads all four directions: up turns the card over, and sideways walks the workout.
   * Down does nothing here — there is nothing above the front to pull down from.
   */
  const frontSwipe = useSwipe((swipe) => {
    if (swipe === 'up') onFlip(true);
    else if (swipe === 'left') onSwipeNext?.();
    else if (swipe === 'right') onSwipePrev?.();
  });

  /*
   * The back reads one: pull down to turn it back over, and only from the top of the text.
   *
   * The gestures used to live on the wrapper both faces share, which meant scrolling *up* through
   * the technique — a finger moving down — read as a pull and flipped the card back to the video
   * mid-sentence. Asking the scroller where it is fixes that without taking the gesture away: at
   * the top there is nothing left to scroll, so a downward drag can only mean "put this away".
   */
  const backSwipe = useSwipe((swipe, target) => {
    if (swipe !== 'down') return;
    const scroller = (target as HTMLElement | null)?.closest('[data-card-scroll]');
    if (scroller && scroller.scrollTop > 0) return;
    onFlip(false);
  });

  return (
    <div className="size-full [perspective:1600px]">
      <div
        className={clsx(
          'relative size-full transition-transform duration-500 ease-(--ease-out)',
          '[transform-style:preserve-3d] [-webkit-transform-style:preserve-3d]',
          'motion-reduce:transition-none',
          flipped && '[transform:rotateY(180deg)]',
        )}
      >
        {/*
         * Both faces are laid on top of each other, and the one turned away is switched off — not
         * merely hidden from behind.
         *
         * `backface-visibility` is what ought to do this, and on iOS it did not: the whole front
         * face showed through the back, mirrored, with the clock and the movement's name reading
         * backwards at the bottom of the technique. WebKit flattens a 3D scene when a descendant
         * establishes its own compositing context, and the front carries a `backdrop-filter` on the
         * glass panel; flattened, the property means nothing and both faces paint.
         *
         * So the far face is genuinely made `visibility: hidden`, on a delay of half the turn — it
         * disappears as the card passes edge-on, where nothing is visible anyway, and comes back
         * with no delay at all so the face turning towards you is never late. The prefixed
         * properties stay for the browsers where they do work: this is belt and braces, not a
         * replacement.
         *
         * `inert` on the far side is belt and braces here too — `visibility: hidden` already takes
         * an element out of the tab order and the accessibility tree — but it costs one attribute
         * and it says the intent out loud.
         */}
        <div
          className={clsx(FACE, flipped ? 'invisible delay-[250ms]' : 'visible delay-0')}
          inert={flipped}
          {...frontSwipe}
        >
          {front}
        </div>
        <div
          className={clsx(
            FACE,
            '[transform:rotateY(180deg)]',
            flipped ? 'visible delay-0' : 'invisible delay-[250ms]',
          )}
          inert={!flipped}
          {...backSwipe}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
