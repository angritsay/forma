/**
 * App routes (docs/SPEC.md §9). Auth and onboarding live outside the tabbed shell; everything
 * else renders inside <AppShell> behind RequireAuth → RequireOnboarded.
 *
 * Three tabs sit on `/` («Курсы»), `/marathon` («Клуб») and `/book` («Тренер»), with `/admin` as a
 * fourth seat for whoever has the panel. The paths kept the names they were built with: the words
 * on the bar changed, the URLs did not, so nothing that was ever linked or bookmarked broke.
 *
 * Inside a Telegram Mini App the same routes also drive Telegram's own back button.
 */
import { Suspense } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { AppShell, FocusShell } from './components/AppShell';
import { BootScreen } from './components/BootScreen';
import { RedirectIfAuthed, RequireAuth, RequireOnboarded } from './components/RouteGuards';
import { TopBar } from './components/TopBar';
import { useT } from './hooks/useT';
import { useTelegramBack } from './hooks/useTelegramBack';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/onboarding/OnboardingScreen';
import { getScreen, type ScreenName } from './screens/registry';

function MissingScreen({ name }: { name: ScreenName }) {
  const { t } = useT();
  const navigate = useNavigate();
  return (
    <Screen header={<TopBar back title={name.replace(/Screen$/, '')} />}>
      <EmptyState
        icon="info"
        title={t('app.errorScreenMissingTitle')}
        description={t('app.errorScreenMissingBody')}
        action={<Button onClick={() => navigate('/')}>{t('app.tabCourses')}</Button>}
      />
    </Screen>
  );
}

function LazyScreen({ name }: { name: ScreenName }) {
  const Component = getScreen(name);
  if (!Component) return <MissingScreen name={name} />;
  return <Component />;
}

export function AppRoutes() {
  // Telegram's header back button follows the route; no-op on the open web.
  useTelegramBack();
  return (
    <Suspense fallback={<BootScreen />}>
      <Routes>
        <Route element={<FocusShell />}>
          <Route element={<RedirectIfAuthed />}>
            <Route path="/auth" element={<AuthScreen />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route path="/onboarding/*" element={<OnboardingScreen />} />
          </Route>
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<RequireOnboarded />}>
            <Route element={<AppShell />}>
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
               * The catalogue of achievements, behind the 🏅 entry point in the header of «Курсы»:
               * every achievement there is and the rule that earns it, taken or not.
               */}
              <Route path="/achievements" element={<LazyScreen name="AchievementsScreen" />} />
              {/*
               * The physical test, which used to be the last step of onboarding and is now asked
               * for after a couple of workouts. Its module lands on another branch; until it does,
               * `getScreen` returns null here and the route renders the localized "not available"
               * state rather than breaking the build — which is what the registry's glob is for.
               */}
              <Route path="/assessment" element={<LazyScreen name="AssessmentScreen" />} />
              <Route path="/leaderboard" element={<LazyScreen name="LeaderboardScreen" />} />
              <Route path="/steps" element={<LazyScreen name="StepsScreen" />} />
              <Route path="/marathon" element={<LazyScreen name="MarathonScreen" />} />
              <Route path="/marathon/board" element={<LazyScreen name="MarathonBoardScreen" />} />
              <Route path="/book" element={<LazyScreen name="BookScreen" />} />
              <Route path="/admin" element={<LazyScreen name="AdminScreen" />} />
              <Route path="/admin/workouts" element={<LazyScreen name="AdminWorkoutsScreen" />} />
              <Route path="/admin/exercises" element={<LazyScreen name="AdminExercisesScreen" />} />
              <Route path="/admin/courses" element={<LazyScreen name="AdminCoursesScreen" />} />
              <Route path="/admin/courses/:id" element={<LazyScreen name="AdminCourseScreen" />} />
              <Route path="/admin/marathons" element={<LazyScreen name="AdminMarathonsScreen" />} />
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
  );
}
