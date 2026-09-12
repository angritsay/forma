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
 */
import { clsx } from 'clsx';
import { useRef, type ReactNode } from 'react';

/** Vertical travel (px) that counts as a deliberate turn rather than a tap that wandered. */
const SWIPE_PX = 48;

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
          'relative size-full transition-transform duration-500 ease-(--ease-out) [transform-style:preserve-3d]',
          'motion-reduce:transition-none',
          flipped && '[transform:rotateY(180deg)]',
        )}
      >
        {/*
         * Both faces are laid on top of each other and hidden from behind, so only the one facing
         * the viewer is ever painted. `inert` on the far side keeps it out of the tab order and
         * away from a screen reader while it is turned away.
         */}
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          {...(flipped ? { inert: '' as unknown as boolean } : {})}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          {...(flipped ? {} : { inert: '' as unknown as boolean })}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
