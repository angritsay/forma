/**
 * «Курсы» — the main screen (docs/SPEC.md §9, §10 flow 3).
 *
 * «Измени архитектуру приложения на три вкладки — курсы, клуб, тренер. Курсы это прогресс по всем
 * курсам которые есть.»
 *
 * So this is a progress screen that happens to list courses, and not a catalogue. It stands where
 * «Сегодня» stood — `/`, the first thing the app opens on — and it answers both questions that
 * screen and the «Программы» tab used to answer between them: what am I doing, and how far through
 * it am I. One card per course, and the card is the figure.
 *
 * At the top, small: the greeting, the avatar, and the streak and the achievements as two entry
 * points («Профиль и все ачивки убирай. Они должны быть на главном экране в виде маленьких энтри
 * поинтов»). The avatar opens the account as a sheet — what is left of the profile screen — and
 * the achievements open their catalogue. Neither is a section of this screen; both are one tap
 * from it and out of the way until asked for.
 *
 * **One workout button, always.** «Не может быть такого состояния что и продолжить тренировку и
 * начать курс. На главном экране всегда должна быть только одна кнопка тренировки.» When a session
 * is open, `resumeCard()` says so, and the course it belongs to carries the resume button while
 * every other course offers its path instead of a start. The rule is derived in exactly one place;
 * this screen reads it and never re-decides it.
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { courseTitle } from '@/content/catalogue';
import { LIVE_COURSES } from '@/content/registry';
import { formatNumber } from '@/i18n/index';
import { PHOTOS, type Photo } from '@/lib/media/photos';
import { evaluateAchievements } from '@/lib/training/levels';
import { courseTileVars } from '@/lib/ui/tile';
import { useT } from '@/app/hooks/useT';
import { CourseCard } from '@/app/features/courses/CourseCard';
import { courseLandingHref } from '@/app/features/courses/courseMeta';
import { buildDeck } from '@/app/features/courses/deck';
import { HeadEntries } from '@/app/features/courses/HeadEntries';
import { dayPart, GREETING_KEY, greetingName } from '@/app/features/home/greeting';
import { resumeCard } from '@/app/features/home/resumeModel';
import { ProfileSheet } from '@/app/features/profile/ProfileSheet';
import { userStatsFromProgress } from '@/app/features/stats/model';
import { useActiveWorkoutStore } from '@/app/store/activeWorkout';
import { useCatalogue } from '@/app/store/catalogue';
import {
  useActiveCourseId,
  useProgress,
  useProgressLoader,
  useStreak,
  useTodayIso,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';

/**
 * Which photograph a course card gets when the course has no cover of its own.
 *
 * The coach's own frame leads, because the first card is the one an athlete sees every morning.
 * The rest rotate through what the library has, by position rather than by id, so two cards next
 * to each other are never the same picture — and while those are still un-vendored stock URLs,
 * <CourseCard> ignores them and paints the course's colour instead.
 */
const DECK_PHOTOS: readonly Photo[] = [
  PHOTOS.homeToday,
  PHOTOS.coursePath,
  PHOTOS.stats,
  PHOTOS.profile,
  PHOTOS.exercise,
];

/** The courses with a page on the site — the only ones a «Подробнее» can lead anywhere. */
const HAS_PAGE = new Set(LIVE_COURSES.map((c) => c.id));

function CoursesSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton rounded="card" className="h-[360px]" />
      <Skeleton rounded="card" className="h-[360px]" />
    </div>
  );
}

