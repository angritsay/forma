/**
 * Home (docs/SPEC.md §10 flow 3): greeting, streak, the "Today" card for the active course,
 * weekly stats and the owned / locked course rows.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { COURSES } from '@/content/registry';
import { STEPS_GOAL } from '@/lib/training/constants';
import { useT } from '@/app/hooks/useT';
import { CourseMiniCard, CourseRow } from '@/app/features/home/CourseRow';
import { dayPart, GREETING_KEY, greetingName } from '@/app/features/home/greeting';
import { ResumeCard } from '@/app/features/home/ResumeCard';
import { StatsGrid } from '@/app/features/home/StatsGrid';
import { StreakCard } from '@/app/features/home/StreakCard';
import { TodayCard } from '@/app/features/home/TodayCard';
import { useTodayModel } from '@/app/features/home/useTodayModel';
import { courseProgress } from '@/app/features/path/nodeState';
import {
  useProgress,
  useProgressLoader,
  useStepsWeek,
  useStreak,
  useTotalPoints,
  useWeekStats,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-2" aria-hidden="true">
      <Skeleton rounded="card" className="h-28" />
      <Skeleton rounded="card" className="h-64" />
      <Skeleton rounded="card" className="h-52" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton rounded="card" className="h-24" />
        <Skeleton rounded="card" className="h-24" />
        <Skeleton rounded="card" className="h-24" />
      </div>
    </div>
  );
}

export default function HomeScreen() {
  useProgressLoader();
  const { t } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const entitlements = useSession((s) => s.entitlements);
  const status = useProgress((s) => s.status);
  const loading = useProgress((s) => s.loading);
  const error = useProgress((s) => s.error);
  const courseStates = useProgress((s) => s.courseStates);
  const streak = useStreak();
  const week = useWeekStats();
  const steps = useStepsWeek();
  const totalPoints = useTotalPoints();
  const today = useTodayModel();

  const name = greetingName(profile?.displayName, user?.email ?? '');
  const greeting = t(GREETING_KEY[dayPart(new Date().getHours())], { name });

  const refresh = useCallback(async () => {
    const [progressRes] = await Promise.allSettled([
      useProgress.getState().refresh(),
      useSession.getState().refreshEntitlements(),
    ]);
    if (progressRes.status === 'rejected' || useProgress.getState().error) {
      toast.show({ kind: 'error', title: t('app.homeRefreshError') });
    }
  }, [toast, t]);

  const owned = COURSES.filter((c) => entitlements.includes(c.id));
  const locked = COURSES.filter((c) => !entitlements.includes(c.id));

  const header = (
    <div className="flex h-16 items-center gap-3 px-5">
      <h1 className="font-display min-w-0 flex-1 truncate text-2xl leading-[1.3]">{greeting}</h1>
      <IconButton
        label={t('app.homeRefresh')}
        icon={loading ? <Spinner size={18} /> : 'refresh'}
        variant="ghost"
        disabled={loading}
        onClick={() => void refresh()}
      />
      <button
        type="button"
        aria-label={t('app.homeProfile')}
        onClick={() => navigate('/profile')}
        className="shrink-0 rounded-pill"
      >
        <Avatar
          seed={profile?.avatarSeed ?? user?.id ?? ''}
          name={profile?.displayName ?? user?.email}
          size={40}
        />
      </button>
    </div>
  );

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = <HomeSkeleton />;
  } else if (status === 'error') {
    body = (
      <EmptyState
        icon="warning"
        title={t('app.homeErrorTitle')}
        description={error?.code === 'network' ? t('common.errorOffline') : t('app.homeErrorBody')}
        action={
          <Button size="lg" onClick={() => void refresh()} loading={loading}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className="flex flex-col gap-5 py-2">
        <ResumeCard onResume={(path) => navigate(path)} />
        <StreakCard streak={streak} stepsGoal={STEPS_GOAL} onLogSteps={() => navigate('/steps')} />
        <TodayCard
          model={today}
          onStart={(courseId, nodeId) => navigate(`/courses/${courseId}/nodes/${nodeId}`)}
          onOpenPath={(courseId) => navigate(`/courses/${courseId}`)}
          onLogSteps={() => navigate('/steps')}
          onPickCourse={() => navigate('/courses')}
        />
        <StatsGrid week={week} steps={steps} totalPoints={totalPoints} stepsGoal={STEPS_GOAL} />
        {owned.length > 0 ? (
          <CourseRow title={t('app.homeYourCourses')}>
            {owned.map((course) => (
              <CourseMiniCard
                key={course.id}
                course={course}
                pct={courseProgress(course.nodes, courseStates[course.id]).pct}
                onOpen={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </CourseRow>
        ) : null}
        {locked.length > 0 ? (
          <CourseRow title={t('app.homeMoreCourses')}>
            {locked.map((course) => (
              <CourseMiniCard key={course.id} course={course} locked />
            ))}
          </CourseRow>
        ) : null}
      </div>
    );
  }

  return <Screen header={header}>{body}</Screen>;
}
