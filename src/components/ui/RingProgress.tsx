import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { ProgressTone } from './ProgressBar';

export interface RingProgressProps {
  /** Progress 0..1 (clamped). */
  value: number;
  /** Outer diameter in px. Default 120. */
  size?: number;
  /** Stroke width in px. Default 10. */
  stroke?: number;
  tone?: ProgressTone;
  /** Accessible name. */
  label?: string;
  valueText?: string;
  /** Content centered inside the ring (number, icon…). */
  children?: ReactNode;
  className?: string;
}

const TONE: Record<ProgressTone, string> = {
  primary: 'stroke-primary',
  accent: 'stroke-accent',
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger: 'stroke-danger',
};

export function RingProgress({
  value,
  size = 120,
  stroke = 10,
  tone = 'accent',
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
          className="stroke-white/10"
        />
        <circle
          cx={half}
          cy={half}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${half} ${half})`}
          className={clsx('transition-[stroke-dasharray] duration-700 ease-out', TONE[tone])}
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
