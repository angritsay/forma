/**
 * App routes (docs/SPEC.md §9). Auth and onboarding live outside the tabbed shell; everything
 * else renders inside <AppShell> behind RequireAuth → RequireOnboarded.
 */
import { Suspense } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { AppShell } from './components/AppShell';
import { BootScreen } from './components/BootScreen';
import { RedirectIfAuthed, RequireAuth, RequireOnboarded } from './components/RouteGuards';
import { TopBar } from './components/TopBar';
import { useT } from './hooks/useT';
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
        action={<Button onClick={() => navigate('/')}>{t('app.tabHome')}</Button>}
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
  return (
    <Suspense fallback={<BootScreen />}>
      <Routes>
        <Route element={<RedirectIfAuthed />}>
          <Route path="/auth" element={<AuthScreen />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/onboarding/*" element={<OnboardingScreen />} />
          <Route element={<RequireOnboarded />}>
            <Route element={<AppShell />}>
              <Route index element={<LazyScreen name="HomeScreen" />} />
              <Route path="/courses" element={<LazyScreen name="CoursesScreen" />} />
              <Route path="/courses/:id" element={<LazyScreen name="CoursePathScreen" />} />
              <Route
                path="/courses/:id/nodes/:nodeId"
                element={<LazyScreen name="NodePreviewScreen" />}
              />
              <Route path="/play" element={<LazyScreen name="PlayerScreen" />} />
              <Route path="/summary/:sessionId" element={<LazyScreen name="SummaryScreen" />} />
              <Route path="/stats" element={<LazyScreen name="StatsScreen" />} />
              <Route path="/leaderboard" element={<LazyScreen name="LeaderboardScreen" />} />
              <Route path="/steps" element={<LazyScreen name="StepsScreen" />} />
              <Route path="/profile" element={<LazyScreen name="ProfileScreen" />} />
              <Route path="/admin" element={<LazyScreen name="AdminScreen" />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
