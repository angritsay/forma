/**
 * Progress (docs/SPEC.md §10 flow 8) — the fourth tab, «Прогресс».
 *
 * The screen is built around one question — is this going anywhere — and the answer is four
 * things, in this order: the streak, what has been earned, who is ahead this week, and then, only
 * for whoever asks for it, the whole record.
 *
 * It used to be a dashboard: a level card, two crosslinks, and then seven charts and lists at the
 * same size, every one of them true and none of them the reason anybody opens this tab. The charts
 * went behind «Подробности», where they belong: a chart answers a question you already had, and
 * nobody arrives here with it.
 *
 * The top is the account — the streak, the level, the avatar and «Обновить» (`AccountRow`). Those
 * last two came off Home, which is what let Home stop scrolling, and they brought the first two
 * with them: a streak and a level are answers to «как у меня дела», not to «что у меня сегодня».
 * That replaced the full-bleed paper poster with the 104px streak numeral, at the owner's request.
 *
 * The achievements show what has been earned, with the rest in a row swiped sideways
 * (AchievementsGrid) — twelve tiles of which ten are grey is a list of what you have not done.
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
import { STEPS_GOAL } from '@/lib/training/constants';
import { evaluateAchievements, levelForPoints } from '@/lib/training/levels';
import { useT } from '@/app/hooks/useT';
import { AccountRow } from '@/app/features/stats/AccountRow';
import { AchievementsGrid } from '@/app/features/stats/AchievementsGrid';
import { StreakCard } from '@/app/features/stats/StreakCard';
import { WeekBoard } from '@/app/features/leaderboard/WeekBoard';
import {
  personalRecords,
  pointsByWeek,
  stepsHistory,
  streakCalendar,
  totalCalories,
  userStatsFromProgress,
  weekLoad,
} from '@/app/features/stats/model';
import { RecordsList } from '@/app/features/stats/RecordsList';
import { Section } from '@/app/features/stats/Section';
import { LevelCard, TotalsRow } from '@/app/features/stats/StatsCards';
import { PointsChart, StepsChart, WeeklyChart } from '@/app/features/stats/StatsCharts';
import { StreakCalendar } from '@/app/features/stats/StreakCalendar';
import { StepsRow } from '@/app/features/stats/StepsRow';
import { useSession } from '@/app/store/session';
import {
  useProgress,
  useProgressLoader,
  useStepsToday,
  useStreak,
  useTodayIso,
  useTotalPoints,
} from '@/app/store/progress';

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-7 py-6" aria-hidden="true">
      <Skeleton rounded="control" className="h-24" />
      <Skeleton rounded="control" className="h-44" />
      <Skeleton rounded="control" className="h-44" />
      <Skeleton rounded="control" className="h-52" />
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

  const level = useMemo(() => levelForPoints(totalPoints), [totalPoints]);
  const week = useMemo(() => weekLoad(sessions, today), [sessions, today]);
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

  const refresh = useCallback(async () => {
    await useProgress.getState().refresh();
    if (useProgress.getState().error) {
      toast.show({ kind: 'error', title: t('app.statsRefreshError') });
    }
  }, [toast, t]);

  /*
   * The title alone. «Обновить» used to sit beside it and now belongs to `AccountRow` below,
   * together with the avatar — both are the person's controls rather than the screen's, and they
   * read as a pair only when they are next to each other.
   */
  const header = (
    <div className="flex h-14 items-center gap-2 px-6">
      <h1 className="font-display min-w-0 flex-1 truncate text-base">{t('app.statsTitle')}</h1>
    </div>
  );

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
      <div className="flex flex-col gap-4">
        <AccountRow
          streak={streak}
          level={level}
          avatarSeed={profile?.avatarSeed ?? user?.id ?? ''}
          displayName={profile?.displayName ?? user?.email}
          loading={loading}
          onOpenProfile={() => navigate('/profile')}
          onRefresh={() => void refresh()}
        />
        {/* The day is still open and nothing is logged: the one line that can save the streak. */}
        {streak.atRisk ? (
          <StreakCard
            streak={streak}
            stepsGoal={STEPS_GOAL}
            onLogSteps={() => navigate('/steps')}
          />
        ) : null}
        {/*
         * The one number still owed today. It used to live on Home, but Home answers "what do I
         * do now" — how far you walked belongs with the rest of how you are doing.
         */}
        <StepsRow steps={stepsToday} goal={STEPS_GOAL} onOpen={() => navigate('/steps')} />
        <Section
          title={t('app.statsAchievementsTitle')}
          aside={t('app.statsAchievementsCount', { done: unlocked, total: achievements.length })}
        >
          <AchievementsGrid items={achievements} />
        </Section>
        <Section title={t('app.statsWeekBoardTitle')}>
          <WeekBoard onOpenFull={() => navigate('/leaderboard')} />
        </Section>

        {/*
         * The whole record, behind one tap. Not a second screen: it is the same data the tab has
         * always carried, and somebody who wants the calendar wants it here rather than after a
         * navigation. Collapsed by default, because a chart is an answer to a question nobody
         * arrives with.
         */}
        <div className="mt-2 border-t border-border pt-5">
          <Button variant="ghost" size="sm" onClick={() => setDetails((v) => !v)}>
            {details ? t('app.statsDetailsHide') : t('app.statsDetailsShow')}
          </Button>
        </div>
        {/*
         * Opened, this is seven figures deep — the longest stack in the app, and on a laptop the
         * last of them sits four screens below the button that opened it. Two across from `md`,
         * because each one is a small self-contained figure read on its own; the calendar keeps
         * the full width, as a year of squares in half a column is a different, worse object.
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
            <Section title={t('app.statsTotalsTitle')}>
              <TotalsRow
                workouts={stats.workouts}
                minutes={stats.totalMinutes}
                calories={calories}
              />
            </Section>
            <Section title={t('app.statsLevelTitle')}>
              <LevelCard points={totalPoints} level={level} />
            </Section>
          </div>
        ) : null}
      </div>
    );
  }

  return <Screen header={header}>{body}</Screen>;
}
