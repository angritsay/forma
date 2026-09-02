import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { formatClock } from '@/i18n/index';

export interface BigClockProps {
  seconds: number;
  /** Small label above the digits (e.g. "Rest", "Work"). */
  label?: ReactNode;
  /** Line under the digits (hint, cap). */
  caption?: ReactNode;
  tone?: 'default' | 'accent' | 'warning' | 'danger';
  size?: 'md' | 'lg';
  className?: string;
}

const TONE = {
  default: 'text-text',
  accent: 'text-accent',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

/** MM:SS in big tabular digits, announced politely to screen readers. */
export function BigClock({
  seconds,
  label,
  caption,
  tone = 'default',
  size = 'lg',
  className,
}: BigClockProps) {
  return (
    <div className={clsx('flex flex-col items-center gap-1 text-center', className)}>
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </span>
      ) : null}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={clsx(
          'tabular font-bold leading-none',
          size === 'lg' ? 'text-[76px]' : 'text-6xl',
          TONE[tone],
        )}
      >
        {formatClock(seconds)}
      </div>
      {caption ? <p className="text-[15px] text-muted">{caption}</p> : null}
    </div>
  );
}
