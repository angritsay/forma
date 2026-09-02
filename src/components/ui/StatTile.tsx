import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Card, type CardLevel } from './Card';
import { Icon, type IconName } from './Icon';

export interface StatTrend {
  /** Signed change; the sign picks the color. */
  value: number;
  /** Text shown instead of the raw number (e.g. "+12%"). */
  label?: ReactNode;
}

export interface StatTileProps {
  value: ReactNode;
  label: ReactNode;
  icon?: IconName;
  /** Unit shown next to the value in a smaller size. */
  unit?: ReactNode;
  trend?: StatTrend;
  level?: CardLevel;
  size?: 'md' | 'lg';
  className?: string;
}

export function StatTile({
  value,
  label,
  icon,
  unit,
  trend,
  level = 2,
  size = 'md',
  className,
}: StatTileProps) {
  return (
    <Card level={level} padding="sm" className={clsx('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2 text-muted">
        <span className="text-sm">{label}</span>
        {icon ? <Icon name={icon} size={18} /> : null}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={clsx(
            'tabular font-bold leading-none',
            size === 'lg' ? 'text-4xl' : 'text-3xl',
          )}
        >
          {value}
        </span>
        {unit ? <span className="text-sm text-muted">{unit}</span> : null}
      </div>
      {trend ? (
        <span
          className={clsx(
            'tabular text-xs font-medium',
            trend.value > 0 ? 'text-success' : trend.value < 0 ? 'text-danger' : 'text-muted',
          )}
        >
          {trend.label ?? `${trend.value > 0 ? '+' : ''}${trend.value}`}
        </span>
      ) : null}
    </Card>
  );
}
