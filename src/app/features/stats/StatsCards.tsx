import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
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
  return (
    /*
     * The athlete's level is the masthead of the statistics screen, so it is set like one: the
     * level number large in the margin, the title as the screen's one display line, a 4px rule of
     * progress under both. The points are a white stamp, not a blue one with a bolt on it — the
     * number is the fact and needs no picture beside it.
     */
    <section className="flex flex-col gap-4 pb-1">
      <div className="flex items-start gap-4">
        <span className="numeral tabular shrink-0 text-6xl leading-none">
          {String(level.level).padStart(2, '0')}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="eyebrow">{t('app.statsLevelEyebrow', { n: level.level })}</span>
          <h2 className="display text-4xl text-balance">{l(level.title)}</h2>
        </div>
        <Badge tone="inverse" size="md" className="shrink-0">
          {t('app.statsPointsValue', { n: formatNumber(locale, points) })}
        </Badge>
      </div>
      {/* No course is in scope on this screen, so the fill is white; `primary` says so outright. */}
      <ProgressBar value={level.progress} tone="primary" label={t('app.statsLevelProgress')} />
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

/** All-time workouts, minutes and calories: three numerals over their kickers, ruled off from each other. */
export function TotalsRow({ workouts, minutes, calories }: TotalsRowProps) {
  const { t, locale } = useT();
  return (
    <div className="grid grid-cols-3 divide-x divide-border">
      <StatTile
        label={t('app.statsTotalWorkouts')}
        value={formatNumber(locale, workouts)}
        className="pl-0"
      />
      <StatTile label={t('app.statsTotalMinutes')} value={formatNumber(locale, minutes)} />
      <StatTile
        label={t('app.statsTotalKcal')}
        value={formatNumber(locale, calories)}
        className="pr-0"
      />
    </div>
  );
}
