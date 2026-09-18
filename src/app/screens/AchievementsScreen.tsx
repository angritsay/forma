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
import { formatNumber } from '@/i18n/index';
import { evaluateAchievements } from '@/lib/training/levels';
import { useT } from '@/app/hooks/useT';
import { TopBar } from '@/app/components/TopBar';
import { ScreenLoader } from '@/app/components/ScreenLoader';
import { AchievementList } from '@/app/features/stats/Badges';
import { userStatsFromProgress } from '@/app/features/stats/model';
import { useProgress, useProgressLoader, useTodayIso } from '@/app/store/progress';

export default function AchievementsScreen() {
  useProgressLoader();
  const { t, locale } = useT();
  const status = useProgress((s) => s.status);
  const sessions = useProgress((s) => s.recentSessions);
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
          benchmarks,
          courseStates,
          todayIso: today,
        }),
      ),
    [totals, sessions, benchmarks, courseStates, today],
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
        <ScreenLoader />
      </Screen>
    );
  }

  return (
    <Screen header={header} contentClassName="pt-2">
      {achievements.length === 0 ? (
        <EmptyState icon="trophy" title={t('app.achievementsEmpty')} />
      ) : (
        /* No lead over the list. «Всё, что можно взять, и как.» described what the rows under it
           already are, and the count in the header is the one line this screen needs. */
        <AchievementList items={achievements} />
      )}
    </Screen>
  );
}
