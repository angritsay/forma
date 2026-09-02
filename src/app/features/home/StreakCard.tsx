import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatNumber, plural } from '@/i18n/index';
import type { StreakInfo } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

export interface StreakCardProps {
  streak: StreakInfo;
  stepsGoal: number;
  onLogSteps: () => void;
}

/** Flame, "N days", today's state and a steps CTA while the day is still open. */
export function StreakCard({ streak, stepsGoal, onLogSteps }: StreakCardProps) {
  const { t, locale } = useT();
  const active = streak.current > 0;
  const word = plural(locale, streak.current, {
    one: t('app.homeStreakDayOne'),
    few: t('app.homeStreakDayFew'),
    many: t('app.homeStreakDayMany'),
  });
  const goal = formatNumber(locale, stepsGoal);
  const subtitle = streak.todayDone
    ? t('app.homeStreakTodayDone')
    : active
      ? t('app.homeStreakAtRisk', { steps: goal })
      : t('app.homeStreakEmpty', { steps: goal });

  return (
    <Card className="flex items-start gap-4" aria-label={t('app.homeStreakTitle')}>
      <span
        className={clsx(
          'flex size-14 shrink-0 items-center justify-center rounded-pill',
          active ? 'bg-warning/15 text-warning' : 'bg-surface-2 text-muted',
        )}
      >
        <Icon name="flame" size={28} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="tabular text-3xl font-bold leading-none">{streak.current}</span>
          <span className="text-sm text-muted">{word}</span>
          {streak.longest > streak.current ? (
            <Badge tone="neutral">{t('app.homeStreakBest', { n: streak.longest })}</Badge>
          ) : null}
        </div>
        <p className={clsx('mt-1.5 text-sm', streak.atRisk ? 'text-warning' : 'text-muted')}>
          {subtitle}
        </p>
        {!streak.todayDone ? (
          <Chip icon="steps" size="sm" className="mt-3" onClick={onLogSteps}>
            {t('app.homeStreakLogSteps')}
          </Chip>
        ) : null}
      </div>
    </Card>
  );
}
