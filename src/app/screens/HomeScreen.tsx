/**
 * Home (docs/SPEC.md §10 flow 3): the photograph of today's session with the wordmark over it,
 * the streak, weekly stats, the coach's bookable hour, and the owned / locked course rows.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { STEPS_GOAL } from '@/lib/training/constants';
import { useT } from '@/app/hooks/useT';
import { AssignedWorkoutsCard } from '@/app/features/customWorkout/AssignedWorkoutsCard';
import { BookCard } from '@/app/features/home/BookCard';
import { CourseMiniCard, CourseRow } from '@/app/features/home/CourseRow';
import { dayPart, GREETING_KEY, greetingName } from '@/app/features/home/greeting';
import { ResumeCard } from '@/app/features/home/ResumeCard';
import { StatsGrid } from '@/app/features/home/StatsGrid';
import { StreakCard } from '@/app/features/home/StreakCard';
import { TodayCard } from '@/app/features/home/TodayCard';
import { useTodayModel } from '@/app/features/home/useTodayModel';
import { courseProgress } from '@/app/features/path/nodeState';
import { useCatalogue } from '@/app/store/catalogue';
import {
  useProgress,
  useProgressLoader,
  useStepsWeek,
  useStreak,
  useTotalPoints,
  useWeekStats,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { BOOKING } from '@content/site/booking';

function HomeSkeleton() {
  /*
   * The skeleton mirrors the real rhythm: the full-bleed photograph, the button under it, the
   * three facts on a rule, then the rows. Square corners, because nothing it stands in for is
   * rounded any more.
   */
  return (
    <div className="flex flex-col" aria-hidden="true">
      <Skeleton
        rounded="control"
        className="-mx-5 h-[52dvh] max-h-[640px] min-h-[420px] lg:-mx-8"
      />
      <Skeleton rounded="control" className="mt-5 h-14" />
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Skeleton rounded="control" className="h-12" />
        <Skeleton rounded="control" className="h-12" />
        <Skeleton rounded="control" className="h-12" />
      </div>
      <Skeleton rounded="control" className="mt-6 h-32" />
    </div>
  );
}

/** "01–04" for a list of four — the range marker set opposite an index heading. */
function indexRange(count: number): string {
  return count > 1 ? `01–${String(count).padStart(2, '0')}` : '01';
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
  const courses = useCatalogue((s) => s.courses);

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

  const owned = courses.filter((c) => entitlements.includes(c.id));
  const locked = courses.filter((c) => !entitlements.includes(c.id));

  /*
   * The app's two controls — refresh and profile — ride in the top-right corner of the photograph
   * as ink plates, next to the wordmark on the left; there is no bar. The greeting moved from the
   * bar into the headline block as its kicker, so the person is still addressed by name.
   */
  const chrome = (
    <>
      <IconButton
        label={t('app.homeRefresh')}
        icon={loading ? <Spinner size={16} /> : 'refresh'}
        variant="on-art"
        size="sm"
        disabled={loading}
        onClick={() => void refresh()}
      />
      <button
        type="button"
        aria-label={t('app.homeProfile')}
        onClick={() => navigate('/profile')}
        className="tap-target shrink-0 rounded-control"
      >
        <Avatar
          seed={profile?.avatarSeed ?? user?.id ?? ''}
          name={profile?.displayName ?? user?.email}
          size={36}
        />
      </button>
    </>
  );

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = <HomeSkeleton />;
  } else if (status === 'error') {
    body = (
      <>
        <div className="flex items-center gap-3 py-4">
          <Logo className="text-[15px]" />
          <span className="flex-1" />
          {chrome}
        </div>
        <EmptyState
          title={t('app.homeErrorTitle')}
          description={
            error?.code === 'network' ? t('common.errorOffline') : t('app.homeErrorBody')
          }
          action={
            <Button size="lg" onClick={() => void refresh()} loading={loading}>
              {t('common.retry')}
            </Button>
          }
        />
      </>
    );
  } else {
    /*
     * No gap on the stack: every section below draws its own top hairline and owns the space
     * above it, so a container gap would double the rhythm and break the ruled column the page
     * is built on. The photograph is the one exception — it bleeds and carries no rule.
     */
    body = (
      <div className="flex flex-col">
        <TodayCard
          model={today}
          eyebrow={greeting}
          chrome={chrome}
          onStart={(courseId, nodeId) => navigate(`/courses/${courseId}/nodes/${nodeId}`)}
          onOpenPath={(courseId) => navigate(`/courses/${courseId}`)}
          onLogSteps={() => navigate('/steps')}
          onPickCourse={() => navigate('/courses')}
        />
        <ResumeCard onResume={(path) => navigate(path)} />
        <StreakCard streak={streak} stepsGoal={STEPS_GOAL} onLogSteps={() => navigate('/steps')} />
        <StatsGrid week={week} steps={steps} totalPoints={totalPoints} stepsGoal={STEPS_GOAL} />
        <AssignedWorkoutsCard onOpen={(id) => navigate(`/assigned/${id}`)} />
        {BOOKING.enabled ? <BookCard onOpen={() => navigate('/book')} /> : null}
        {owned.length > 0 ? (
          <CourseRow title={t('app.homeYourCourses')} index={indexRange(owned.length)}>
            {owned.map((course, i) => (
              <CourseMiniCard
                key={course.id}
                course={course}
                n={i + 1}
                pct={courseProgress(course.nodes, courseStates[course.id]).pct}
                onOpen={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </CourseRow>
        ) : null}
        {locked.length > 0 ? (
          <CourseRow title={t('app.homeMoreCourses')} index={indexRange(locked.length)}>
            {locked.map((course, i) => (
              <CourseMiniCard key={course.id} course={course} n={i + 1} locked />
            ))}
          </CourseRow>
        ) : null}
      </div>
    );
  }

  return <Screen>{body}</Screen>;
}
