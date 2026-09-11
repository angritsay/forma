import { Badge } from '@/components/ui/Badge';
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

/**
 * The four headline numbers of a session. The points are the one key fact, so they get the
 * crosshair plate — ticks in the programme colour, when the screen is inside a course — and the
 * other three sit on one ruled line under it. No icons: the word under each figure says what it is.
 */
export function SummaryStats({ durationSec, points, calories, completion }: SummaryStatsProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-5">
      <div className="plate-target px-5 py-6">
        <span className="plate-ticks" />
        <span className="eyebrow">{t('app.summaryPoints')}</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="numeral tabular text-7xl leading-none">{points}</span>
          <span className="text-sm text-muted">{t('common.pointsShort')}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <StatTile label={t('app.summaryTime')} value={formatClock(durationSec)} className="pl-0" />
        <StatTile label={t('app.summaryCalories')} value={calories} unit={t('common.kcal')} />
        <StatTile
          label={t('app.summaryCompletion')}
          value={Math.round(completion * 100)}
          unit="%"
          className="pr-0"
        />
      </div>
    </div>
  );
}

export function BlockList({ blocks }: { blocks: readonly BlockCompletion[] }) {
  const { t } = useT();
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <span className="eyebrow">{t('app.summaryBlocks')}</span>
      <ul className="flex flex-col gap-3">
        {blocks.map((b) => (
          <li key={b.blockId} className="flex flex-col gap-1.5">
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
            {/* The fill is the programme colour; a block well short of its plan warns instead. */}
            <ProgressBar
              value={b.completion}
              size="sm"
              tone={b.completion >= 0.8 ? 'course' : 'warning'}
              label={b.title}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TestResultList({ tests }: { tests: readonly TestResultView[] }) {
  const { t } = useT();
  if (tests.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4">
      <span className="eyebrow">{t('app.summaryTests')}</span>
      <ul className="flex flex-col">
        {tests.map((x, i) => (
          <li
            key={`${x.exerciseId}-${i}`}
            className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0"
          >
            <span className="truncate text-[15px] font-medium">{x.name}</span>
            <span className="numeral tabular shrink-0">
              {x.value}{' '}
              <span className="font-sans text-sm font-medium text-muted">
                {unitLabel(t, x.unit)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
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
    <section className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
      <span className="eyebrow">{t('app.summaryBenchmark')}</span>
      <span className="numeral tabular flex items-baseline gap-2 text-xl">
        {value}
        {note ? <span className="font-sans text-sm font-medium text-muted">{note}</span> : null}
      </span>
    </section>
  );
}
