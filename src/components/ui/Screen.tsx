import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface ScreenProps {
  /** Sticky header (usually <TopBar>). */
  header?: ReactNode;
  /** Sticky footer above the bottom nav (primary action). */
  footer?: ReactNode;
  /** Horizontal padding on the content. Default true. */
  padded?: boolean;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Safe-area aware screen container. The app shell exposes `--nav-inset` (height of the bottom
 * nav, 0 when hidden) so content and the sticky footer clear it.
 *
 * The content area is the app's `<main>` landmark — screens are never nested, so there is exactly
 * one per route.
 */
export function Screen({
  header,
  footer,
  padded = true,
  children,
  className,
  contentClassName,
}: ScreenProps) {
  return (
    <div className={clsx('flex min-h-dvh flex-col', className)}>
      {header ? (
        /*
         * Glass, and this reverses what stood here — «opaque, because at 85% the content scrolling
         * under the bar still reads through it». That objection was right about a flat 85% panel,
         * and it is the reason `.glass-bar-top` is a gradient instead: sheer along the bottom edge,
         * where the page arrives from, and near-opaque by the time it reaches the title. The words
         * sit on the solid end of the band, so nothing reads through them and only the material
         * shows. The footer below keeps the old treatment, for a reason given there.
         *
         * The header is `sticky`, so content passes beneath it and there is something real to
         * blur — which is the whole condition for glass being worth its compositing layer.
         */
        <div className="glass-bar-top sticky top-0 z-20 pt-[var(--safe-top)]">{header}</div>
      ) : (
        <div className="h-[var(--safe-top)]" />
      )}
      <main
        className={clsx(
          'flex-1 pb-[calc(var(--nav-inset,0px)+var(--safe-bottom)+32px)]',
          padded && 'px-6 md:px-10',
          contentClassName,
        )}
      >
        {children}
      </main>
      {/*
       * The band behind the primary action is opaque, and the fade is a separate strip above it.
       *
       * It used to be one `to-transparent` gradient across the whole band, which meant the top of
       * it — where the button actually sits — was see-through: on the onboarding steps the input
       * and its label scrolled underneath and read straight through «Продолжить». A gradient can
       * soften the edge between content and chrome, but it cannot be the background of the control
       * itself.
       */}
      {/*
       * Its side padding matches the content above it. The two used to disagree — the content took
       * `lg:px-10` and this band only ever `px-6` — so on a wide screen the primary button stood on
       * a different vertical from every word above it.
       */}
      {footer ? (
        <div className="sticky bottom-[var(--nav-inset,0px)] z-20 bg-bg px-6 pt-5 pb-[calc(var(--safe-bottom)+16px)] md:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-full h-6 bg-linear-to-t from-bg to-transparent"
          />
          {/*
           * The action stops stretching at `md`. A primary button is full-width on a phone because
           * the thumb is imprecise and the screen is narrow; at 1280px the same rule produced a
           * «+ Новое упражнение» 935px wide floating over the list it belongs to, which reads as a
           * banner rather than as a control. 420px is the width the button has on the largest phone
           * the product supports, so it is the same object, not a new one.
           */}
          <div className="md:max-w-[420px]">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}
