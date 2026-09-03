import { clsx } from 'clsx';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
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

/** The previous 14 days; every row opens the edit sheet. */
export function StepsHistory({ days, goal, onEdit }: StepsHistoryProps) {
  const { t, locale } = useT();
  return (
    <Card padding="none">
      <ul className="divide-y divide-border">
        {days.map((d) => {
          const atGoal = d.logged && d.steps >= goal;
          return (
            <li key={d.date}>
              <ListRow
                onClick={() => onEdit(d.date)}
                leading={
                  <span
                    className={clsx(
                      'flex size-10 items-center justify-center rounded-pill text-xs font-semibold uppercase',
                      atGoal ? 'bg-success/20 text-success' : 'bg-surface-2 text-muted',
                    )}
                  >
                    {weekdayLabel(locale, d.date)}
                  </span>
                }
                title={formatDate(locale, d.date)}
                subtitle={
                  d.logged ? t('app.stepsPointsPreview', { n: d.points }) : t('app.stepsNotLogged')
                }
                trailing={
                  <>
                    <span
                      className={clsx(
                        'tabular text-[15px] font-semibold',
                        d.logged ? 'text-text' : 'text-muted-2',
                      )}
                    >
                      {d.logged ? formatNumber(locale, d.steps) : '—'}
                    </span>
                    <Icon name="edit" size={16} title={t('app.stepsEdit')} />
                  </>
                }
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
