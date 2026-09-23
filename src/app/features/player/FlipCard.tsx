/**
 * The player is one card, and it has two sides.
 *
 * The front is the coach's clip with the movement's numbers on it. The back is everything that is
 * words. They are not a page you scroll through — scrolling down a video is how the text ends up
 * half over the demonstration — they are two faces of the same object.
 *
 * **The axes are the owner's, and they are the ones a feed of short video has taught everybody:**
 * «представь, что все упражнения это лента тик тока, которую листает пользователь».
 *
 *   - **up** — the next movement, **down** — the one before. Vertical is the workout's own axis
 *     now, because that is the axis a person's thumb already walks a column of clips along.
 *   - **right to left** — the words. It arrives from the side, the way a detail panel does
 *     everywhere else, and left to right puts it away again.
 *
 * This is an exchange of the two axes, not an addition: up used to turn the card over and sideways
 * used to walk the workout. Both were defensible and the swap is deliberate, so the thresholds
 * swapped with them — see them below.
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
import { FEED_SLOP_PX, releaseVelocity } from './feed';

/**
 * Travel (px) that counts as a deliberate swipe rather than a tap that wandered.
 *
 * The longer one guards the costlier mistake, and which mistake that is moved with the axes.
 * Changing movement mid-set loses the athlete's place and is now the vertical gesture, so 64px is
 * vertical; opening the words costs a glance and a swipe back, so 48px is sideways. The numbers
 * did not change, they changed sides.
 */
const SWIPE_PX = 48;
/**
 * Vertical travel that counts as a swipe at all. Changing movement is no longer decided here — the
 * front follows a vertical drag and `feedDecision` reads its release, with a share of the screen
 * and a speed rather than one fixed distance — but the back still needs to know that a mostly
 * vertical drag is reading, not a swipe.
 */
const SWIPE_Y_PX = 64;

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
    if (Math.abs(dx) < SWIPE_PX) return null;
    return dx < 0 ? 'left' : 'right';
  }
  if (Math.abs(dy) < SWIPE_Y_PX) return null;
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

/** True when the touch began inside something that scrolls vertically and has room to. */
function inVerticalScroller(target: EventTarget | null, root: Element): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== root) {
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1) {
      const y = getComputedStyle(el).overflowY;
      if (y === 'auto' || y === 'scroll') return true;
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * The front's gesture: a vertical drag that is followed while it happens, and a sideways swipe
 * that is read when it ends.
 *
 * The first {@link FEED_SLOP_PX} of travel choose the axis for the rest of the touch, so a thumb
 * that sets off upwards and drifts sideways keeps dragging the feed rather than turning the card
 * halfway through. Vertical travel is reported on every move (`onDragY`) and once more on release
 * with the speed it left at (`onReleaseY`), and `PlayerScreen` decides — see `feedDecision`.
 *
 * Touch events rather than pointer events: a pointer is cancelled the moment the browser thinks the
 * touch might be a scroll, and on iOS it thinks so about any vertical drag. Nothing on the front
 * scrolls except the panel at its foot when a step is taller than the screen — a touch that starts
 * there, with room to scroll, is left to scroll.
 */
function useFrontGesture({
  onDragY,
  onReleaseY,
  onSwipe,
}: {
  onDragY?: ((dy: number) => void) | undefined;
  onReleaseY?: ((dy: number, velocity: number) => void) | undefined;
  onSwipe: (swipe: Exclude<Swipe, null>) => void;
}) {
  const g = useRef<{
    x: number;
    y: number;
    axis: 'x' | 'y' | null;
    vertical: boolean;
    samples: { y: number; t: number }[];
  } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (!t || e.touches.length > 1) {
        g.current = null;
        return;
      }
      g.current = {
        x: t.clientX,
        y: t.clientY,
        axis: null,
        vertical: !inVerticalScroller(e.target, e.currentTarget),
        samples: [{ y: 0, t: e.timeStamp }],
      };
    },
    onTouchMove: (e: React.TouchEvent) => {
      const s = g.current;
      const t = e.touches[0];
      if (!s || !t) return;
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (s.axis === null) {
        if (Math.hypot(dx, dy) < FEED_SLOP_PX) return;
        s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (s.axis !== 'y' || !s.vertical) return;
      s.samples.push({ y: dy, t: e.timeStamp });
      if (s.samples.length > 12) s.samples.shift();
      onDragY?.(dy);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const s = g.current;
      g.current = null;
      const t = e.changedTouches[0];
      if (!s || !t) return;
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (s.axis === 'y' && s.vertical) {
        s.samples.push({ y: dy, t: e.timeStamp });
        onReleaseY?.(dy, releaseVelocity(s.samples));
      } else if (s.axis === 'x') {
        const swipe = swipeOf(dx, 0);
        if (swipe) onSwipe(swipe);
      }
    },
    onTouchCancel: () => {
      const s = g.current;
      g.current = null;
      // The system took the touch (a call, a notification pulled down): put the picture back.
      if (s?.axis === 'y' && s.vertical) onReleaseY?.(0, 0);
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
  /** A finger is dragging the front vertically, `dy` px from where it landed (negative is up). */
  onDragY?: (dy: number) => void;
  /** …and has let go, at `velocity` px/ms. Whether that turns the page is the caller's call. */
  onReleaseY?: (dy: number, velocity: number) => void;
}

export function FlipCard({ flipped, onFlip, front, back, onDragY, onReleaseY }: FlipCardProps) {
  /*
   * The front reads three directions. Up and down are a drag the feed follows (see `feed.ts`);
   * right to left turns the card. Left to right is deliberately unbound: the card has nothing to
   * its left to come back from, and a gesture that does nothing is better than one that undoes
   * something.
   */
  const frontSwipe = useFrontGesture({
    onDragY,
    onReleaseY,
    onSwipe: (swipe) => {
      if (swipe === 'left') onFlip(true);
    },
  });

  /*
   * The back reads one direction, and it is the mirror of the one that opened it: left to right
   * puts the words away.
   *
   * Pulling *down* used to be the way out, and it cannot be any more — down is the previous
   * movement now, and the back is a column of text a finger moves down through constantly. That
   * also retires the scroll-position check this had to carry: the technique scrolls vertically and
   * nothing scrolls it sideways, so a rightward drag is unambiguous wherever it starts, and there
   * is no longer a way for reading to be mistaken for a gesture.
   */
  const backSwipe = useSwipe((swipe) => {
    if (swipe === 'right') onFlip(false);
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
          /*
           * `touch-none`: the browser does nothing with a drag on the front — no page bounce, no
           * pan — so every move reaches the feed and the picture stays under the thumb. It stops
           * at the nearest scroll container, so a panel tall enough to scroll still scrolls.
           */
          className={clsx(
            FACE,
            'touch-none',
            flipped ? 'invisible delay-[250ms]' : 'visible delay-0',
          )}
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
