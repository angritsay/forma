import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { clampCount, COUNT_MAX } from './model';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Unit under the number ("reps", "sec"). */
  unit?: ReactNode;
  /** Accessible names of the two buttons. */
  decreaseLabel: string;
  increaseLabel: string;
  /** Accessible name of the value. */
  label?: string;
  size?: 'md' | 'lg';
  className?: string;
}

/** −/+ counter around a big number (rep counts, rounds). */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = COUNT_MAX,
  unit,
  decreaseLabel,
  increaseLabel,
  label,
  size = 'lg',
  className,
}: StepperProps) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, clampCount(n, max))));
  return (
    <div className={clsx('flex items-center justify-center gap-5', className)}>
      <IconButton
        label={decreaseLabel}
        icon="minus"
        variant="surface"
        onClick={() => set(value - 1)}
        disabled={value <= min}
      />
      <div className="flex min-w-[96px] flex-col items-center">
        <span
          role="status"
          aria-label={label}
          className={clsx(
            'tabular font-bold leading-none',
            size === 'lg' ? 'text-[72px]' : 'text-5xl',
          )}
        >
          {value}
        </span>
        {unit ? <span className="mt-1 text-sm text-muted">{unit}</span> : null}
      </div>
      <IconButton
        label={increaseLabel}
        icon="plus"
        variant="surface"
        onClick={() => set(value + 1)}
        disabled={value >= max}
      />
    </div>
  );
}
