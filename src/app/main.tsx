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
import { initTelegram, waitForTelegram } from '@/lib/telegram/webapp';
import { AppProviders } from './components/AppProviders';
import { AppFrame } from './components/AppShell';
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
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [ready]);

  if (!ready) return <AppFrame />;

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
