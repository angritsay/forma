import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { formatNumber, plural } from '@/i18n/index';
import type { StreakInfo } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

export interface StreakCardProps {
  streak: StreakInfo;
  stepsGoal: number;
  onLogSteps: () => void;
}

/** "N days", today's state and a steps CTA while the day is still open. */
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
    /*
     * The streak led by its number and nothing else. The flame that used to sit beside the label
     * is gone: the count is the fact, the word under it says what it counts, and a picture of fire
     * next to a figure was the kind of decoration the brandbook takes off every row.
     */
    <section
      className="mt-6 flex items-start gap-4 border-t border-border pt-5"
      aria-label={t('app.homeStreakTitle')}
    >
      <span className="numeral tabular shrink-0 text-5xl leading-none">{streak.current}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="eyebrow">{word}</span>
          {streak.longest > streak.current ? (
            <Badge tone="neutral">{t('app.homeStreakBest', { n: streak.longest })}</Badge>
          ) : null}
        </div>
        <p className={clsx('mt-2 text-sm', streak.atRisk ? 'text-warning' : 'text-muted')}>
          {subtitle}
        </p>
        {!streak.todayDone ? (
          <Chip size="sm" className="mt-3" onClick={onLogSteps}>
            {t('app.homeStreakLogSteps')}
          </Chip>
        ) : null}
      </div>
    </section>
  );
}
