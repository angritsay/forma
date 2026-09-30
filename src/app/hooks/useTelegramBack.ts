/**
 * Telegram's own back button, wired to the app's history.
 *
 * Telegram draws a back control in its header; a Mini App is expected to drive it. On the tab
 * routes it stays hidden, and Telegram's own gesture then closes the app — which is what a person
 * expects from the home screen of a Mini App. Everywhere else it goes back one entry, exactly like
 * the app's own arrow — or home, when the screen was opened straight from a link and there is no
 * entry of the app's own to go back to (`hasInAppHistory`); `navigate(-1)` from there did nothing.
 *
 * A screen with something to lose claims the button while it is mounted ({@link useTelegramBackOverride}):
 * the player asks «Выйти из тренировки?» instead of walking out of a running workout.
 *
 * Outside Telegram every call in here is a no-op.
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { hideBackButton, showBackButton } from '@/lib/telegram/webapp';
import { hasInAppHistory } from './useBackOr';

/** Routes that are a starting point, not a step in a journey. */
const ROOTS = new Set(['/', '/marathon', '/book', '/admin', '/auth', '/onboarding']);

/** Exported for the test: the rule is the whole behaviour, the hook is just plumbing. */
export function isRootRoute(pathname: string): boolean {
  return ROOTS.has(pathname) || pathname.startsWith('/onboarding/');
}

/** What a press does: step back through the app, or go home when there is nothing to step to. */
export function backTarget(locationKey: string | undefined): -1 | '/' {
  return hasInAppHistory(locationKey) ? -1 : '/';
}

/** The handler a mounted screen has claimed the button with, if any. */
let override: (() => void) | null = null;

/** Exported for the test: a claimed button runs the screen's handler instead of going back. */
export function runBack(fallback: () => void): void {
  if (override) override();
  else fallback();
}

/**
 * Claim Telegram's back button for as long as the calling screen is mounted. The route's own
 * button stays shown; only what a press does changes.
 */
export function useTelegramBackOverride(handler: () => void): void {
  useEffect(() => {
    override = handler;
    return () => {
      if (override === handler) override = null;
    };
  }, [handler]);
}

export function useTelegramBack(): void {
  const { pathname, key } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isRootRoute(pathname)) {
      hideBackButton();
      return;
    }
    return showBackButton(() =>
      runBack(() => {
        const to = backTarget(key);
        if (to === -1) void navigate(-1);
        else void navigate(to, { replace: true });
      }),
    );
  }, [pathname, key, navigate]);
}
