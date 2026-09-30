import { useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { rememberNext } from '@/app/features/entry/next';
import { useActiveWorkoutStore, type ActiveSession } from '@/app/store/activeWorkout';
import { BootScreen } from './BootScreen';

/**
 * The player and the summary of a workout already on the device work without the server: the
 * steps, the clock and the results are all local, and the save retries on its own terms. So when
 * the app cannot tell who is signed in (offline boot) or cannot load the profile, these two routes
 * still open — the rest of the app says what failed.
 */
export function localWorkoutRoute(pathname: string, session: ActiveSession | null): boolean {
  if (!session) return false;
  if (pathname === '/play') return true;
  return pathname === `/summary/${session.sessionId}`;
}

function useLocalWorkoutRoute(): boolean {
  const { pathname } = useLocation();
  const session = useActiveWorkoutStore((s) => s.session);
  return localWorkoutRoute(pathname, session);
}

/** Boot could not reach the server: «Нет соединения», and the one thing to do about it. */
export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useT();
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <EmptyState
        title={t('app.offlineTitle')}
        description={t('app.offlineBody')}
        action={
          <Button variant="action" size="lg" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      />
    </div>
  );
}

function Offline() {
  const boot = useSession((s) => s.boot);
  return <OfflineScreen onRetry={() => void boot()} />;
}

interface FromState {
  from?: string;
}

/** Signed-in users only; otherwise → /auth (remembering where they wanted to go). */
export function RequireAuth() {
  const status = useSession((s) => s.status);
  const location = useLocation();
  const local = useLocalWorkoutRoute();
  if (status === 'booting') return <BootScreen />;
  if (status === 'offline') return local ? <Outlet /> : <Offline />;
  if (status === 'signed_out') {
    // Keep the query string too, so e.g. /leaderboard?course=x comes back intact.
    const from = `${location.pathname}${location.search}`;
    /*
     * `from` rides in the history state, which survives only as long as nobody leaves /auth for
     * somewhere else — and onboarding is somewhere else. The whitelisted destinations are also
     * set aside in the session, so the screen that ends the *last* detour can still find them
     * (features/entry/next.ts). A path off the list clears what an older detour left there.
     */
    rememberNext(from);
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
            <Button variant="action" size="lg" onClick={() => void boot()}>
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
  const location = useLocation();
  const local = useLocalWorkoutRoute();
  if (status === 'booting') return <BootScreen />;
  if (status === 'offline') return local ? <Outlet /> : <Offline />;
  if (status === 'signed_out') {
    rememberNext(`${location.pathname}${location.search}`);
    return <Navigate to="/auth" replace />;
  }
  // A workout on the device goes on without the profile; everything else waits for it.
  if (!profile && error) return local ? <Outlet /> : <ProfileLoadError />;
  if (!profile || !profile.onboardedAt) {
    // Onboarding ends on `consumeNext() ?? '/'`: the link that sent them here is where they land.
    rememberNext(`${location.pathname}${location.search}`);
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

/**
 * For /onboarding: a profile that is already set up is never walked through the wizard again —
 * its last step saves the whole profile, and a second pass would overwrite the real one with
 * whatever the draft held. A profile that failed to load gets the retry, for the same reason: not
 * knowing whether it exists is not the same as it not existing.
 *
 * Decided once, on the way in. The wizard's own save sets `onboardedAt` while it is on screen, and
 * that moment belongs to the wizard, which then goes where the link was headed.
 */
export function RedirectIfOnboarded() {
  const profile = useSession((s) => s.profile);
  const error = useSession((s) => s.error);
  const onboardedOnEntry = useRef(Boolean(profile?.onboardedAt)).current;
  if (onboardedOnEntry) return <Navigate to="/" replace />;
  if (!profile && error) return <ProfileLoadError />;
  return <Outlet />;
}

/** For /auth: signed-in users go back where they came from (or home). */
export function RedirectIfAuthed() {
  const status = useSession((s) => s.status);
  const location = useLocation();
  if (status === 'booting') return <BootScreen />;
  // Unknown is not signed out: the sign-in form is no answer to «no signal».
  if (status === 'offline') return <Offline />;
  if (status === 'signed_in') {
    const from = (location.state as FromState | null)?.from;
    return <Navigate to={from && !from.startsWith('/auth') ? from : '/'} replace />;
  }
  return <Outlet />;
}
