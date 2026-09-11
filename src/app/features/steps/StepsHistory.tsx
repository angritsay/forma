import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { formatDate, formatNumber } from '@/i18n/index';
import { weekdayLabel } from '@/app/features/home/StatsGrid';
import { useT } from '@/app/hooks/useT';
import type { HistoryDay } from './model';

export interface StepsHistoryProps {
  days: readonly HistoryDay[];
  goal: number;
  onEdit: (date: string) => void;
}

/**
 * The previous 14 days as hairline rows; every row opens the edit sheet.
 *
 * The weekday leads the row as a kicker, the count trails it as a numeral with a tick when the
 * goal was met, and the row's own `›` says it opens. The green weekday tile and the pencil are
 * gone: a list of days is a list of figures, and the only thing that varies is whether the figure
 * is there.
 */
export function StepsHistory({ days, goal, onEdit }: StepsHistoryProps) {
  const { t, locale } = useT();
  return (
    <div className="border-t border-border">
      <ul className="divide-y divide-border">
        {days.map((d) => {
          const atGoal = d.logged && d.steps >= goal;
          return (
            <li key={d.date}>
              <ListRow
                onClick={() => onEdit(d.date)}
                leading={
                  <span className="eyebrow w-8 text-[10px]">{weekdayLabel(locale, d.date)}</span>
                }
                title={formatDate(locale, d.date)}
                subtitle={
                  d.logged ? t('app.stepsPointsPreview', { n: d.points }) : t('app.stepsNotLogged')
                }
                trailing={
                  <>
                    {atGoal ? (
                      <Glyph size={12} className="text-text">
                        ✓
                      </Glyph>
                    ) : null}
                    <span
                      className={clsx(
                        'numeral tabular text-[15px]',
                        d.logged ? 'text-text' : 'text-muted-2',
                      )}
                    >
                      {d.logged ? formatNumber(locale, d.steps) : '—'}
                    </span>
                    <span className="sr-only">{t('app.stepsEdit')}</span>
                    <Glyph size={16}>›</Glyph>
                  </>
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
