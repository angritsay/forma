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
        <div className="sticky top-0 z-20 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          {header}
        </div>
      ) : (
        <div className="h-[env(safe-area-inset-top)]" />
      )}
      <main
        className={clsx(
          'flex-1 pb-[calc(var(--nav-inset,0px)+env(safe-area-inset-bottom)+24px)]',
          padded && 'px-5',
          contentClassName,
        )}
      >
        {children}
      </main>
      {footer ? (
        <div className="sticky bottom-[var(--nav-inset,0px)] z-20 bg-linear-to-t from-bg via-bg/90 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
