import { useEffect, useMemo, type ReactNode } from 'react';
import { KitProvider, type KitLabels } from '@/components/ui/KitContext';
import { t } from '@/i18n/index';
import { useLocale } from '@/app/store/locale';
import { useSession } from '@/app/store/session';
import { ErrorBoundary } from './ErrorBoundary';
import { Toaster } from './Toaster';

/** Session bootstrap, locale → <html lang>, kit labels, toasts and the top-level error boundary. */
export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useLocale((s) => s.locale);

  useEffect(() => {
    void useSession.getState().boot();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const labels = useMemo<KitLabels>(
    () => ({
      close: t(locale, 'app.kitClose'),
      dismiss: t(locale, 'app.kitDismiss'),
      loading: t(locale, 'app.kitLoading'),
    }),
    [locale],
  );

  return (
    <ErrorBoundary>
      <KitProvider labels={labels}>
        <Toaster>{children}</Toaster>
      </KitProvider>
    </ErrorBoundary>
  );
}
