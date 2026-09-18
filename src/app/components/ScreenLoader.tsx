/**
 * What a screen shows while its data is on the way: the mark, centred, waiting.
 *
 * **It replaces a worse thing than a spinner.** Screens used to render themselves with empty
 * props while they loaded — «Клуб» drew `page(null, …)`, which is a whole page: a «?» where the
 * day number goes, the generic title «Один маленький шаг в день», an empty card. A second later
 * the data landed and that page was swapped for a different one. The owner described exactly that:
 * «загружается дефолтное состояние и потом оно дергается когда переходит на реальное состояние».
 *
 * A half-drawn page is a promise about what is coming, and when the promise is wrong the correction
 * reads as a fault. The mark promises nothing — it is the product's name while the product is on
 * its way, which is what `BootScreen` already does for the bundle. This is the same gesture for the
 * data, so a cold open and a tab switch feel like one system.
 *
 * ## The delay is the whole trick
 *
 * Showing it immediately would trade one flicker for another: most navigations resolve from cache
 * in well under a frame budget, and a wordmark that appears and vanishes in 40ms is a flash, not a
 * transition. So nothing is drawn for `DELAY_MS`. Under that, the screen simply appears with its
 * real content and there was never anything to hide; over it, the mark is already the honest
 * answer to "why is this taking a moment".
 *
 * 140ms is chosen against human perception rather than against a network: below roughly 100ms a
 * change reads as instantaneous and any interstitial is noise, and by 150ms the eye has started
 * waiting for feedback. The window between is where an indicator stops being a distraction and
 * starts being an answer.
 *
 * ## The size
 *
 * The owner's measure: «лого которое занимает одну пятую ширины по центру экрана».
 *
 * The font size that produces it was **measured rather than estimated**, and the estimate was
 * wrong by a lot: the wordmark draws at about **5.26× its font size**, not the ~3.1× five letters
 * suggest — the F is stretched ×1.22, the gap after it is wider, and every letter reserves the
 * width of its 800 weight so the wave does not shove the word about. So a fifth of the viewport is
 * `20vw / 5.26 ≈ 3.8vw`.
 *
 * Clamped at both ends. Below about 15px the weight wave stops being legible as motion — it is a
 * variation between 200 and 800 on glyphs a few pixels tall — so the floor keeps it a mark rather
 * than a smudge. The ceiling is because a fifth of a 1440px window is 288px, which is wider than
 * the launch screen's mark on a phone: past a point this stops being a quiet beat and becomes a
 * second splash.
 *
 * Deliberately smaller than `BootScreen`'s clamp, and that difference is the point. The launch
 * screen is the product arriving and fills the space; this is a beat inside a session, and a mark
 * at launch size for a 300ms wait would read as the app having restarted.
 */
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { LogoLoader } from '@/components/ui/LogoLoader';

/** How long a screen may take before anything is drawn about it. */
export const DELAY_MS = 140;

export interface ScreenLoaderProps {
  /**
   * Height of the area the mark centres in. The default fills the space a screen occupies between
   * the safe-area top and the tab bar, so the mark sits on the optical centre of the page rather
   * than at the top of an empty column.
   */
  className?: string;
}

export function ScreenLoader({ className }: ScreenLoaderProps) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className={clsx(
        'flex min-h-[calc(100dvh-var(--nav-inset,0px)-var(--safe-top)-96px)] items-center justify-center px-6',
        className,
      )}
    >
      {/*
       * `fade-in` rather than an opacity toggle on the element itself: the mark is not in the tree
       * at all until the delay is up, so there is nothing to transition *from*, and a keyframe is
       * what carries a reduced-motion opt-out with it.
       */}
      {shown ? <LogoLoader className="fade-in text-[clamp(15px,3.8vw,32px)]" /> : null}
    </div>
  );
}
