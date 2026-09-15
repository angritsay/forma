/**
 * Tap the picture to pause.
 *
 * The pause was behind a 44px button in the top-right corner and behind the space bar, which is
 * the correct place for it on a desktop and the wrong one on a mat: the phone is on the floor, the
 * hands are on the floor, and hitting a small circle in a corner is a worse ask than hitting the
 * screen.
 *
 * So the whole picture is the button — and only the picture. The layer stops above the glass
 * panel, because the panel is where the decisions are: a finger that misses «Готово» by a few
 * pixels must not silently pause the session instead.
 *
 * **A swipe is not a tap.** The front of the card already means three things up, down and
 * sideways — next, previous, technique — so this listens for a press that stays put and ends
 * quickly, and
 * lets anything else through to {@link FlipCard} untouched. It never calls `preventDefault` or
 * stops propagation: the gesture handlers above it see every event they would have seen.
 */
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useT } from '@/app/hooks/useT';

/** A press that travels further than this, in px, was a swipe. */
const SLOP = 12;
/** A press held longer than this, in ms, was a hold — not a tap. */
const MAX_MS = 500;

export interface TapToPauseProps {
  onTap: () => void;
}

export function TapToPause({ onTap }: TapToPauseProps) {
  const { t } = useT();
  const start = useRef<{ x: number; y: number; at: number } | null>(null);

  const down = (e: ReactPointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, at: e.timeStamp };
  };
  const up = (e: ReactPointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y);
    if (moved <= SLOP && e.timeStamp - s.at <= MAX_MS) onTap();
  };

  return (
    <div
      /*
       * The same bottom as the clip's own stage (ArtLayer): whatever the panel measures itself to
       * be, the tap area ends where the picture does.
       */
      className="absolute inset-x-0 top-0 z-10"
      style={{ bottom: 'max(0px, calc(var(--player-glass-h, 0px) - 40px))' }}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => (start.current = null)}
      role="button"
      tabIndex={-1}
      aria-label={t('app.playerPause')}
    />
  );
}
