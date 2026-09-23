/**
 * What is left of the old summary plate: the per-block, per-test and benchmark record.
 *
 * The headline numbers that used to lead this file — the clock on a crosshair plate, calories and
 * completion as two tiles — are `DonePoster`'s three numerals now. These three lists are the
 * detail behind «Подробности» on the summary screen: figures already (a percentage, a bar, a
 * measurement), but figures nobody arrives asking for, which is the test the owner's note set for
 * anything that is not the point of a screen.
 */
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useT } from '@/app/hooks/useT';
import { formatClock, plural } from '@/i18n/index';
import { unitLabel } from '../model';
import type { BlockCompletion, BenchmarkView, TestResultView } from '../summaryModel';

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
  if (result.kind === 'amrap' && result.maxReps) {
    const n = result.rounds * result.repsPerRound + result.extraReps;
    value = plural(locale, n, {
      one: t('app.nodeRepsOne', { n }),
      few: t('app.nodeRepsFew', { n }),
      many: t('app.nodeRepsMany', { n }),
    });
  } else if (result.kind === 'amrap') {
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
