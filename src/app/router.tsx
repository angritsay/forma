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
import { Suspense, useEffect, useRef, type ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { isNetworkError } from '@/lib/api/errors';
import { attachReferral } from '@/lib/api/referral';
import { AppShell, FocusShell } from './components/AppShell';
import { BootScreen } from './components/BootScreen';
import {
  RedirectIfAuthed,
  RedirectIfOnboarded,
  RequireAuth,
  RequireOnboarded,
} from './components/RouteGuards';
import { useTelegramBack } from './hooks/useTelegramBack';
import { useLocale } from './store/locale';
import { useSession } from './store/session';
import AuthScreen from './screens/AuthScreen';
import LanguageScreen from './screens/LanguageScreen';
import OnboardingScreen from './screens/onboarding/OnboardingScreen';
import { getScreen, type ScreenName } from './screens/registry';
import {
  clearReferral,
  pendingDuoInvite,
  pendingReferral,
  stashDuoInvite,
  stashReferral,
} from './features/marathon/duoInvite';
import { firstTrainableNode } from './features/courses/courseAccess';
import { consumeNext } from './features/entry/next';
import { findCourse } from '@/content/catalogue';
import { BOOKING } from '@content/site/booking';
import { BookingOff } from './features/coach/BookingOff';

function LazyScreen({ name }: { name: ScreenName }) {
  const Component = getScreen(name);
  return <Component />;
}

/**
 * `#/duo/<token>` — a friend's invite link, caught before any guard.
 *
 * Whoever opens it is often signed out or not through onboarding yet, and both of those detours
 * end somewhere else (`/` after onboarding). So the token is set aside in sessionStorage and the
 * link moves on to `/duo`, where it is accepted once the person is in; <PendingDuoInvite> brings
 * them back there from wherever the detours land.
 *
 * It goes to `/duo` rather than to a set-aside destination (features/entry/next.ts): the pending
 * invite overrides every screen in the shell anyway, and taking the destination here would only
 * throw it away.
 */
function DuoInviteCapture() {
  const { token } = useParams();
  stashDuoInvite(token);
  return <Navigate to="/duo" replace />;
}

/**
 * `#/ref/<code>` — a friend's referral link (0051), caught before any guard like the duo invite.
 *
 * The code goes to localStorage rather than the session: the person who opens it may sign up days
 * later. It is attached once they are in (<ShellWithPendingInvite>), and the link itself moves on
 * to wherever a guard had set aside (features/entry/next.ts), or to «Курсы» — there is no screen
 * to show for a code, only a fact to record.
 */
function ReferralCapture() {
  const { code } = useParams();
  const navigate = useNavigate();
  /*
   * In an effect with a ref rather than in render: `consumeNext()` removes what it reads, and a
   * render may run more than once — the second one would find nothing and send them to `/`.
   */
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    stashReferral(code);
    // A destination a guard set aside earlier in this tab still wins over the default.
    navigate(consumeNext() ?? '/', { replace: true });
  }, [code, navigate]);
  return null;
}

/**
 * `#/start` — «the first workout», the address the site's main button and the bot link to.
 *
 * It names an intent rather than a node id, so the site never has to know how the beginner course
 * is laid out: the first node that can actually be trained (`firstTrainableNode` — not `nodes[0]`,
 * which may be a rest day). Behind the same guards as the node screens, so a signed-out visitor is
 * sent through sign-in with `/start` set aside and comes back here. A catalogue without the
 * course (it cannot happen with the compiled content, but a lookup is a lookup) falls back to home.
 */
function StartRedirect() {
  const course = findCourse('start');
  const node = course ? firstTrainableNode(course) : null;
  return <Navigate to={node ? `/courses/start/nodes/${node.id}` : '/'} replace />;
}

/**
 * Attach the referral code set aside by `#/ref/<code>` or `?startapp=ref_<code>`, once the person
 * is signed in and through onboarding — which is exactly when this shell first renders.
 *
 * Once per launch, and cleared once the database has answered, whatever the answer: it answers
 * silently when the person already has a code or already paid, and loudly only for a malformed or
 * their own code — none of which is anything to show somebody who tapped a link and did not press
 * anything. Nothing is logged: a referral is who knows whom.
 *
 * **Except no answer at all.** A dropped connection is not the database saying no, and clearing
 * the code then lost the friend's +30 days for good. So a network failure keeps it set aside, and
 * the next launch tries again.
 */
function useAttachPendingReferral(): void {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const code = pendingReferral();
    if (!code) return;
    attachReferral(code)
      .then(() => clearReferral())
      .catch((e: unknown) => {
        if (!isNetworkError(e)) clearReferral();
      });
  }, []);
}

/** The tabbed shell — unless an invite is still set aside, which wins over whatever screen this was. */
function ShellWithPendingInvite() {
  const { pathname } = useLocation();
  useAttachPendingReferral();
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
  // A site button's `?lang=` already answered the question for this visit (features/entry).
  const hinted = useLocale((s) => s.hinted);
  const status = useSession((s) => s.status);
  if (!chosen && !hinted && status === 'signed_out') return <LanguageScreen />;
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
              <Route element={<RedirectIfOnboarded />}>
                <Route path="/onboarding/*" element={<OnboardingScreen />} />
              </Route>
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
              {/*
               * The onboarding stories replayed («Как это работает» in the account sheet). Here
               * for the same reason as the test above: the player is a `fixed` full-screen
               * surface and must not sit under a transformed ancestor.
               */}
              <Route path="/intro" element={<LazyScreen name="IntroScreen" />} />
            </Route>
          </Route>
          <Route path="/duo/:token" element={<DuoInviteCapture />} />
          <Route path="/ref/:code" element={<ReferralCapture />} />
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
                {/* «The first workout» by intent; see <StartRedirect>. */}
                <Route path="/start" element={<StartRedirect />} />
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
                {/* «Позови друга» — the referral link and what it has brought (0051). */}
                <Route path="/invite" element={<LazyScreen name="ClubInviteScreen" />} />
                {/* Booking switched off (`BOOKING.enabled`): the address stays, the offer does not. */}
                <Route
                  path="/book"
                  element={BOOKING.enabled ? <LazyScreen name="BookScreen" /> : <BookingOff />}
                />
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
                <Route path="/admin/media" element={<LazyScreen name="AdminMediaScreen" />} />
                {/* «Студия» (0060): sources and clips; the cutter. The grader is /admin/studio/grade. */}
                <Route path="/admin/studio" element={<LazyScreen name="AdminStudioScreen" />} />
                <Route
                  path="/admin/studio/cut"
                  element={<LazyScreen name="AdminStudioCutScreen" />}
                />
                {/* «Студия» → colour and frame: the clip grid, and one clip in the editor (0060). */}
                <Route
                  path="/admin/studio/grade"
                  element={<LazyScreen name="AdminStudioGradeScreen" />}
                />
                <Route
                  path="/admin/studio/grade/:clipId"
                  element={<LazyScreen name="AdminStudioGradeScreen" />}
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
