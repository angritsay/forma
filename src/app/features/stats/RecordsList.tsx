import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatClock, formatDate, formatNumber, plural, type TKey } from '@/i18n/index';
import type { Translator } from '@/app/hooks/useT';
import { useT } from '@/app/hooks/useT';
import { recordImproved, type PersonalRecord } from './model';

const UNIT_KEY: Record<string, TKey> = {
  reps: 'training.reps',
  seconds: 'training.seconds',
  meters: 'training.meters',
  calories: 'training.calories',
  rounds: 'app.statsUnitRounds',
};

function unitLabel(tr: Translator, unit: string): string {
  const key = UNIT_KEY[unit];
  return key ? tr.t(key) : unit;
}

/** "4:05" for timed benchmarks, "25 reps" otherwise. */
export function formatRecordValue(tr: Translator, record: PersonalRecord): string {
  if (record.lowerIsBetter) return formatClock(record.latest);
  return `${formatNumber(tr.locale, record.latest, 2)} ${unitLabel(tr, record.unit)}`;
}

/** Signed change against the first attempt, e.g. "+7 reps" / "−0:20". */
export function formatRecordDelta(tr: Translator, record: PersonalRecord): string {
  const sign = record.delta > 0 ? '+' : '−';
  const abs = Math.abs(record.delta);
  if (record.lowerIsBetter) return `${sign}${formatClock(abs)}`;
  return `${sign}${formatNumber(tr.locale, abs, 2)} ${unitLabel(tr, record.unit)}`;
}

/** Latest value per benchmark key with the change since the first attempt. */
export function RecordsList({ records }: { records: readonly PersonalRecord[] }) {
  const tr = useT();
  const { t, locale } = tr;
  if (records.length === 0) {
    return (
      <Card level={2} padding="sm">
        <p className="px-1 text-sm text-muted">{t('app.statsRecordsEmpty')}</p>
      </Card>
    );
  }
  return (
    <Card padding="none">
      <ul className="divide-y divide-border">
        {records.map((r) => {
          const improved = recordImproved(r);
          const attempts = plural(locale, r.attempts, {
            one: t('app.statsRecordAttemptsOne', { n: r.attempts }),
            few: t('app.statsRecordAttemptsFew', { n: r.attempts }),
            many: t('app.statsRecordAttemptsMany', { n: r.attempts }),
          });
          return (
            <li key={r.key} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{r.name}</span>
                <span className="block truncate text-sm text-muted">
                  {r.context ? `${r.context} · ` : ''}
                  {formatDate(locale, r.recordedAt)} · {attempts}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="tabular text-[15px] font-semibold">
                  {formatRecordValue(tr, r)}
                </span>
                {improved !== null ? (
                  <Badge tone={improved ? 'success' : 'danger'}>
                    {formatRecordDelta(tr, r)} {t('app.statsRecordFirst')}
                  </Badge>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
