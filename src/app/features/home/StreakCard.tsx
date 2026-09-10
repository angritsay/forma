import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
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
    /*
     * The streak led by its number. A card with a 56px flame roundel in front of a small figure
     * put the decoration first and the fact second; here the count is the largest thing on the
     * line, and the flame is a 16px mark beside the label, coloured only while the streak is live.
     */
    <section
      className="flex items-start gap-4 border-t border-border pt-5"
      aria-label={t('app.homeStreakTitle')}
    >
      <span className="numeral tabular shrink-0 text-5xl leading-none">{streak.current}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Icon
            name="flame"
            size={16}
            className={clsx('shrink-0', active ? 'text-warning' : 'text-muted')}
          />
          <span className="eyebrow">{word}</span>
          {streak.longest > streak.current ? (
            <Badge tone="neutral">{t('app.homeStreakBest', { n: streak.longest })}</Badge>
          ) : null}
        </div>
        <p className={clsx('mt-2 text-sm', streak.atRisk ? 'text-warning' : 'text-muted')}>
          {subtitle}
        </p>
        {!streak.todayDone ? (
          <Chip icon="steps" size="sm" className="mt-3" onClick={onLogSteps}>
            {t('app.homeStreakLogSteps')}
          </Chip>
        ) : null}
      </div>
    </section>
  );
}
