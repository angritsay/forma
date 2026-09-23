/**
 * App routes (docs/SPEC.md §9). Auth and onboarding live outside the tabbed shell; everything
 * else renders inside <AppShell> behind RequireAuth → RequireOnboarded.
 *
 * Three tabs sit on `/` («Курсы»), `/marathon` («Клуб») and `/book` («Тренер»), with `/admin` as a
 * fourth seat for whoever has the panel. The paths kept the names they were built with: the words
 * on the bar changed, the URLs did not, so nothing that was ever linked or bookmarked broke.
 *
 * `/assessment` joins auth and onboarding outside the shell — see the route for why.
 *
 * The language question sits above all of this and has no route of its own: see <LanguageGate>.
 *
 * Inside a Telegram Mini App the same routes also drive Telegram's own back button.
 */
import { Suspense, type ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { AppShell, FocusShell } from './components/AppShell';
import { BootScreen } from './components/BootScreen';
import { RedirectIfAuthed, RequireAuth, RequireOnboarded } from './components/RouteGuards';
import { TopBar } from './components/TopBar';
import { useT } from './hooks/useT';
import { useTelegramBack } from './hooks/useTelegramBack';
import { useLocale } from './store/locale';
import { useSession } from './store/session';
import AuthScreen from './screens/AuthScreen';
import LanguageScreen from './screens/LanguageScreen';
import OnboardingScreen from './screens/onboarding/OnboardingScreen';
import { getScreen, type ScreenName } from './screens/registry';
import { pendingDuoInvite, stashDuoInvite } from './features/marathon/duoInvite';

function MissingScreen({ name }: { name: ScreenName }) {
  const { t } = useT();
  const navigate = useNavigate();
  return (
    <Screen header={<TopBar back title={name.replace(/Screen$/, '')} />}>
      <EmptyState
        icon="info"
        title={t('app.errorScreenMissingTitle')}
        description={t('app.errorScreenMissingBody')}
        action={
          <Button variant="action" onClick={() => navigate('/')}>
            {t('app.tabCourses')}
          </Button>
        }
      />
    </Screen>
  );
}

function LazyScreen({ name }: { name: ScreenName }) {
  const Component = getScreen(name);
  if (!Component) return <MissingScreen name={name} />;
  return <Component />;
}

/**
 * `#/duo/<token>` — a friend's invite link, caught before any guard.
 *
 * Whoever opens it is often signed out or not through onboarding yet, and both of those detours
 * end somewhere else (`/` after onboarding). So the token is set aside in sessionStorage and the
 * link moves on to `/duo`, where it is accepted once the person is in; <PendingDuoInvite> brings
 * them back there from wherever the detours land.
 */
function DuoInviteCapture() {
  const { token } = useParams();
  stashDuoInvite(token);
  return <Navigate to="/duo" replace />;
}

/** The tabbed shell — unless an invite is still set aside, which wins over whatever screen this was. */
function ShellWithPendingInvite() {
  const { pathname } = useLocation();
  if (pathname !== '/duo' && pendingDuoInvite()) return <Navigate to="/duo" replace />;
  return <AppShell />;
}

/**
 * The language question, above the router rather than inside it.
 *
 * **Not a route.** A route can be navigated away from, linked past and left in the history, and
 * this is a question the app has to have an answer to before it draws anything with words on it.
 * As a wrapper it is simply the first screen, with no back button and nothing behind it.
 *
 * **Only when signed out.** Someone signed in gets settled by their profile the moment it loads
 * (`syncLocale` in store/session.ts), and everyone who existed before this shipped carries `'ru'`
 * — so nobody who already uses Forma is ever asked. While the session is still booting, and when
 * a signed-in profile fails to load, the question is skipped and the ordinary guards take over:
 * the retry state belongs to RouteGuards, and a person staring at a language screen that will not
 * go away is the one outcome this must not have.
 */
function LanguageGate({ children }: { children: ReactElement }) {
  const chosen = useLocale((s) => s.chosen);
  const status = useSession((s) => s.status);
  if (!chosen && status === 'signed_out') return <LanguageScreen />;
  return children;
}

export function AppRoutes() {
  // Telegram's header back button follows the route; no-op on the open web.
  useTelegramBack();
  return (
    <LanguageGate>
      <Suspense fallback={<BootScreen />}>
        <Routes>
          <Route element={<FocusShell />}>
            <Route element={<RedirectIfAuthed />}>
              <Route path="/auth" element={<AuthScreen />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="/onboarding/*" element={<OnboardingScreen />} />
              {/*
               * The physical test, which used to be the last step of onboarding and is asked for
               * after a couple of workouts now. It is **here** rather than in the tabbed section
               * below, and that is load-bearing: a screen inside <AppShell> arrives on a transform
               * (`screen-in-*`), a transformed ancestor is a containing block, and the runner's
               * `position: fixed` panel then measures itself against that box instead of the
               * viewport — it lands at the top of the page with the tab bar drawn over it. Beside
               * onboarding it is full-screen, which is what a test asked for mid-session has to be.
               */}
              <Route path="/assessment" element={<LazyScreen name="AssessmentScreen" />} />
            </Route>
          </Route>
          <Route path="/duo/:token" element={<DuoInviteCapture />} />
          <Route element={<RequireAuth />}>
            <Route element={<RequireOnboarded />}>
              <Route element={<ShellWithPendingInvite />}>
                {/* «Курсы» is the main screen: `/` is the progress of every course there is. */}
                <Route index element={<LazyScreen name="CoursesScreen" />} />
                {/*
                 * `/courses` was that screen's own path for as long as it was the second tab. It is
                 * kept as a redirect rather than deleted: it is in the wild — in a Telegram deep
                 * link, in the owner's bookmarks, in a screenshot in a chat — and the bare path now
                 * means the same thing the index does.
                 */}
                <Route path="/courses" element={<Navigate to="/" replace />} />
                <Route path="/courses/:id" element={<LazyScreen name="CoursePathScreen" />} />
                <Route
                  path="/courses/:id/nodes/:nodeId"
                  element={<LazyScreen name="NodePreviewScreen" />}
                />
                <Route path="/play" element={<LazyScreen name="PlayerScreen" />} />
                <Route path="/assigned/:id" element={<LazyScreen name="CustomWorkoutScreen" />} />
                <Route path="/shared/:token" element={<LazyScreen name="CustomWorkoutScreen" />} />
                <Route path="/summary/:sessionId" element={<LazyScreen name="SummaryScreen" />} />
                {/*
                 * The catalogue of achievements, behind the rosette entry point in the header of «Курсы»:
                 * every achievement there is and the rule that earns it, taken or not.
                 */}
                <Route path="/achievements" element={<LazyScreen name="AchievementsScreen" />} />
                <Route path="/leaderboard" element={<LazyScreen name="LeaderboardScreen" />} />
                <Route path="/marathon" element={<LazyScreen name="MarathonScreen" />} />
                <Route path="/marathon/board" element={<LazyScreen name="MarathonBoardScreen" />} />
                <Route path="/duo" element={<LazyScreen name="DuoInviteScreen" />} />
                <Route path="/book" element={<LazyScreen name="BookScreen" />} />
                <Route path="/admin" element={<LazyScreen name="AdminScreen" />} />
                <Route path="/admin/workouts" element={<LazyScreen name="AdminWorkoutsScreen" />} />
                {/* The workout editor on its own address (`new` for a new one), so back leaves it. */}
                <Route
                  path="/admin/workouts/:id"
                  element={<LazyScreen name="AdminWorkoutsScreen" />}
                />
                <Route path="/admin/stats" element={<LazyScreen name="AdminStatsScreen" />} />
                <Route path="/admin/support" element={<LazyScreen name="AdminSupportScreen" />} />
                <Route path="/admin/bookings" element={<LazyScreen name="AdminBookingsScreen" />} />
                {/* One person, by the address (encodeURIComponent'd — see features/admin/person/path.ts). */}
                <Route
                  path="/admin/people/:email"
                  element={<LazyScreen name="AdminPersonScreen" />}
                />
                <Route
                  path="/admin/exercises"
                  element={<LazyScreen name="AdminExercisesScreen" />}
                />
                <Route path="/admin/courses" element={<LazyScreen name="AdminCoursesScreen" />} />
                <Route
                  path="/admin/courses/:id"
                  element={<LazyScreen name="AdminCourseScreen" />}
                />
                <Route
                  path="/admin/marathons"
                  element={<LazyScreen name="AdminMarathonsScreen" />}
                />
                <Route
                  path="/admin/marathons/:id"
                  element={<LazyScreen name="AdminMarathonScreen" />}
                />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </LanguageGate>
  );
}
