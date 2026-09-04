import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { formatNumber } from '@/i18n/index';
import { levelForPoints } from '@/lib/training/levels';
import type { LevelInfo } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

export interface LevelCardProps {
  points: number;
  level: LevelInfo;
}

/** Hero-art card: level title, points and the progress towards the next level. */
export function LevelCard({ points, level }: LevelCardProps) {
  const { t, l, locale } = useT();
  const next = level.nextAt !== null ? levelForPoints(level.nextAt) : null;
  const remaining = level.nextAt !== null ? Math.max(0, level.nextAt - points) : 0;
  const pct = Math.round(level.progress * 100);
  return (
    <Card gradient className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="eyebrow text-current opacity-70">
            {t('app.statsLevelEyebrow', { n: level.level })}
          </span>
          <h2 className="font-display truncate text-4xl leading-[1.3]">{l(level.title)}</h2>
        </div>
        <Badge tone="on-art" icon="bolt" size="md">
          {t('app.statsPointsValue', { n: formatNumber(locale, points) })}
        </Badge>
      </div>
      <div
        role="progressbar"
        aria-label={t('app.statsLevelProgress')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2.5 w-full overflow-hidden rounded-pill bg-black/10"
      >
        <div
          className="h-full rounded-pill bg-on-primary transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm font-medium opacity-80">
        {next
          ? t('app.statsLevelNext', { n: formatNumber(locale, remaining), title: l(next.title) })
          : t('app.statsLevelMax')}
      </p>
    </Card>
  );
}

export interface TotalsRowProps {
  workouts: number;
  minutes: number;
  calories: number;
}

/** All-time workouts, minutes and calories. */
export function TotalsRow({ workouts, minutes, calories }: TotalsRowProps) {
  const { t, locale } = useT();
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatTile
        label={t('app.statsTotalWorkouts')}
        icon="check"
        value={formatNumber(locale, workouts)}
      />
      <StatTile
        label={t('app.statsTotalMinutes')}
        icon="clock"
        value={formatNumber(locale, minutes)}
      />
      <StatTile
        label={t('app.statsTotalKcal')}
        icon="flame"
        value={formatNumber(locale, calories)}
      />
    </div>
  );
}
