import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatTile } from '@/components/ui/StatTile';
import { useT } from '@/app/hooks/useT';
import { formatClock, plural } from '@/i18n/index';
import { unitLabel } from '../model';
import type { BlockCompletion, BenchmarkView, TestResultView } from '../summaryModel';

export interface SummaryStatsProps {
  durationSec: number;
  points: number;
  calories: number;
  /** 0..1 */
  completion: number;
}

/** The four headline numbers of a session. */
export function SummaryStats({ durationSec, points, calories, completion }: SummaryStatsProps) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label={t('app.summaryTime')} icon="clock" value={formatClock(durationSec)} />
      <StatTile
        label={t('app.summaryPoints')}
        icon="bolt"
        value={points}
        unit={t('common.pointsShort')}
      />
      <StatTile
        label={t('app.summaryCalories')}
        icon="flame"
        value={calories}
        unit={t('common.kcal')}
      />
      <StatTile
        label={t('app.summaryCompletion')}
        icon="check"
        value={Math.round(completion * 100)}
        unit="%"
      />
    </div>
  );
}

export function BlockList({ blocks }: { blocks: readonly BlockCompletion[] }) {
  const { t } = useT();
  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <span className="px-1 eyebrow">{t('app.summaryBlocks')}</span>
      <ul className="flex flex-col gap-3">
        {blocks.map((b) => (
          <li key={b.blockId} className="flex flex-col gap-1.5 px-1">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[15px] font-medium">{b.title}</span>
              {b.skipped ? (
                <Badge tone="warning">{t('app.summarySkipped')}</Badge>
              ) : (
                <span className="tabular text-sm text-muted">
                  {Math.round(b.completion * 100)}%
                </span>
              )}
            </div>
            <ProgressBar
              value={b.completion}
              size="sm"
              tone={b.completion >= 0.95 ? 'success' : b.completion >= 0.8 ? 'accent' : 'warning'}
              label={b.title}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function TestResultList({ tests }: { tests: readonly TestResultView[] }) {
  const { t } = useT();
  if (tests.length === 0) return null;
  return (
    <Card padding="sm" className="flex flex-col gap-2">
      <span className="px-1 eyebrow">{t('app.summaryTests')}</span>
      <ul className="flex flex-col">
        {tests.map((x, i) => (
          <li
            key={`${x.exerciseId}-${i}`}
            className="flex items-center justify-between gap-3 px-1 py-2"
          >
            <span className="truncate text-[15px] font-medium">{x.name}</span>
            <span className="tabular shrink-0 font-semibold">
              {x.value}{' '}
              <span className="text-sm font-medium text-muted">{unitLabel(t, x.unit)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function BenchmarkCard({ result }: { result: BenchmarkView | null }) {
  const { t, locale } = useT();
  if (!result) return null;
  let value: string;
  let note: string | undefined;
  if (result.kind === 'amrap') {
    value = plural(locale, result.rounds, {
      one: t('app.summaryRoundsOne', { n: result.rounds }),
      few: t('app.summaryRoundsFew', { n: result.rounds }),
      many: t('app.summaryRoundsMany', { n: result.rounds }),
    });
    if (result.extraReps > 0) note = t('app.summaryExtraReps', { n: result.extraReps });
  } else {
    value = formatClock(result.timeSec);
    if (!result.completed) note = t('app.summaryPartial');
  }
  return (
    <Card padding="sm" className="flex items-center justify-between gap-3">
      <span className="px-1 eyebrow">{t('app.summaryBenchmark')}</span>
      <span className="tabular flex items-baseline gap-2 px-1 font-semibold">
        {value}
        {note ? <span className="text-sm font-medium text-muted">{note}</span> : null}
      </span>
    </Card>
  );
}
