import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { COURSE_FILL, type ProgressTone } from './ProgressBar';

export interface RingProgressProps {
  /** Progress 0..1 (clamped). */
  value: number;
  /** Outer diameter in px. Default 120. */
  size?: number;
  /** Stroke width in px. Default 6. */
  stroke?: number;
  /** Stroke colour. Default `course`: the programme colour if a course is in scope, else white. */
  tone?: ProgressTone;
  /** Accessible name. */
  label?: string;
  valueText?: string;
  /** Content centered inside the ring (a numeral, a word). */
  children?: ReactNode;
  className?: string;
}

const TONE: Record<Exclude<ProgressTone, 'course'>, string> = {
  primary: 'stroke-primary',
  accent: 'stroke-primary',
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger: 'stroke-danger',
};

/**
 * The one ring the system allows — the design system ships it for the fitness index and the day's
 * completion. Same colour rule as {@link ProgressBar}: the programme colour when a course is in
 * scope, white otherwise. The arc ends are square, not rounded; a round cap on a thick stroke is a
 * pill end, and the system has none.
 */
export function RingProgress({
  value,
  size = 120,
  stroke = 6,
  tone = 'course',
  label,
  valueText,
  children,
  className,
}: RingProgressProps) {
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const half = size / 2;
  return (
    <div
      className={clsx('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-valuetext={valueText}
      >
        <circle
          cx={half}
          cy={half}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-3"
        />
        <circle
          cx={half}
          cy={half}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${half} ${half})`}
          className={clsx(
            'transition-[stroke-dasharray] duration-280 ease-(--ease-out)',
            tone !== 'course' && TONE[tone],
          )}
          style={tone === 'course' ? { stroke: COURSE_FILL } : undefined}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