export default function CoursesScreen() {
  useProgressLoader();
  const { t, l, locale } = useT();
  const navigate = useNavigate();
  const [account, setAccount] = useState(false);
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const entitlements = useSession((s) => s.entitlements);
  const status = useProgress((s) => s.status);
  const loading = useProgress((s) => s.loading);
  const error = useProgress((s) => s.error);
  const courseStates = useProgress((s) => s.courseStates);
  const sessions = useProgress((s) => s.recentSessions);
  const logs = useProgress((s) => s.dailyLogs);
  const benchmarks = useProgress((s) => s.benchmarks);
  const totals = useProgress((s) => s.totals);
  const activeCourseId = useActiveCourseId();
  const courses = useCatalogue((s) => s.courses);
  const streak = useStreak();
  const today = useTodayIso();

  const name = greetingName(profile?.displayName, user?.email ?? '');
  const greeting = t(GREETING_KEY[dayPart(new Date().getHours())], { name });

  /*
   * The player store, field by field rather than as a derived object: zustand compares a
   * selector's result by identity, and `resumeCard(...)` built inside a selector is a fresh object
   * on every store touch, which re-renders this screen on every tick of the player's clock.
   */
  const resumeSession = useActiveWorkoutStore((s) => s.session);
  const resumeFinishedAt = useActiveWorkoutStore((s) => s.finishedAt);
  const resumeSteps = useActiveWorkoutStore((s) => s.steps);
  const resumeStepIndex = useActiveWorkoutStore((s) => s.stepIndex);
  const resume = useMemo(
    () =>
      resumeCard(
        {
          session: resumeSession,
          finishedAt: resumeFinishedAt,
          steps: resumeSteps,
          stepIndex: resumeStepIndex,
        },
        t,
        locale,
      ),
    [resumeSession, resumeFinishedAt, resumeSteps, resumeStepIndex, t, locale],
  );

  const achievements = useMemo(
    () =>
      evaluateAchievements(
        userStatsFromProgress({
          totals,
          sessions,
          logs,
          benchmarks,
          courseStates,
          todayIso: today,
        }),
      ),
    [totals, sessions, logs, benchmarks, courseStates, today],
  );
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const entries = useMemo(
    () =>
      buildDeck({ courses, entitlements, states: courseStates, activeCourseId }).filter(
        // A course that is neither owned nor on sale has nothing to show and nowhere to lead.
        (entry) => entry.kind !== 'locked' || HAS_PAGE.has(entry.course.id),
      ),
    [courses, entitlements, courseStates, activeCourseId],
  );

  const refresh = useCallback(async () => {
    await Promise.allSettled([
      useProgress.getState().refresh(),
      useSession.getState().refreshEntitlements(),
    ]);
  }, []);

  /* The greeting and the account, in the slot every tab puts its title in. */
  const header = (
    <div className="flex h-14 items-center gap-3 px-6 md:px-10">
      <h1 className="font-display min-w-0 flex-1 truncate text-base">{greeting}</h1>
      {/* Hidden from `md`: the top row carries the same avatar opening the same sheet, and two of
          them on one screen is one account in two places. */}
      <button
        type="button"
        aria-label={t('app.profileTitle')}
        onClick={() => setAccount(true)}
        className="tap-target shrink-0 rounded-pill transition-opacity duration-150 ease-(--ease-out) hover:opacity-80 md:hidden"
      >
        <Avatar
          seed={profile?.avatarSeed ?? user?.id ?? ''}
          name={profile?.displayName ?? user?.email}
          size={32}
        />
      </button>
    </div>
  );

  let body: React.ReactNode;
  if (status === 'idle' || status === 'loading') {
    body = <CoursesSkeleton />;
  } else if (status === 'error') {
    body = (
      <EmptyState
        title={t('app.homeErrorTitle')}
        description={error?.code === 'network' ? t('common.errorOffline') : t('app.homeErrorBody')}
        action={
          <Button size="lg" loading={loading} onClick={() => void refresh()}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else if (entries.length === 0) {
    body = (
      <EmptyState
        title={t('app.homeTodayNoCourseTitle')}
        description={t('app.homeTodayNoCourseBody')}
        action={
          <Button size="lg" onClick={() => void refresh()}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else {
    /*
     * The unfinished session, when it belongs to a course that is not on this screen — an
     * entitlement that lapsed under a running session, demo data reset, a refund. It is still the
     * only workout button on the screen, so it stands on its own above the cards rather than
     * disappearing with the card that would have carried it.
     */
    const orphanResume =
      resume !== null &&
      !entries.some((e) => e.kind === 'course' && e.course.id === resume.courseId);
    body = (
      <div className="flex flex-col gap-4">
        {orphanResume && resume ? (
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate(resume.path)}
            iconRight={<Glyph size={14}>→</Glyph>}
          >
            {t(resume.ctaKey)}
          </Button>
        ) : null}
        {/*
         * Two across from `md`. A card is a fixed object, not a block of text: stretched to 680px
         * it becomes a banner with a cover band 380px tall, and the screen's question — how far am
         * I through each of these — is answered by seeing them at once rather than by seeing one
         * of them larger. `items-start`, or the grid would stretch a card with no figure on it to
         * the height of one that has it.
         */}
        <ul className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start">
          {entries.map((entry, i) => {
            const photo = DECK_PHOTOS[i % DECK_PHOTOS.length]!;
            const priority = i === 0;
            const { course } = entry;
            const title = l(courseTitle(course));

            if (entry.kind === 'locked') {
              return (
                <li key={entry.key}>
                  <CourseCard
                    cover={course.cover}
                    photo={photo}
                    priority={priority}
                    dimmed
                    style={courseTileVars(course.tile)}
                    title={title}
                    /* «Подробнее», and it leaves for the course's own page. It used to say
                       «Прийти» or «Курс закрыт» — neither of which says what happens next. */
                    ctaLabel={t('app.coursesMore')}
                    ctaHref={courseLandingHref(locale, course)}
                    openLabel={`${title} — ${t('app.coursesMore')}`}
                  />
                </li>
              );
            }

            const { progress, next } = entry;
            const resuming = resume !== null && resume.courseId === course.id;
            /* A rest day or a milestone is read and ticked on the path; only a workout is started. */
            const startable =
              next !== null &&
              (next.kind === 'workout' || next.kind === 'test' || next.kind === 'benchmark');
            /* The one workout button on the screen belongs to the session already running; every
               other course offers its path until that session is finished or saved. */
            const offersWorkout = resume === null && startable;
            return (
              <li key={entry.key}>
                <CourseCard
                  cover={course.cover}
                  photo={photo}
                  priority={priority}
                  style={courseTileVars(course.tile)}
                  title={title}
                  pct={progress.pct}
                  progressMeta={`${formatNumber(locale, progress.done)}/${formatNumber(
                    locale,
                    progress.total,
                  )}`}
                  subtitle={
                    resuming
                      ? t(resume.eyebrowKey)
                      : next
                        ? t('app.homeTodayWeek', { week: next.week, day: next.day })
                        : t('app.pathCompleted')
                  }
                  ctaLabel={
                    resuming
                      ? t(resume.ctaKey)
                      : offersWorkout
                        ? progress.done > 0
                          ? t('app.homeDeckContinue')
                          : t('app.homeDeckStart')
                        : t('app.homeTodayOpenPath')
                  }
                  onCta={() => {
                    if (resuming) return navigate(resume.path);
                    if (offersWorkout && next) {
                      return navigate(`/courses/${course.id}/nodes/${next.id}`);
                    }
                    navigate(`/courses/${course.id}`);
                  }}
                  onOpen={() => navigate(`/courses/${course.id}`)}
                  openLabel={title}
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <Screen header={header} contentClassName="pt-2">
      <div className="flex flex-col gap-5">
        <HeadEntries streak={streak.current} unlocked={unlocked} total={achievements.length} />
        {body}
      </div>
      <ProfileSheet open={account} onClose={() => setAccount(false)} />
    </Screen>
  );
}
