/**
 * App entry (mounted client-only from src/pages/app/index.astro).
 * HashRouter → AppProviders (session bootstrap, locale, toasts, error boundary) → AppRoutes.
 * Without backend env the app shows the setup screen instead of crashing.
 */
import { HashRouter } from 'react-router';
import { isConfigured } from '@/lib/api/client';
import { AppProviders } from './components/AppProviders';
import { AppFrame } from './components/AppShell';
import { AppRoutes } from './router';
import NotConfiguredScreen from './screens/NotConfiguredScreen';

export default function App() {
  if (!isConfigured()) {
    return (
      <AppFrame>
        <NotConfiguredScreen />
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
