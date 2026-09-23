/**
 * «Уйти без сохранения?» for an editor that lives on its own route.
 *
 * The app runs on a HashRouter, which has no `useBlocker`, and the ways out of a screen are three:
 * the app's own back arrow, Telegram's back button (which calls `navigate(-1)` from
 * `useTelegramBack`) and the browser's. The first one the screen owns and simply asks. The other two
 * are history pops, so while the form is dirty one extra entry with the same address sits on top of
 * the stack: a pop lands on the same screen, and the guard asks instead of leaving.
 *
 * `leave()` is the one way out once the answer is yes (or the work was saved): it takes the extra
 * entry back off first, so the history the person walks later has no phantom copy of the editor.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { setClosingConfirmation } from '@/lib/telegram/webapp';

export interface UnsavedGuard {
  /** A back press happened while dirty: show the question. */
  asking: boolean;
  /** Ask if dirty, otherwise leave. For the screen's own back and cancel controls. */
  attempt: () => void;
  /** Stay on the screen; the guard is re-armed. */
  stay: () => void;
  /** Leave for real: the fallback path when there is nothing in-app to go back to. */
  leave: () => void;
}

export function useUnsavedGuard(dirty: boolean, fallback: string): UnsavedGuard {
  const navigate = useNavigate();
  const location = useLocation();
  const [asking, setAsking] = useState(false);
  const armed = useRef(false);
  /** Set while `leave()` pops its own guard entry, so that pop is not mistaken for a back press. */
  const afterPop = useRef<(() => void) | null>(null);
  // `default` is the key of the first entry of a session: nothing in the app to go back to.
  const canGoBack = location.key !== 'default';

  const exit = useCallback(() => {
    if (canGoBack) void navigate(-1);
    else void navigate(fallback, { replace: true });
  }, [canGoBack, fallback, navigate]);

  // Arm while dirty and not already asking.
  useEffect(() => {
    if (dirty && !armed.current && !asking) {
      window.history.pushState(window.history.state, '', window.location.href);
      armed.current = true;
    }
  }, [dirty, asking]);

  useEffect(() => {
    const onPop = () => {
      const then = afterPop.current;
      if (then) {
        afterPop.current = null;
        then();
        return;
      }
      if (armed.current) {
        // The guard entry was consumed by a back press: ask, and re-arm if they stay.
        armed.current = false;
        setAsking(true);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Closing the Mini App with unsaved work asks too; a web tab gets the browser's own question.
  useEffect(() => {
    if (!dirty) return;
    setClosingConfirmation(true);
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      setClosingConfirmation(false);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [dirty]);

  const leave = useCallback(() => {
    setAsking(false);
    if (armed.current) {
      armed.current = false;
      afterPop.current = exit;
      window.history.back();
    } else {
      exit();
    }
  }, [exit]);

  const attempt = useCallback(() => {
    if (dirty) setAsking(true);
    else leave();
  }, [dirty, leave]);

  const stay = useCallback(() => setAsking(false), []);

  return { asking, attempt, stay, leave };
}
