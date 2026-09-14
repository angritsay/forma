/**
 * Home (docs/SPEC.md §10 flow 3): today's session, today's tasks, and the coach.
 *
 * It used to be the whole product on one page — a swipeable deck of every course and the game, and
 * under it the resume strip, the streak, the week's figures, the coach's assigned workouts and his
 * bookable hour. Six sections, each a different size, none of them the answer to the only question
 * anybody opens this screen with: what am I doing today.
 *
 * So the deck moved to the programmes tab and the numbers to the reports tab, and what is left is
 * that answer. The greeting names the athlete, today's session is one full card, the tasks are a
 * ruled list that is usually one line long, and one button offers the coach himself — for the
 * people whose answer to "what am I doing today" is «покажи мне, как».
 *
 * The profile is here too, as the avatar in the top-right corner, because it left the tab bar
 * (BottomNav) to make room for the game. A photograph of your own face is the one control on a
 * phone nobody has ever had to look for.
 */
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { courseTitle } from '@/content/catalogue';
import { formatNumber } from '@/i18n/index';
import { STEPS_GOAL } from '@/lib/training/constants';
import { courseTileVars } from '@/lib/ui/tile';
import { PHOTOS } from '@/lib/media/photos';
import { useT } from '@/app/hooks/useT';
import { AssignedWorkoutsCard } from '@/app/features/customWorkout/AssignedWorkoutsCard';
import { buildDeck } from '@/app/features/programs/deck';
import { DeckCard } from '@/app/features/programs/DeckCard';
import { dayPart, GREETING_KEY, greetingName } from '@/app/features/home/greeting';
import { ResumeCard } from '@/app/features/home/ResumeCard';
import { TodayTasks, type TodayTask } from '@/app/features/home/TodayTasks';
import { assessmentPending, profileToDraft } from '@/app/features/profile/model';
import { saveDraft } from '@/app/screens/onboarding/draft';
import { useCatalogue } from '@/app/store/catalogue';
import {
  useActiveCourseId,
  useProgress,
  useProgressLoader,
  useStepsToday,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { BOOKING } from '@content/site/booking';

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-7 pt-5" aria-hidden="true">
      <Skeleton rounded="control" className="h-9 w-2/3" />
      <Skeleton rounded="control" className="-mx-6 h-[58dvh] min-h-[420px] lg:-mx-10" />
      <Skeleton rounded="control" className="h-24" />
    </div>
  );
}

export default function HomeScreen() {
  useProgressLoader();
  const { t, l, locale } = useT();
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
  const stepsToday = useStepsToday();
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

  /*
   * Today's session comes from the same deck the programmes tab is built from, so "the course Home
   * follows" is decided in exactly one place (`features/programs/deck.ts`) — Home just takes the
   * first owned course off the front of it.
   */
  const today = useMemo(() => {
    const entries = buildDeck({
      courses,
      entitlements,
      states: courseStates,
      marathons: [],
      activeCourseId,
    });
    return entries.find((e) => e.kind === 'course') ?? null;
  }, [courses, entitlements, courseStates, activeCourseId]);

  /*
   * The assessment postponed at sign-up («Не сейчас») comes back here, and it goes back into the
   * wizard with everything else prefilled — the same door the profile screen opens.
   */
  const takeAssessment = useCallback(() => {
    if (profile) {
      const draft = profileToDraft(profile, locale);
      if (draft) saveDraft(draft);
    }
    navigate('/onboarding?step=tests');
  }, [profile, locale, navigate]);

  const tasks = useMemo<TodayTask[]>(() => {
    const items: TodayTask[] = [];
    if (assessmentPending(profile)) {
      items.push({
        key: 'assess',
        label: t('app.homeTaskAssess'),
        hint: t('app.homeTaskAssessHint'),
        onOpen: takeAssessment,
      });
    }
    items.push({
      key: 'steps',
      label: t('app.homeTaskSteps'),
      hint:
        stepsToday > 0
          ? t('app.homeTodayStepsProgress', {
              steps: formatNumber(locale, stepsToday),
              goal: formatNumber(locale, STEPS_GOAL),
            })
          : undefined,
      done: stepsToday >= STEPS_GOAL,
      onOpen: () => navigate('/steps'),
    });
    return items;
  }, [profile, stepsToday, locale, t, navigate, takeAssessment]);

  const header = (
    <div className="flex items-center gap-3 pt-5">
      <h1 className="font-display min-w-0 flex-1 text-lg">{greeting}</h1>
      <IconButton
        label={t('app.homeRefresh')}
        icon={loading ? <Spinner size={16} /> : 'refresh'}
        variant="ghost"
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
    </div>
  );

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = <HomeSkeleton />;
  } else if (status === 'error') {
    body = (
      <EmptyState
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
    const course = today?.kind === 'course' ? today : null;
    const next = course?.next ?? null;
    /* A rest day or a milestone is read and ticked on the path; only a workout is "started". */
    const startable =
      next !== null &&
      (next.kind === 'workout' || next.kind === 'test' || next.kind === 'benchmark');
    body = (
      <div className="flex flex-col gap-7">
        <ResumeCard onResume={(path) => navigate(path)} />
        {course ? (
          <div className="-mx-6 h-[58dvh] max-h-[620px] min-h-[420px] lg:-mx-10">
            <DeckCard
              photo={PHOTOS.homeToday}
              priority
              style={courseTileVars(course.course.tile)}
              eyebrow={
                next
                  ? `${t('app.homeTodayEyebrow')} · ${t('app.homeTodayWeek', {
                      week: next.week,
                      day: next.day,
                    })}`
                  : `${t('app.homeTodayEyebrow')} · ${t('app.pathCompleted')}`
              }
              title={next ? l(next.title) : l(courseTitle(course.course))}
              lead={l(courseTitle(course.course))}
              ctaLabel={
                next === null
                  ? t('app.homeTodayOpenPath')
                  : startable
                    ? t('app.homeDeckStart')
                    : t('app.homeTodayOpen')
              }
              onCta={() =>
                next && startable
                  ? navigate(`/courses/${course.course.id}/nodes/${next.id}`)
                  : navigate(`/courses/${course.course.id}`)
              }
              onOpen={() => navigate(`/courses/${course.course.id}`)}
              openLabel={l(courseTitle(course.course))}
            />
          </div>
        ) : (
          <EmptyState
            title={t('app.homeTodayNoCourseTitle')}
            description={t('app.homeTodayNoCourseBody')}
            action={
              <Button size="lg" onClick={() => navigate('/courses')}>
                {t('app.homeTodayNoCourseCta')}
              </Button>
            }
          />
        )}
        {/*
         * The coach, as one button rather than as a card about him: an hour with Сергей is the one
         * product that uses his time, and the reason it sits under today's session is that the
         * moment somebody wants it is the moment they are looking at what they have to do.
         */}
        {BOOKING.enabled ? (
          <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/book')}>
            {t('app.homeCoachNow')}
          </Button>
        ) : null}
        <TodayTasks items={tasks} />
        <AssignedWorkoutsCard onOpen={(id) => navigate(`/assigned/${id}`)} />
      </div>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-7">
        {header}
        {body}
      </div>
    </Screen>
  );
}
