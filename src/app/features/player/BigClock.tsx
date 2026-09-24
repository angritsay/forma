import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { formatClock } from '@/i18n/index';

export interface BigClockProps {
  seconds: number;
  /** Small label above the digits (e.g. "Rest", "Work"). */
  label?: ReactNode;
  /** Line under the digits (hint, cap). */
  caption?: ReactNode;
  /**
   * `urgent` marks the last seconds of a countdown: time running out is one of the orange's jobs
   * in the semantic colour map (global.css header, design/CHANGELOG.md §15) — intensity, effort —
   * and it is never the programme colour. 5.99 on graphite. `accent` is its older name, kept so
   * callers do not break. `warning` and `danger` are for a cap running out and stay semantic.
   */
  tone?: 'default' | 'urgent' | 'accent' | 'warning' | 'danger';
  size?: 'md' | 'lg';
  className?: string;
}

const TONE = {
  default: 'text-text',
  urgent: 'text-orange',
  accent: 'text-orange',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

/** MM:SS in big tabular digits in the display face, announced politely to screen readers. */
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
      {label ? <span className="eyebrow">{label}</span> : null}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={clsx(
          'numeral leading-none',
          size === 'lg' ? 'text-[64px]' : 'text-[40px]',
          TONE[tone],
        )}
      >
        {formatClock(seconds)}
      </div>
      {caption ? <p className="text-[15px] text-muted">{caption}</p> : null}
    </div>
  );
}
