import { Badge } from '@/components/ui/Badge';
import { StatTile } from '@/components/ui/StatTile';
import { formatNumber } from '@/i18n/index';
import { levelForPoints } from '@/lib/training/levels';
import type { LevelInfo } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

export interface LevelCardProps {
  points: number;
  level: LevelInfo;
}

/** Masthead of the statistics screen: level number, title, points and progress to the next one. */
export function LevelCard({ points, level }: LevelCardProps) {
  const { t, l, locale } = useT();
  const next = level.nextAt !== null ? levelForPoints(level.nextAt) : null;
  const remaining = level.nextAt !== null ? Math.max(0, level.nextAt - points) : 0;
  const pct = Math.round(level.progress * 100);
  return (
    /*
     * The athlete's level is the masthead of the statistics screen, so it is set like one: the
     * level number large in the margin, the title as a display heading, a hairline of progress
     * under both. It was a filled tile with a 40px heading and a fat rounded bar, which made the
     * top of the screen the loudest thing on it and left the real numbers below fighting it.
     */
    <section className="flex flex-col gap-4 pb-1">
      <div className="flex items-start gap-4">
        <span className="numeral tabular shrink-0 text-5xl leading-none">{level.level}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="eyebrow">{t('app.statsLevelEyebrow', { n: level.level })}</span>
          <h2 className="font-display truncate text-2xl leading-[1.24]">{l(level.title)}</h2>
        </div>
        <Badge tone="accent" icon="bolt" size="md">
          {t('app.statsPointsValue', { n: formatNumber(locale, points) })}
        </Badge>
      </div>
      <div
        role="progressbar"
        aria-label={t('app.statsLevelProgress')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1 w-full overflow-hidden bg-surface-3"
      >
        <div
          className="h-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-muted">
        {next
          ? t('app.statsLevelNext', { n: formatNumber(locale, remaining), title: l(next.title) })
          : t('app.statsLevelMax')}
      </p>
    </section>
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
    <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
      <StatTile
        label={t('app.statsTotalWorkouts')}
        icon="check"
        value={formatNumber(locale, workouts)}
        className="pl-0"
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
        className="pr-0"
      />
    </div>
  );
}
