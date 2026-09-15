import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { formatNumber } from '@/i18n/index';
import type { StreakInfo } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

export interface StreakCardProps {
  streak: StreakInfo;
  stepsGoal: number;
  onLogSteps: () => void;
}

/**
 * The warning that today's streak is still unclaimed, and the one tap that saves it.
 *
 * It used to open by repeating the count. It cannot any more: `AccountRow` sits directly above it
 * now and says «3 дня подряд», so leading with a 36px «3» put the same number on the screen twice
 * within two hundred pixels. What is left is the part only this block has — what happens today if
 * nothing is logged, and the way to log it.
 *
 * It shows only while the day is open and at risk (`StatsScreen`), so it is the exception on the
 * tab rather than a permanent row, which is also why it may lead with a sentence where everything
 * around it leads with a figure.
 */
export function StreakCard({ streak, stepsGoal, onLogSteps }: StreakCardProps) {
  const { t, locale } = useT();
  const active = streak.current > 0;
  const goal = formatNumber(locale, stepsGoal);
  const subtitle = streak.todayDone
    ? t('app.homeStreakTodayDone')
    : active
      ? t('app.homeStreakAtRisk', { steps: goal })
      : t('app.homeStreakEmpty', { steps: goal });

  return (
    <section className="flex flex-col pt-5" aria-label={t('app.homeStreakTitle')}>
      <p className={clsx('text-sm', streak.atRisk ? 'text-warning' : 'text-muted')}>{subtitle}</p>
      {/* The best run, when it is behind you — the one number the row above does not carry. */}
      {streak.longest > streak.current ? (
        <span className="mt-2 self-start">
          <Badge tone="neutral">{t('app.homeStreakBest', { n: streak.longest })}</Badge>
        </span>
      ) : null}
      {!streak.todayDone ? (
        <Chip size="sm" className="mt-3 self-start" onClick={onLogSteps}>
          {t('app.homeStreakLogSteps')}
        </Chip>
      ) : null}
    </section>
  );
}
