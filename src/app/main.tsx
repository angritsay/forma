/**
 * App entry (mounted client-only from src/pages/app/index.astro).
 * HashRouter → AppProviders (session bootstrap, locale, toasts, error boundary) → AppRoutes.
 * Without backend env the app shows the setup screen, which also offers the browser-local demo.
 *
 * Inside Telegram the first render waits for the Mini App SDK: Telegram passes the launch data in
 * the URL hash, and HashRouter rewrites that hash as soon as it mounts. Outside Telegram the wait
 * resolves immediately and nothing about the app changes.
 */
import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router';
import { isConfigured } from '@/lib/api/client';
import { enableDemo, isDemo } from '@/lib/api/mode';
import { initTelegram, startParam, waitForTelegram } from '@/lib/telegram/webapp';
import { AppProviders } from './components/AppProviders';
import { AppFrame } from './components/AppShell';
import { BootScreen } from './components/BootScreen';
import { stashStartParam } from './features/marathon/duoInvite';
import { AppRoutes } from './router';
import NotConfiguredScreen from './screens/NotConfiguredScreen';

export default function App() {
  // The island is client-only, so reading the demo flag during the first render is safe.
  const [demo, setDemo] = useState(isDemo);
  // Only ever false for the moment it takes Telegram's SDK to load; see the note above.
  const [ready, setReady] = useState(
    () => typeof window === 'undefined' || !window.__formaTelegram,
  );

  useEffect(() => {
    if (ready) {
      initTelegram();
      return;
    }
    let alive = true;
    void waitForTelegram().then((api) => {
      if (!alive) return;
      initTelegram(api);
      /*
       * A duo invite sent as `t.me/<bot>/<app>?startapp=duo_<token>` arrives as the launch
       * parameter, not as a route. Put it where `#/duo/<token>` puts it, before the router mounts,
       * and the shell takes the person to /duo the same way.
       */
      stashStartParam(startParam());
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [ready]);

  /*
   * Waiting on Telegram's SDK, which is a request to telegram.org. This used to render an empty
   * frame — a second black screen, straight after the one the island's fallback just handed over,
   * and the only wait in the app with nothing in it. `BootScreen` is what the rest of the boot
   * shows, and this is part of the same boot.
   */
  if (!ready)
    return (
      <AppFrame>
        <BootScreen />
      </AppFrame>
    );

  if (!isConfigured() && !demo) {
    const openDemo = () => {
      enableDemo();
      setDemo(true);
    };
    return (
      <AppFrame>
        <NotConfiguredScreen onOpenDemo={openDemo} />
      </AppFrame>
    );
  }
  return (
    <HashRouter>
      <AppProviders>
        <AppFrame>
          <AppRoutes />
        </AppFrame>
      </AppProviders>
    </HashRouter>
  );
}
