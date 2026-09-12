/**
 * The player is one card, and it has two sides.
 *
 * The front is the coach's clip with the movement's numbers on it. The back is everything that is
 * words. They are not a page you scroll through — scrolling down a video is how the text ends up
 * half over the demonstration — they are two faces of the same object, and getting from one to the
 * other is a turn: swipe up, or use the corner control.
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

/** Vertical travel (px) that counts as a deliberate turn rather than a tap that wandered. */
const SWIPE_PX = 48;

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
}

export function FlipCard({ flipped, onFlip, front, back }: FlipCardProps) {
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0]?.clientY ?? null;
    startX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const y0 = startY.current;
    const x0 = startX.current;
    startY.current = null;
    startX.current = null;
    const touch = e.changedTouches[0];
    if (y0 === null || x0 === null || !touch) return;
    const dy = touch.clientY - y0;
    const dx = touch.clientX - x0;
    // A mostly-sideways drag is not a turn; it is someone steadying the phone.
    if (Math.abs(dy) < SWIPE_PX || Math.abs(dx) > Math.abs(dy)) return;
    if (dy < 0) onFlip(true);
    else onFlip(false);
  };

  return (
    <div
      className="size-full [perspective:1600px]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
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
        >
          {back}
        </div>
      </div>
    </div>
  );
}
