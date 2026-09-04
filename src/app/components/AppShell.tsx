import type { CSSProperties, ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { isDemo } from '@/lib/api/mode';
import { BottomNav } from './BottomNav';
import { DemoBadge, DEMO_BADGE_HEIGHT } from './DemoBadge';

/**
 * Phone-width frame centered on large screens; every route renders inside it.
 * The left/right safe-area insets keep content clear of a notch in landscape; the top and bottom
 * insets are handled where they matter (<Screen>, <BottomNav>, the player chrome).
 *
 * In demo mode the frame also carries the demo strip and publishes its height as `--demo-inset`,
 * which the bottom chrome adds to its own padding. Outside the tabbed area `--nav-inset` defaults
 * to that same height, so sticky footers clear the strip too.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const demo = isDemo();
  const style = demo
    ? ({ '--demo-inset': DEMO_BADGE_HEIGHT, '--nav-inset': 'var(--demo-inset)' } as CSSProperties)
    : undefined;
  return (
    <div
      style={style}
      className="relative mx-auto min-h-dvh w-full max-w-[480px] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:border-x md:border-border"
    >
      {children}
      {demo ? <DemoBadge /> : null}
    </div>
  );
}

const NAV_INSET = '96px';

/**
 * Layout for the tabbed area: outlet + bottom nav. Exposes `--nav-inset` so <Screen> pads its
 * content and sticky footer above the nav; the nav is hidden on the player (/play).
 */
export function AppShell() {
  const { pathname } = useLocation();
  const hideNav = pathname === '/play' || pathname.startsWith('/play/');
  const inset = hideNav ? 'var(--demo-inset, 0px)' : `calc(${NAV_INSET} + var(--demo-inset, 0px))`;
  const style = { '--nav-inset': inset } as CSSProperties;
  return (
    <div style={style}>
      <Outlet />
      {hideNav ? null : <BottomNav />}
    </div>
  );
}
