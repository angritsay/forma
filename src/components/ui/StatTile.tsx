import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { IconName } from './Icon';

export interface StatTrend {
  /** Signed change; the sign picks the color. */
  value: number;
  /** Text shown instead of the raw number (e.g. "+12%"). */
  label?: ReactNode;
}

export interface StatTileProps {
  value: ReactNode;
  label: ReactNode;
  /**
   * Accepted for compatibility and not drawn. A stat is a number with its name under it; the
   * brandbook takes the decorative icon off stat tiles because the number already says what it
   * is, and a row of little pictures next to a row of figures is noise.
   */
  icon?: IconName;
  /** Unit shown next to the value in a smaller size. */
  unit?: ReactNode;
  trend?: StatTrend;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * A statistic set editorially: the number first and large in the display face, its name
 * underneath as a kicker.
 *
 * This is not a Card. A row of bordered, filled boxes each holding one small number is what a
 * dashboard looks like; the brandbook's version is a figure you read at a glance with a label
 * under it, and the containing grid draws hairlines between them. Callers that want the cells
 * separated should put `divide-x divide-border` on the grid rather than asking for a surface
 * here — hence no `level` prop.
 */
export function StatTile({ value, label, unit, trend, size = 'md', className }: StatTileProps) {
  return (
    <div className={clsx('flex flex-col gap-2 px-4 py-5', className)}>
      <div className="flex items-baseline gap-1.5">
        <span
          className={clsx('numeral tabular leading-none', size === 'lg' ? 'text-5xl' : 'text-4xl')}
        >
          {value}
        </span>
        {unit ? <span className="text-[13px] text-muted">{unit}</span> : null}
      </div>
      <span className="eyebrow">{label}</span>
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
    </div>
  );
}
