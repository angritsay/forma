/**
 * Home (docs/SPEC.md §10 flow 3): the deck of everything the athlete is in — a card per course,
 * per marathon, per course not yet bought — and under it the streak, the week's numbers, the
 * coach's bookable hour and whatever he has assigned by hand.
 *
 * The screen used to open on one photograph: today's session of the single course Home was
 * following, with the other courses as ruled rows further down and the marathon as a strip between
 * them. Three things a person might be doing, drawn at three different sizes. The deck makes them
 * peers and lets the athlete choose by swiping, which is the gesture the shape already implies.
 */
import { useCallback, useMemo } from 'react';
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
import { buildDeck } from '@/app/features/home/deck';
import { HomeDeck } from '@/app/features/home/HomeDeck';
import { dayPart, GREETING_KEY, greetingName } from '@/app/features/home/greeting';
import { ResumeCard } from '@/app/features/home/ResumeCard';
import { StatsGrid } from '@/app/features/home/StatsGrid';
import { StreakCard } from '@/app/features/home/StreakCard';
import { useMarathonDay, useMyMarathons } from '@/app/features/marathon/useMarathon';
import { useCatalogue } from '@/app/store/catalogue';
import {
  useActiveCourseId,
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
   * The skeleton mirrors the real rhythm: the full-bleed card the height of the deck, the pager
   * under it, then the ruled sections. Square corners, because nothing it stands in for is
   * rounded any more.
   */
  return (
    <div className="flex flex-col" aria-hidden="true">
      <Skeleton
        rounded="control"
        className="-mx-5 h-[74dvh] max-h-[760px] min-h-[520px] lg:-mx-8"
      />
      <div className="mt-4 flex justify-center gap-2">
        <Skeleton rounded="control" className="h-0.5 w-7" />
        <Skeleton rounded="control" className="h-0.5 w-7" />
      </div>
      <Skeleton rounded="control" className="mt-6 h-32" />
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
  const activeCourseId = useActiveCourseId();
  const streak = useStreak();
  const week = useWeekStats();
  const steps = useStepsWeek();
  const totalPoints = useTotalPoints();
  const courses = useCatalogue((s) => s.courses);
  // A marathon that fails to load leaves the deck to the courses; it never blocks the screen.
  const { data: marathons, marathon } = useMyMarathons();
  const { data: todayTasks } = useMarathonDay(marathon, marathon?.dayIndex ?? 0);

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

  const entries = useMemo(
    () => buildDeck({ courses, entitlements, states: courseStates, marathons, activeCourseId }),
    [courses, entitlements, courseStates, marathons, activeCourseId],
  );

  /*
   * Today's open tasks, for the marathon card's one line. A task with no rule is an announcement
   * rather than something to do, and `mine` means the proof is already sent.
   */
  const openTasks = useMemo(() => {
    if (!marathon || todayTasks.length === 0) return undefined;
    const left = todayTasks.filter((item) => item.task.rule !== 'none' && !item.mine).length;
    return { [marathon.id]: left };
  }, [marathon, todayTasks]);

  /*
   * The app's two controls — refresh and profile — ride in the top-right corner of the deck as ink
   * plates, next to the wordmark on the left; there is no bar. They sit over the deck rather than
   * inside a card, so swiping does not move them.
   */
  const chrome = (
    <>
      <Logo className="text-[15px]" />
      <span className="min-w-0 flex-1" />
      <span className="eyebrow truncate text-paper/70">{greeting}</span>
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
          <IconButton
            label={t('app.homeRefresh')}
            icon={loading ? <Spinner size={16} /> : 'refresh'}
            size="sm"
            disabled={loading}
            onClick={() => void refresh()}
          />
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
  } else if (entries.length === 0) {
    /* Nothing owned and nothing on sale — the catalogue has not loaded, or it is empty. */
    body = (
      <>
        <div className="flex items-center gap-3 py-4">
          <Logo className="text-[15px]" />
          <span className="flex-1" />
          <IconButton
            label={t('app.homeRefresh')}
            icon={loading ? <Spinner size={16} /> : 'refresh'}
            size="sm"
            disabled={loading}
            onClick={() => void refresh()}
          />
        </div>
        <EmptyState
          title={t('app.homeTodayNoCourseTitle')}
          description={t('app.homeTodayNoCourseBody')}
          action={
            <Button size="lg" onClick={() => navigate('/courses')}>
              {t('app.homeTodayNoCourseCta')}
            </Button>
          }
        />
      </>
    );
  } else {
    /*
     * No gap on the stack: every section below the deck draws its own top hairline and owns the
     * space above it, so a container gap would double the rhythm and break the ruled column the
     * page is built on.
     */
    body = (
      <div className="flex flex-col">
        <HomeDeck
          entries={entries}
          openTasks={openTasks}
          chrome={chrome}
          onOpenCourse={(courseId) => navigate(`/courses/${courseId}`)}
          onStartNode={(courseId, nodeId) => navigate(`/courses/${courseId}/nodes/${nodeId}`)}
          onOpenMarathon={() => navigate('/marathon')}
        />
        <ResumeCard onResume={(path) => navigate(path)} />
        <StreakCard streak={streak} stepsGoal={STEPS_GOAL} onLogSteps={() => navigate('/steps')} />
        <StatsGrid week={week} steps={steps} totalPoints={totalPoints} stepsGoal={STEPS_GOAL} />
        <AssignedWorkoutsCard onOpen={(id) => navigate(`/assigned/${id}`)} />
        {BOOKING.enabled ? <BookCard onOpen={() => navigate('/book')} /> : null}
      </div>
    );
  }

  return <Screen>{body}</Screen>;
}
