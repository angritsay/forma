/**
 * Home (docs/SPEC.md §10 flow 3): today's session, today's tasks, and the coach — on one screen,
 * without a scroll.
 *
 * It used to be the whole product on one page — a swipeable deck of every course and the challenge, and
 * under it the resume strip, the streak, the week's figures, the coach's assigned workouts and his
 * bookable hour. Six sections, each a different size, none of them the answer to the only question
 * anybody opens this screen with: what am I doing today.
 *
 * So the deck moved to the programmes tab and the numbers to «Прогресс», and what is left is that
 * answer — for the course *and* for the challenge. The greeting names the athlete, today's session is
 * one full card, the challenge is one row under it (blurred for somebody not playing, because a
 * spoiler is a truer invitation than an advertisement), and one button offers the coach himself,
 * for the people whose answer to "what am I doing today" is «покажи мне, как».
 *
 * The steps row went to «Прогресс» with the rest of the numbers. Home answers what to do now; how far
 * you walked is how you are doing.
 *
 * **Nothing scrolls.** The owner's line was «страница „Сегодня“ не должна скролиться вообще, то
 * есть вся информация должна быть структурирована таким образом, чтобы без скролла было всё
 * прекрасно сразу видно», and it changed the layout rather than the type size. The screen is a
 * column the exact height of the viewport: everything except today's card has the height its
 * content needs, and the card takes whatever is left (`min-h-0 flex-1`). Add a task row and the
 * card gives up the room; take it away and the card grows back. A fixed `58dvh` cover could not do
 * that — it was the reason the fold landed in the middle of the challenge row.
 *
 * The challenge sits directly under the card, not at the foot of the screen: «„челлендж идёт без
 * тебя“ — это очень стильно, но оно настолько внизу, что этого не видно».
 *
 * The account left. The streak, the level, the avatar and «Обновить» are on «Прогресс» now
 * (`features/stats/AccountRow`) — they answer «как у меня дела», and this screen answers «что у
 * меня сегодня». Giving up that row is most of what made the rest fit.
 */
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { courseTitle } from '@/content/catalogue';
import { courseTileVars } from '@/lib/ui/tile';
import { PHOTOS } from '@/lib/media/photos';
import { useT } from '@/app/hooks/useT';
import { AssignedWorkoutsCard } from '@/app/features/customWorkout/AssignedWorkoutsCard';
import { buildDeck } from '@/app/features/programs/deck';
import { DeckCard } from '@/app/features/programs/DeckCard';
import { GameToday } from '@/app/features/home/GameToday';
import { dayPart, GREETING_KEY, greetingName } from '@/app/features/home/greeting';
import { ResumeCard } from '@/app/features/home/ResumeCard';
import { TodayTasks, type TodayTask } from '@/app/features/home/TodayTasks';
import { useMarathonDay, useMyMarathons } from '@/app/features/marathon/useMarathon';
import { assessmentPending, profileToDraft } from '@/app/features/profile/model';
import { activeWorkoutPath, useActiveWorkoutStore } from '@/app/store/activeWorkout';
import { saveDraft } from '@/app/screens/onboarding/draft';
import { useCatalogue } from '@/app/store/catalogue';
import { useActiveCourseId, useProgress, useProgressLoader } from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { BOOKING } from '@content/site/booking';

function HomeSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" aria-hidden="true">
      <Skeleton rounded="card" className="min-h-0 flex-1" />
      <Skeleton rounded="control" className="h-16 shrink-0" />
      <Skeleton rounded="control" className="h-12 shrink-0" />
    </div>
  );
}

/**
 * What the middle of Home leads with.
 *
 * The screen has two independent sources for "is there anything to train today", and they can
 * disagree: the resume strip reads the **player store**, which is persisted in this browser, and
 * the course card reads the **deck**, which is built from the entitlements the server returns. A
 * session outlives its entitlement whenever the two part company — demo data reset under a live
 * session, a purchase refunded, an entitlement list that came back empty — and then the screen
 * said both «ТРЕНИРОВКА НЕ ЗАКОНЧЕНА … ПРОДОЛЖИТЬ» and «ВЫБЕРИ КУРС — и первая тренировка
 * появится здесь», one above the other. The owner caught it: «Это противоречие».
 *
 * It is a contradiction because the second sentence is false in the presence of the first. An
 * unfinished workout *is* today's training, whatever the entitlement list currently says, and the
 * athlete's own half-finished session is the last thing to argue with.
 *
 * So the invitation to pick a course is only ever shown when there is genuinely nothing: no course
 * and nothing left running. Deciding it here rather than in the JSX is what makes the two
 * impossible to render together — a `&&` in a template can be undone by anyone adding a branch.
 */
