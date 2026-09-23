import { Navigate, Outlet, useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { BootScreen } from './BootScreen';

interface FromState {
  from?: string;
}

/** Signed-in users only; otherwise → /auth (remembering where they wanted to go). */
export function RequireAuth() {
  const status = useSession((s) => s.status);
  const location = useLocation();
  if (status === 'booting') return <BootScreen />;
  if (status === 'signed_out') {
    // Keep the query string too, so e.g. /leaderboard?course=x comes back intact.
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/auth" replace state={{ from } satisfies FromState} />;
  }
  return <Outlet />;
}

/**
 * Профиль не загрузился.
 *
 * До сих пор экран умел сказать ровно одно: «проверь соединение». На деле «проверь соединение» —
 * это только `network`; всё остальное — отказ базы, протухшая сессия, отставшая миграция — выходило
 * тем же текстом, и владелец, у которого связь в порядке, оставался с советом, который ни к чему
 * не ведёт.
 *
 * Поэтому здесь есть подробности, и ровно тем же приёмом, что на экране падения (`ErrorBoundary`):
 * свёрнутая строка, которую читают с фотографии чужого телефона. Код и сообщение — это то, что
 * отличает «база отстала» от «токен просрочен», и без них починка превращается в гадание.
 */
function ProfileLoadError() {
  const { t } = useT();
  const error = useSession((s) => s.error);
  const boot = useSession((s) => s.boot);
  const signOut = useSession((s) => s.signOut);
  const detail = error ? [error.code, error.status, error.message].filter(Boolean).join(' · ') : '';
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <EmptyState
        title={t('app.errorLoadProfileTitle')}
        description={
          error?.code === 'network' ? t('common.errorOffline') : t('app.errorLoadProfileBody')
        }
        action={
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={() => void boot()}>
              {t('common.retry')}
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              {t('app.authSignOut')}
            </Button>
            {detail ? (
              <details className="mt-2 text-left">
                <summary className="cursor-pointer text-[13px] text-muted-2">
                  {t('app.errorDetails')}
                </summary>
                {/* `break-words`, а не скроллер: строка, которую надо прокручивать, на фотографии
                    приезжает обрезанной. */}
                <p className="mt-1.5 text-[12px] leading-snug break-words text-muted-2">{detail}</p>
              </details>
            ) : null}
          </div>
        }
      />
    </div>
  );
}

/** Onboarded users only; users without a finished profile → /onboarding. */
export function RequireOnboarded() {
  const status = useSession((s) => s.status);
  const profile = useSession((s) => s.profile);
  const error = useSession((s) => s.error);
  if (status === 'booting') return <BootScreen />;
  if (status === 'signed_out') return <Navigate to="/auth" replace />;
  if (!profile && error) return <ProfileLoadError />;
  if (!profile || !profile.onboardedAt) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** For /auth: signed-in users go back where they came from (or home). */
export function RedirectIfAuthed() {
  const status = useSession((s) => s.status);
  const location = useLocation();
  if (status === 'booting') return <BootScreen />;
  if (status === 'signed_in') {
    const from = (location.state as FromState | null)?.from;
    return <Navigate to={from && !from.startsWith('/auth') ? from : '/'} replace />;
  }
  return <Outlet />;
}
