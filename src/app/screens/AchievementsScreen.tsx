/**
 * The catalogue of achievements, behind the rosette in the header of «Курсы».
 *
 * «Достижения открывают каталог достижений.» The word is «каталог»: every achievement the product
 * has, including — especially — the ones not yet taken, each with the rule that earns it. That
 * rule is the reason the screen exists. On «Прогресс» the achievements were a sideways row of
 * circles with the rule hidden in a `title` attribute nobody on a phone can reach, which turned
 * the shelf into a wall of grey circles saying "no" thirteen times.
 *
 * The figures are the same ones the summary screen prints when an achievement is taken
 * (`features/stats/Badges`): an achievement should look the same on the day it is earned and on
 * the shelf. The evaluation is the same too — `evaluateAchievements` over the progress store, the
 * one place the rules live (`lib/training/levels.ts`).
 */
import { useMemo } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber } from '@/i18n/index';
import { evaluateAchievements } from '@/lib/training/levels';
import { useT } from '@/app/hooks/useT';
import { TopBar } from '@/app/components/TopBar';
import { AchievementList } from '@/app/features/stats/Badges';
import { userStatsFromProgress } from '@/app/features/stats/model';
import { useProgress, useProgressLoader, useTodayIso } from '@/app/store/progress';

export default function AchievementsScreen() {
  useProgressLoader();
  const { t, locale } = useT();
  const status = useProgress((s) => s.status);
  const sessions = useProgress((s) => s.recentSessions);
  const logs = useProgress((s) => s.dailyLogs);
  const benchmarks = useProgress((s) => s.benchmarks);
  const totals = useProgress((s) => s.totals);
  const courseStates = useProgress((s) => s.courseStates);
  const today = useTodayIso();

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

  const header = (
    <TopBar
      back
      title={t('app.achievementsTitle')}
      right={
        /* The count as the header's own figure: it is the one number the catalogue is about. */
        <span className="numeral tabular text-sm text-muted">
          {t('app.statsAchievementsCount', {
            done: formatNumber(locale, unlocked),
            total: formatNumber(locale, achievements.length),
          })}
        </span>
      }
    />
  );

  if (status === 'idle' || status === 'loading') {
    return (
      <Screen header={header} contentClassName="pt-4">
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton rounded="control" className="h-16" />
          <Skeleton rounded="control" className="h-16" />
          <Skeleton rounded="control" className="h-16" />
        </div>
      </Screen>
    );
  }

  return (
    <Screen header={header} contentClassName="pt-2">
      {achievements.length === 0 ? (
        <EmptyState icon="trophy" title={t('app.achievementsEmpty')} />
      ) : (
        <>
          <p className="pb-2 text-[13px] text-muted">{t('app.achievementsLead')}</p>
          <AchievementList items={achievements} />
        </>
      )}
    </Screen>
  );
}