export function homeLead(hasCourse: boolean, hasResume: boolean): 'course' | 'resume' | 'choose' {
  if (hasCourse) return 'course';
  return hasResume ? 'resume' : 'choose';
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
  const courses = useCatalogue((s) => s.courses);
  /*
   * The challenge, from the server. Home shows the row whether or not there is one to show: with a
   * marathon it carries today's task, without one it carries the same row blurred.
   */
  const { marathon, status: gameStatus } = useMyMarathons();
  const { data: gameTasks } = useMarathonDay(marathon, marathon?.dayIndex ?? 0);

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
  /*
   * Whether the resume strip below will render anything. `ResumeCard` decides this for itself and
   * returns null, which is no use to a screen that has to avoid contradicting it — so the same
   * helper is read here. A string or null, never a fresh object, so the selector is stable.
   */
  const resumePath = useActiveWorkoutStore((s) =>
    activeWorkoutPath({ session: s.session, finishedAt: s.finishedAt }),
  );

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
    return items;
  }, [profile, t, takeAssessment]);

  /* The greeting, in the same header slot the other three tabs put their title in. */
  const header = (
    <div className="flex h-14 items-center gap-2 px-6">
      <h1 className="font-display min-w-0 flex-1 truncate text-base">{greeting}</h1>
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
    const lead = homeLead(course !== null, resumePath !== null);
    /* A rest day or a milestone is read and ticked on the path; only a workout is "started". */
    const startable =
      next !== null &&
      (next.kind === 'workout' || next.kind === 'test' || next.kind === 'benchmark');
    body = (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <ResumeCard onResume={(path) => navigate(path)} />
        {lead === 'course' && course ? (
          /*
           * The one flexible element on the screen. Everything else is as tall as its content, so
           * this is what absorbs a task row appearing or the coach button being switched off —
           * and `min-h-0` is what lets a flex child shrink below its content at all.
           */
          <div className="-mx-6 flex min-h-0 flex-1 overflow-hidden md:-mx-10">
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
        ) : lead === 'choose' ? (
          <EmptyState
            title={t('app.homeTodayNoCourseTitle')}
            description={t('app.homeTodayNoCourseBody')}
            action={
              <Button size="lg" onClick={() => navigate('/courses')}>
                {t('app.homeTodayNoCourseCta')}
              </Button>
            }
          />
        ) : null}
        {/*
         * The challenge, immediately under today's card. It used to sit below the coach button and
         * the task list, which on a phone put it under the fold — and «Челлендж идёт без тебя» is
         * an invitation that only works if it is seen.
         */}
        <GameToday
          marathon={marathon}
          settled={gameStatus !== 'loading'}
          tasks={gameTasks}
          onOpen={() => navigate('/marathon')}
        />
        <TodayTasks items={tasks} />
        <AssignedWorkoutsCard onOpen={(id) => navigate(`/assigned/${id}`)} />
        {/*
         * The coach, as one button rather than as a card about him: an hour with Сергей is the one
         * product that uses his time. It is last because it is the alternative to the screen, not
         * a part of it — everything above answers «что у меня сегодня», and this answers «покажи
         * мне, как» for the people the answer above did not reach.
         */}
        {BOOKING.enabled ? (
          <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/book')}>
            {t('app.homeCoachNow')}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    /*
     * `overflow-hidden` with the tab-bar inset as the only bottom padding, and the column inside
     * grows with `flex-1` rather than `h-full`. That distinction is the whole layout: `main` gets
     * its height from `flex-1` on a `min-h-dvh` parent, which is not a definite height, so a
     * percentage resolved against nothing and the column stopped at its content — 524px inside a
     * 787px box, with the card squeezed to 174px and a third of the screen left empty under it.
     */
    <Screen
      header={header}
      contentClassName="flex min-h-0 flex-col overflow-hidden pb-[calc(var(--nav-inset,0px)+var(--safe-bottom)+12px)]"
    >
      {body}
    </Screen>
  );
}
