import type { CSSProperties, ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from './BottomNav';

/** Phone-width frame centered on large screens; every route renders inside it. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[480px] md:border-x md:border-border">
      {children}
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
  const style = { '--nav-inset': hideNav ? '0px' : NAV_INSET } as CSSProperties;
  return (
    <div style={style}>
      <Outlet />
      {hideNav ? null : <BottomNav />}
    </div>
  );
}
