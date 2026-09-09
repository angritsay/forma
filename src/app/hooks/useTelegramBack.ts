/**
 * Telegram's own back button, wired to the app's history.
 *
 * Telegram draws a back control in its header; a Mini App is expected to drive it. On the four tab
 * routes it stays hidden, and Telegram's own gesture then closes the app — which is what a person
 * expects from the home screen of a Mini App. Everywhere else it goes back one entry, exactly like
 * the app's own arrow.
 *
 * Outside Telegram every call in here is a no-op.
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { hideBackButton, showBackButton } from '@/lib/telegram/webapp';

/** Routes that are a starting point, not a step in a journey. */
const ROOTS = new Set(['/', '/courses', '/stats', '/profile', '/auth', '/onboarding']);

/** Exported for the test: the rule is the whole behaviour, the hook is just plumbing. */
export function isRootRoute(pathname: string): boolean {
  return ROOTS.has(pathname) || pathname.startsWith('/onboarding/');
}

export function useTelegramBack(): void {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isRootRoute(pathname)) {
      hideBackButton();
      return;
    }
    return showBackButton(() => void navigate(-1));
  }, [pathname, navigate]);
}
