/**
 * Stats (docs/SPEC.md §10 flow 8): athlete level, this week's load, points per week, the streak
 * calendar, the steps history, personal records, achievements and all-time totals. Everything
 * derives from the progress store, so the screen shares one data load with Home.
 */
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { STEPS_GOAL } from '@/lib/training/constants';
import { evaluateAchievements, levelForPoints } from '@/lib/training/levels';
import { useT } from '@/app/hooks/useT';
import { AchievementsGrid } from '@/app/features/stats/AchievementsGrid';
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
    <div className="flex flex-col gap-5 py-2" aria-hidden="true">
      <Skeleton rounded="card" className="h-40" />
      <Skeleton rounded="card" className="h-52" />
      <Skeleton rounded="card" className="h-48" />
      <Skeleton rounded="card" className="h-56" />
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

  const header = (
    <div className="flex h-16 items-center gap-2 px-5">
      <h1 className="font-display min-w-0 flex-1 truncate text-2xl">{t('app.statsTitle')}</h1>
      <IconButton
        label={t('app.statsLogSteps')}
        icon="steps"
        variant="ghost"
        onClick={() => navigate('/steps')}
      />
      <IconButton
        label={t('app.statsLeaderboard')}
        icon="trophy"
        variant="ghost"
        onClick={() => navigate('/leaderboard')}
      />
      <IconButton
        label={t('app.statsRefresh')}
        icon={loading ? <Spinner size={18} /> : 'refresh'}
        variant="ghost"
        disabled={loading}
        onClick={() => void refresh()}
      />
    </div>
  );

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = <StatsSkeleton />;
  } else if (status === 'error') {
    body = (
      <EmptyState
        icon="warning"
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
      <div className="flex flex-col gap-6 py-2">
        <LevelCard points={totalPoints} level={level} />
        <Section title={t('app.statsWeekTitle')}>
          <WeeklyChart days={week} />
        </Section>
        <PointsChart weeks={weeks} />
        <StreakCalendar weeks={calendar} streak={streak} />
        <StepsChart points={steps} goal={STEPS_GOAL} />
        <Section title={t('app.statsRecordsTitle')}>
          <RecordsList records={records} />
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
      </div>
    );
  }

  return <Screen header={header}>{body}</Screen>;
}
