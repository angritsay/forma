import type { CSSProperties, ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { isDemo } from '@/lib/api/mode';
import { BottomNav } from './BottomNav';
import { DemoBadge, DEMO_BADGE_HEIGHT } from './DemoBadge';
import { SideNav } from './SideNav';

/**
 * The outer frame: a phone column on small screens, the full viewport from `lg` up.
 *
 * The product's home is a Telegram Mini App, so phone width is the real shape and stays the
 * default. On a desktop browser it was also the *only* shape — a 480px strip down the middle of a
 * 1440px screen — which is wrong for the screens the owner works in all day. From `lg` the frame
 * releases its width and `AppShell` lays out a side nav plus a content column instead.
 *
 * The left/right safe-area insets keep content clear of a notch in landscape; the top and bottom
 * insets are handled where they matter (<Screen>, <BottomNav>, the player chrome).
 *
 * In demo mode the frame also carries the demo strip and publishes its height as `--demo-inset`,
 * which the bottom chrome adds to its own padding. Outside the tabbed area `--nav-inset` defaults
 * to that same height, so sticky footers clear the strip too.
 */
export function AppFrame({ children }: { children?: ReactNode }) {
  const demo = isDemo();
  const style = demo
    ? ({ '--demo-inset': DEMO_BADGE_HEIGHT, '--nav-inset': 'var(--demo-inset)' } as CSSProperties)
    : undefined;
  return (
    <div
      style={style}
      className="relative mx-auto min-h-dvh w-full max-w-[480px] pl-[var(--safe-left)] pr-[var(--safe-right)] md:border-x md:border-border lg:max-w-none lg:border-x-0"
    >
      {children}
      {demo ? <DemoBadge /> : null}
    </div>
  );
}

/*
 * The tab bar's height without the safe area: it is a 56px strip on the bottom edge now, not a
 * floating island with a margin under it. <Screen> adds `--safe-bottom` on top of this itself.
 */
const NAV_INSET = '56px';

/**
 * How wide the content column runs from `lg` up.
 *
 * `default` is reading width: a training screen is one column of prose, a figure and a path, and
 * stretching it across 1400px sends the eye on a journey it has no reason to take. `wide` is the
 * admin, where the content is tabular and the owner compares rows and edits a workout side by
 * side — there, width is the entire point.
 */
const CONTENT_WIDTH = {
  default: 'lg:max-w-[760px]',
  wide: 'lg:max-w-[1280px]',
} as const;

/** Routes whose content is data-dense enough to want the wide column. */
function widthFor(pathname: string): keyof typeof CONTENT_WIDTH {
  return pathname.startsWith('/admin') ? 'wide' : 'default';
}

/**
 * Layout for the screens outside the tabbed area: sign-in and onboarding.
 *
 * They carry no navigation — that is the point of them — but they still need a column. `AppFrame`
 * releases its 480px cap from `lg` so the admin can use the whole screen, and with nothing here
 * these two took the release literally: on a 1440px browser the sign-in form ran the full width of
 * the window, under a photograph a thousand pixels tall.
 *
 * Narrower than the tabbed column on purpose: both screens are a stack of one-line fields, and a
 * single form reads better in a short measure.
 */
export function FocusShell() {
  return (
    <div style={{ '--nav-inset': 'var(--demo-inset, 0px)' } as CSSProperties}>
      <div className="mx-auto w-full lg:max-w-[560px]">
        <Outlet />
      </div>
    </div>
  );
}

/**
 * Layout for the tabbed area: navigation + outlet.
 *
 * Below `lg` that is the phone bottom nav over a full-bleed outlet, unchanged. From `lg` it is a
 * sticky side nav beside a centred content column, with the bottom nav hidden — so `--nav-inset`,
 * which every <Screen> pads its content and sticky footer by, drops to the demo strip alone.
 *
 * The player (/play) takes neither at any width: it is a full-screen surface with its own chrome.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const hideNav = pathname === '/play' || pathname.startsWith('/play/');
  const width = CONTENT_WIDTH[widthFor(pathname)];

  if (hideNav) {
    return (
      <div style={{ '--nav-inset': 'var(--demo-inset, 0px)' } as CSSProperties}>
        <Outlet />
      </div>
    );
  }

  const style = { '--nav-inset': `calc(${NAV_INSET} + var(--demo-inset, 0px))` } as CSSProperties;
  return (
    <div className="lg:flex lg:items-start">
      <SideNav />
      {/*
       * From `lg` the bottom nav is gone, so the inset it reserves has to go with it. A Tailwind
       * variant cannot override an inline custom property, so the responsive value is a utility
       * class and the inline style carries only the small-screen default.
       */}
      <div style={style} className="min-w-0 flex-1 lg:[--nav-inset:var(--demo-inset,0px)]">
        <div className={`mx-auto w-full ${width}`}>
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
