import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { clearMediaUrlCache } from '@/lib/api/storage';
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
  const userId = useSession((s) => s.user?.id ?? null);
  // What the user owns, as one comparable string: a change means a purchase or a claim landed.
  const owned = useSession((s) => [...s.entitlements].sort().join(','));

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
   * …and again when what the user owns changes. A course bought or claimed a minute ago is read
   * through the same RLS, so the catalogue loaded before the purchase does not have its days and
   * the course opened empty until the app was restarted. The first value is the one `load` above
   * already used; only a change after it refreshes.
   */
  const ownedSeen = useRef<string | null>(null);
  useEffect(() => {
    if (!signedIn) {
      ownedSeen.current = null;
      return;
    }
    if (ownedSeen.current !== null && ownedSeen.current !== owned) {
      void useCatalogue.getState().refresh();
    }
    ownedSeen.current = owned;
  }, [signedIn, owned]);

  /*
   * Signed URLs for paid clips are kept for the tab (src/lib/api/storage.ts). They were signed
   * under somebody's entitlements, so they go when that somebody does — on sign-out or a switch of
   * account, not on the first sign-in.
   */
  const lastUser = useRef<string | null>(null);
  useEffect(() => {
    if (lastUser.current !== null && lastUser.current !== userId) clearMediaUrlCache();
    lastUser.current = userId;
  }, [userId]);

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
