/**
 * App entry (mounted client-only from src/pages/app/index.astro).
 * HashRouter → AppProviders (session bootstrap, locale, toasts, error boundary) → AppRoutes.
 * Without backend env the app shows the setup screen, which also offers the browser-local demo.
 */
import { useState } from 'react';
import { HashRouter } from 'react-router';
import { isConfigured } from '@/lib/api/client';
import { enableDemo, isDemo } from '@/lib/api/mode';
import { AppProviders } from './components/AppProviders';
import { AppFrame } from './components/AppShell';
import { AppRoutes } from './router';
import NotConfiguredScreen from './screens/NotConfiguredScreen';

export default function App() {
  // The island is client-only, so reading the demo flag during the first render is safe.
  const [demo, setDemo] = useState(isDemo);

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
