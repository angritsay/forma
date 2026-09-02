import { clsx } from 'clsx';

export type ProgressTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger';

export interface ProgressBarProps {
  /** Progress 0..1 (values outside are clamped). */
  value: number;
  /** Accessible name of the bar. */
  label?: string;
  /** Text shown to the right of the bar (e.g. "3/12"). */
  valueText?: string;
  tone?: ProgressTone;
  size?: 'sm' | 'md';
  className?: string;
}

const TONE: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function ProgressBar({
  value,
  label,
  valueText,
  tone = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) {
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-valuetext={valueText}
        className={clsx(
          'w-full overflow-hidden rounded-pill bg-white/10',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={clsx(
            'h-full rounded-pill transition-[width] duration-500 ease-out',
            TONE[tone],
          )}
          style={{ width: `${v * 100}%` }}
        />
      </div>
      {valueText ? (
        <span className="tabular shrink-0 text-xs font-medium text-muted">{valueText}</span>
      ) : null}
    </div>
  );
}
