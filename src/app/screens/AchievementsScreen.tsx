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
import { HeroField, KeyTitle } from '@/components/ui/HeroField';
import { ProgressBar } from '@/components/ui/ProgressBar';
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

  const count = t('app.statsAchievementsCount', {
    done: formatNumber(locale, unlocked),
    total: formatNumber(locale, achievements.length),
  });
  const header = <TopBar back title={t('app.achievementsTitle')} />;

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
           already are, and the count is the one line this screen needs.

           The count is the screen's blue hero field (style A, global.css header) — the one number
           the catalogue is about, which used to sit small in the header's corner. Its last word,
           the total, is the key word. */
        <div className="flex flex-col gap-6">
          <HeroField>
            <p className="display tabular text-[40px] leading-[1.2]">
              <KeyTitle text={count} />
            </p>
            <ProgressBar
              value={unlocked / achievements.length}
              ground="field"
              label={t('app.achievementsTitle')}
              className="mt-6"
            />
          </HeroField>
          <AchievementList items={achievements} />
        </div>
      )}
    </Screen>
  );
}
