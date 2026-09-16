/**
 * Progress (docs/SPEC.md §10 flow 8) — the fourth tab, «Прогресс».
 *
 * The screen is built around one question — is this going anywhere — and the answer is figures,
 * in this order: the streak on a poster, the week as seven circles, what has been earned as a row
 * of circles, the one number still owed today with a ring, who is ahead this week, and then, only
 * for whoever asks for it, the whole record.
 *
 * It is drawn in the language of the owner's prototype (`design/ui_kits/app-v2`, «Ты»), after her
 * verdict on the tab that stood here — «сейчас ощущается как старый стиль … МИНИМУМ текста,
 * максимум визуала и дофамина». That tab was a row of 16px type over a list of tiles with two
 * lines of body each. This one has one word-sized line of type per figure; everything else is a
 * number, a circle or a ring. The charts stayed where they were, behind «Подробности»: a chart
 * answers a question you already had, and nobody arrives here with it.
 *
 * Everything derives from the progress store, so the screen shares one data load with Home.
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { findCourse } from '@/content/catalogue';
import { formatNumber } from '@/i18n/index';
import { STEPS_GOAL } from '@/lib/training/constants';
import { evaluateAchievements, levelForPoints } from '@/lib/training/levels';
import { useT } from '@/app/hooks/useT';
import { Badges } from '@/app/features/stats/Badges';
import { Poster } from '@/app/features/stats/Poster';
import { WeekDots } from '@/app/features/stats/WeekDots';
import { WeekBoard } from '@/app/features/leaderboard/WeekBoard';
import {
  personalRecords,
  pointsByWeek,
  stepsHistory,
  streakCalendar,
  totalCalories,
  userStatsFromProgress,
  weekActiveDays,
  weekLoad,
} from '@/app/features/stats/model';
import { RecordsList } from '@/app/features/stats/RecordsList';
import { Section } from '@/app/features/stats/Section';
import { LevelCard } from '@/app/features/stats/StatsCards';
import { PointsChart, StepsChart, WeeklyChart } from '@/app/features/stats/StatsCharts';
import { StreakCalendar } from '@/app/features/stats/StreakCalendar';
import { StepsRow } from '@/app/features/stats/StepsRow';
import { useSession } from '@/app/store/session';
import {
  useActiveCourseId,
  useProgress,
  useProgressLoader,
  useStepsToday,
  useStreak,
  useTodayIso,
  useTotalPoints,
} from '@/app/store/progress';

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-hidden="true">
      <Skeleton className="-mx-6 h-80 md:-mx-10" />
      <Skeleton rounded="control" className="h-20" />
      <Skeleton rounded="control" className="h-32" />
      <Skeleton rounded="control" className="h-20" />
    </div>
  );
}

export default function StatsScreen() {
  useProgressLoader();
  const { t, locale } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [details, setDetails] = useState(false);
  const status = useProgress((s) => s.status);
  const loading = useProgress((s) => s.loading);
  const error = useProgress((s) => s.error);
  const sessions = useProgress((s) => s.recentSessions);
  const logs = useProgress((s) => s.dailyLogs);
  const benchmarks = useProgress((s) => s.benchmarks);
  const totals = useProgress((s) => s.totals);
  const courseStates = useProgress((s) => s.courseStates);
  const profile = useSession((st) => st.profile);
  const user = useSession((st) => st.user);
  const today = useTodayIso();
  const totalPoints = useTotalPoints();
  const streak = useStreak();
  const activeCourseId = useActiveCourseId();

  const level = useMemo(() => levelForPoints(totalPoints), [totalPoints]);
  const week = useMemo(() => weekLoad(sessions, today), [sessions, today]);
  const weekDays = useMemo(() => weekActiveDays(sessions, logs, today), [sessions, logs, today]);
  const weeks = useMemo(() => pointsByWeek(sessions, logs, today), [sessions, logs, today]);
  const calendar = useMemo(() => streakCalendar(sessions, logs, today), [sessions, logs, today]);
  const steps = useMemo(() => stepsHistory(logs, today), [logs, today]);
  const stepsToday = useStepsToday();
  const records = useMemo(() => personalRecords(benchmarks, locale), [benchmarks, locale]);
  const stats = useMemo(
    () =>
      userStatsFromProgress({ totals, sessions, logs, benchmarks, courseStates, todayIso: today }),
    [totals, sessions, logs, benchmarks, courseStates, today],
  );
  const achievements = useMemo(() => evaluateAchievements(stats), [stats]);
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const calories = useMemo(() => totalCalories(sessions), [sessions]);
  /* The week's goal is the course's own rhythm; without a course there is no goal to hold up. */
  const weekGoal = activeCourseId ? (findCourse(activeCourseId)?.sessionsPerWeek ?? null) : null;

  const refresh = useCallback(async () => {
    await useProgress.getState().refresh();
    if (useProgress.getState().error) {
      toast.show({ kind: 'error', title: t('app.statsRefreshError') });
    }
  }, [toast, t]);

  /*
   * No title bar. The lit tab already says «Прогресс», and the poster's head carries the mark,
   * the level, the avatar and «Обновить» — everything a bar would have held, on the paper.
   */

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = <StatsSkeleton />;
  } else if (status === 'error') {
    body = (
      <EmptyState
        title={t('app.statsErrorTitle')}
        description={error?.code === 'network' ? t('common.errorOffline') : t('app.statsErrorBody')}
        action={
          <Button size="lg" loading={loading} onClick={() => void refresh()}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className="flex flex-col">
        <Poster
          streak={streak}
          level={level}
          workouts={stats.workouts}
          minutes={stats.totalMinutes}
          calories={calories}
          avatarSeed={profile?.avatarSeed ?? user?.id ?? ''}
          displayName={profile?.displayName ?? user?.email}
          loading={loading}
          onOpenProfile={() => navigate('/profile')}
          onRefresh={() => void refresh()}
        />

        {/*
         * The three mechanics that bring anybody back, in the prototype's order: the week you are
         * halfway through, the badges you have not taken yet, and the one number you owe today.
         * Then the week's table, which the prototype leaves to the challenge — but this table is
         * everyone's, not the challenge's, and it has no other home on a phone.
         */}
        <div className="flex flex-col gap-8 pt-7">
          <WeekDots days={weekDays} goal={weekGoal} />

          <section className="flex flex-col gap-4 border-t border-border pt-7">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="eyebrow">{t('app.statsAchievementsTitle')}</h2>
              <span className="eyebrow">
                {t('app.statsAchievementsCount', {
                  done: formatNumber(locale, unlocked),
                  total: formatNumber(locale, achievements.length),
                })}
              </span>
            </div>
            <Badges items={achievements} />
          </section>

          <StepsRow steps={stepsToday} goal={STEPS_GOAL} onOpen={() => navigate('/steps')} />

          <WeekBoard onOpenFull={() => navigate('/leaderboard')} />

          {/*
           * The whole record, behind one tap. Not a second screen: it is the same data the tab has
           * always carried, and somebody who wants the calendar wants it here rather than after a
           * navigation. Collapsed by default, because a chart is an answer to a question nobody
           * arrives with.
           */}
          <div className="border-t border-border pt-5">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-4.5"
              onClick={() => setDetails((v) => !v)}
            >
              {details ? t('app.statsDetailsHide') : t('app.statsDetailsShow')}
            </Button>
          </div>
          {/*
           * Opened, this is six figures deep — the longest stack in the app, and on a laptop the
           * last of them sits four screens below the button that opened it. Two across from `md`,
           * because each one is a small self-contained figure read on its own; the calendar keeps
           * the full width, as a year of squares in half a column is a different, worse object.
           * The all-time totals are not here any more: they are the poster's ruled line.
           *
           * `items-start`, or the grid would stretch a three-row list to the height of a chart.
           */}
          {details ? (
            <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-x-8">
              <Section title={t('app.statsWeekTitle')}>
                <WeeklyChart days={week} />
              </Section>
              <Section title={t('app.statsStepsTitle')}>
                <StepsChart points={steps} goal={STEPS_GOAL} />
              </Section>
              <div className="flex flex-col gap-7 border-t border-border pt-7 md:col-span-2">
                <PointsChart weeks={weeks} />
                <StreakCalendar weeks={calendar} streak={streak} />
              </div>
              <Section title={t('app.statsRecordsTitle')}>
                <RecordsList records={records} />
              </Section>
              <Section title={t('app.statsLevelTitle')}>
                <LevelCard points={totalPoints} level={level} />
              </Section>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return <Screen contentClassName="pt-0">{body}</Screen>;
}
