import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { isDemo } from '@/lib/api/mode';
import { AdminNav } from './AdminNav';
import { BottomNav } from './BottomNav';
import { DemoBadge, DEMO_BADGE_HEIGHT } from './DemoBadge';
import { SCREEN_MOTION_CLASS, screenMotion } from './screenMotion';
import { TopNav } from './TopNav';

/**
 * The outer frame: a phone column below `md`, the full viewport from `md` up.
 *
 * The product's home is a Telegram Mini App, so phone width is the real shape and stays the
 * default. Everything above it used to be the same 480px strip: correct on a phone, and on an iPad
 * in portrait a phone stranded in the middle of a grey field. The release used to happen at `lg`
 * (1024), which left 480…1024 — every tablet, and a small laptop — with no treatment at all. It
 * happens at `md` (768) now, and that one number is what closes the gap: below it a phone, above it
 * the screen is used.
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
      className="relative mx-auto min-h-dvh w-full max-w-[480px] pl-[var(--safe-left)] pr-[var(--safe-right)] md:max-w-none"
    >
      {children}
      {demo ? <DemoBadge /> : null}
    </div>
  );
}

/*
 * The room the tab bar takes without the safe area: a 64px capsule floating 12px above the bottom
 * edge, and 12px more so the last line of a screen ends above the capsule rather than under its
 * top edge. <Screen> adds `--safe-bottom` on top of this itself.
 */
const NAV_INSET = '88px';

/**
 * The outlet, with the screen arriving the way the tab bar's highlight went.
 *
 * Keyed on the path, so each screen is a fresh element and the entrance replays on every
 * navigation and never on a re-render. The last path is kept in a ref and written after the
 * render, which is what lets the render of the *new* path still see the old one and decide the
 * direction from it — see `screenMotion`.
 */
function MotionOutlet() {
  const { pathname } = useLocation();
  const last = useRef<string | null>(null);
  const motion = screenMotion(last.current, pathname);
  useEffect(() => {
    last.current = pathname;
  }, [pathname]);
  return (
    <div key={pathname} className={SCREEN_MOTION_CLASS[motion]}>
      <Outlet />
    </div>
  );
}

/**
 * How wide the content column runs from `md` up.
 *
 * `default` is reading width: a training screen is one column of prose, a figure and a path, and
 * stretching it across 1400px sends the eye on a journey it has no reason to take. `wide` is the
 * admin, where the content is tabular and the owner compares rows and edits a workout side by
 * side — there, width is the entire point.
 *
 * `split` is for a screen that divides itself in two on `md`: the club, whose day stands beside
 * the week's board. Reading width is the wrong cap for it — 760px minus a 320px side column and
 * the gap between them leaves the main half about 400px, which squeezed the board's leading row to
 * «А…». The extra 280px is the side column, not extra measure: the reading half of the screen ends
 * up roughly where `default` would have put it. (The profile was the other one; it is a sheet now,
 * and a sheet has its own width.)
 *
 * 320px is the side column, and it means the narrowest a column can be and still hold what is in it.
 */
const CONTENT_WIDTH = {
  default: 'md:max-w-[760px]',
  split: 'md:max-w-[1040px]',
  wide: 'md:max-w-[1280px]',
} as const;

/** Routes whose content is data-dense enough to want the wide column. */
function widthFor(pathname: string): keyof typeof CONTENT_WIDTH {
  if (pathname.startsWith('/admin')) return 'wide';
  if (pathname === '/marathon') return 'split';
  return 'default';
}

/**
 * Layout for the screens outside the tabbed area: sign-in and onboarding.
 *
 * They carry no navigation — that is the point of them — but they still need a column. `AppFrame`
 * releases its 480px cap from `md`, and with nothing here these two took the release literally: on
 * a 1440px browser the sign-in form ran the full width of the window, under a photograph a
 * thousand pixels tall.
 *
 * Narrower than the tabbed column on purpose: both screens are a stack of one-line fields, and a
 * single form reads better in a short measure.
 */
export function FocusShell() {
  return (
    <div style={{ '--nav-inset': 'var(--demo-inset, 0px)' } as CSSProperties}>
      <div className="mx-auto w-full md:max-w-[560px]">
        <Outlet />
      </div>
    </div>
  );
}

/**
 * Layout for the tabbed area: navigation + outlet.
 *
 * Below `md` that is the phone bottom nav over a full-bleed outlet, unchanged. From `md` it is a
 * sticky row across the top (`TopNav`) with the bottom nav hidden — so `--nav-inset`, which every
 * <Screen> pads its content and sticky footer by, drops to the demo strip alone.
 *
 * Inside `/admin` a second column joins it (`AdminNav`): five long destinations that do not fit in
 * a row, standing beside the content rather than above it.
 *
 * The player (/play) takes neither at any width: it is a full-screen surface with its own chrome.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const hideNav = pathname === '/play' || pathname.startsWith('/play/');
  const admin = pathname.startsWith('/admin');
  const width = CONTENT_WIDTH[widthFor(pathname)];

  if (hideNav) {
    return (
      <div style={{ '--nav-inset': 'var(--demo-inset, 0px)' } as CSSProperties}>
        <Outlet />
      </div>
    );
  }

  /*
   * From `md` the bottom nav is gone, so the inset it reserves has to go with it. A Tailwind
   * variant cannot override an inline custom property, so the responsive value is a utility class
   * and the inline style carries only the small-screen default.
   */
  const style = { '--nav-inset': `calc(${NAV_INSET} + var(--demo-inset, 0px))` } as CSSProperties;
  return (
    <div style={style} className="md:[--nav-inset:var(--demo-inset,0px)]">
      <TopNav />
      <div className="md:mx-auto md:flex md:w-full md:max-w-[1280px] md:items-start">
        {admin ? <AdminNav /> : null}
        <div className="min-w-0 flex-1">
          <div className={`mx-auto w-full ${width}`}>
            <MotionOutlet />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
