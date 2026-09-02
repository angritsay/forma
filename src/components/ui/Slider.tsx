import { clsx } from 'clsx';
import { useId, type ReactNode } from 'react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: ReactNode;
  /** Text describing the current value (e.g. RPE descriptor). */
  descriptor?: ReactNode;
  /** Show min/max captions under the track. */
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
  descriptor,
  minLabel,
  maxLabel,
  disabled,
  className,
}: SliderProps) {
  const id = useId();
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {(label || descriptor) && (
        <div className="flex items-baseline justify-between gap-3">
          {label ? (
            <label htmlFor={id} className="text-sm font-medium text-muted">
              {label}
            </label>
          ) : (
            <span />
          )}
          <span className="tabular text-3xl font-bold">{value}</span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--slider-pct': `${pct}%` } as React.CSSProperties}
        className={clsx(
          'h-8 w-full cursor-pointer appearance-none bg-transparent disabled:opacity-50',
          '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-pill',
          '[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--accent)_var(--slider-pct),rgba(255,255,255,0.12)_var(--slider-pct))]',
          '[&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-pill',
          '[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-card',
          '[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-pill [&::-moz-range-track]:bg-white/10',
          '[&::-moz-range-progress]:h-2 [&::-moz-range-progress]:rounded-pill [&::-moz-range-progress]:bg-accent',
          '[&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-pill',
          '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary',
        )}
      />
      {descriptor ? <p className="text-sm text-muted">{descriptor}</p> : null}
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-muted-2">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
