/**
 * Reports (docs/SPEC.md §10 flow 8) — the fourth tab, «Отчёты».
 *
 * It answers, in this order: how many days in a row, how many steps, what has been earned, how
 * much has been done, and who is winning the week. That order is the change: the screen used to
 * open on the athlete's level and two crosslinks, and the streak — the one number people actually
 * come back for — was on the home screen, where it competed with today's session.
 *
 * The achievements no longer show twelve tiles of which ten are grey: what is earned keeps the
 * grid, the rest is a row swiped sideways (AchievementsGrid). The week's table is on the screen
 * rather than behind a link (WeekBoard), short, with the full hundred one tap further.
 *
 * Everything below that is the record of the work — the week's load, points by week, the streak
 * calendar, steps, personal bests. Everything derives from the progress store, so the screen
 * shares one data load with Home.
 */
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { STEPS_GOAL } from '@/lib/training/constants';
import { evaluateAchievements, levelForPoints } from '@/lib/training/levels';
import { useT } from '@/app/hooks/useT';
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
import {
  useProgress,
  useProgressLoader,
  useStreak,
  useTodayIso,
  useTotalPoints,
} from '@/app/store/progress';

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-5" aria-hidden="true">
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
  const status = useProgress((s) => s.status);
  const loading = useProgress((s) => s.loading);
  const error = useProgress((s) => s.error);
  const sessions = useProgress((s) => s.recentSessions);
  const logs = useProgress((s) => s.dailyLogs);
  const benchmarks = useProgress((s) => s.benchmarks);
  const totals = useProgress((s) => s.totals);
  const courseStates = useProgress((s) => s.courseStates);
  const today = useTodayIso();
  const totalPoints = useTotalPoints();
  const streak = useStreak();

  const level = useMemo(() => levelForPoints(totalPoints), [totalPoints]);
  const week = useMemo(() => weekLoad(sessions, today), [sessions, today]);
  const weeks = useMemo(() => pointsByWeek(sessions, logs, today), [sessions, logs, today]);
  const calendar = useMemo(() => streakCalendar(sessions, logs, today), [sessions, logs, today]);
  const steps = useMemo(() => stepsHistory(logs, today), [logs, today]);
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
   * The title and one word: «Обновить». A circular arrow is neither a glyph nor a physical
   * object, so the refresh control is its label, set as a small ghost button; the spinner takes
   * its place while a reload is in flight.
   */
  const header = (
    <div className="flex h-14 items-center gap-2 border-b border-border px-5">
      <h1 className="font-display min-w-0 flex-1 truncate text-base">{t('app.statsTitle')}</h1>
      <Button
        variant="ghost"
        size="sm"
        className="-mr-4.5"
        loading={loading}
        onClick={() => void refresh()}
      >
        {t('app.statsRefresh')}
      </Button>
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
      <div className="flex flex-col gap-2">
        <StreakCard streak={streak} stepsGoal={STEPS_GOAL} onLogSteps={() => navigate('/steps')} />
        <Section title={t('app.statsStepsTitle')}>
          <StepsChart points={steps} goal={STEPS_GOAL} />
        </Section>
        <Section
          title={t('app.statsAchievementsTitle')}
          aside={t('app.statsAchievementsCount', { done: unlocked, total: achievements.length })}
        >
          <AchievementsGrid items={achievements} />
        </Section>
        <Section title={t('app.statsTotalsTitle')}>
          <TotalsRow workouts={stats.workouts} minutes={stats.totalMinutes} calories={calories} />
        </Section>
        <Section title={t('app.statsWeekBoardTitle')}>
          <WeekBoard onOpenFull={() => navigate('/leaderboard')} />
        </Section>
        <Section title={t('app.statsWeekTitle')}>
          <WeeklyChart days={week} />
        </Section>
        <div className="flex flex-col gap-6 border-t border-border pt-5">
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
    );
  }

  return <Screen header={header}>{body}</Screen>;
}
