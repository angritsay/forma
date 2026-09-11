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
        // Opaque for the same reason as the footer: at 85% the content scrolling under the bar
        // still reads through it, and a blur only turns that into a smear behind the title.
        <div className="sticky top-0 z-20 bg-bg pt-[var(--safe-top)]">{header}</div>
      ) : (
        <div className="h-[var(--safe-top)]" />
      )}
      <main
        className={clsx(
          'flex-1 pb-[calc(var(--nav-inset,0px)+var(--safe-bottom)+24px)]',
          padded && 'px-5 lg:px-8',
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
      {footer ? (
        <div className="sticky bottom-[var(--nav-inset,0px)] z-20 bg-bg px-5 pt-4 pb-[calc(var(--safe-bottom)+16px)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-full h-6 bg-linear-to-t from-bg to-transparent"
          />
          {footer}
        </div>
      ) : null}
    </div>
  );
}
