import { useEffect, useMemo, type ReactNode } from 'react';
import { KitProvider, type KitLabels } from '@/components/ui/KitContext';
import { linkTelegram } from '@/lib/api/telegram';
import { telegram } from '@/lib/telegram/webapp';
import { t } from '@/i18n/index';
import { useCatalogue } from '@/app/store/catalogue';
import { useLocale } from '@/app/store/locale';
import { useSession } from '@/app/store/session';
import { ErrorBoundary } from './ErrorBoundary';
import { Toaster } from './Toaster';

/** Session bootstrap, locale → <html lang>, kit labels, toasts and the top-level error boundary. */
export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useLocale((s) => s.locale);
  const signedIn = useSession((s) => s.status === 'signed_in');

  useEffect(() => {
    void useSession.getState().boot();
  }, []);

  /*
   * The published courses are loaded once there is a session, not at boot: reading them needs an
   * authenticated role (RLS), and a signed-out visitor would only get a 401 for their trouble.
   * Failure is survivable — the catalogue falls back to the compiled courses.
   */
  useEffect(() => {
    if (signedIn) void useCatalogue.getState().load();
  }, [signedIn]);

  /*
   * Привязать телеграм-аккаунт к профилю — внутри телеграма и только когда человек вошёл.
   *
   * Здесь, а не в онбординге: строка запуска живёт минуты, а до онбординга человек может дойти
   * через неделю. Здесь она свежая, потому что приложение только что открылось.
   *
   * На каждый запуск, а не «один раз навсегда». Строка уже в руках, ответ функции — одна запись,
   * а поводов привязке пропасть хватает: вошёл под другой почтой, тренер почистил профиль,
   * телеграм выдал новый id. Отдельный запрос «а не привязано ли уже» стоил бы ровно столько же,
   * сколько сама привязка.
   *
   * Отказ молчит: человек открыл приложение тренироваться, а не чинить уведомления.
   */
  useEffect(() => {
    if (!signedIn) return;
    const initData = telegram()?.initData;
    if (initData) void linkTelegram(initData);
  }, [signedIn]);

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
