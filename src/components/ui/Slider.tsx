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
  /**
   * Accessible name, for a slider whose question is asked by a heading above it rather than by
   * `label` — passing `label` also draws the value row, which a screen that sets the figure
   * itself does not want.
   */
  ariaLabel?: string;
  /**
   * What the current value means in words (`aria-valuetext`). Without it a screen reader hears a
   * bare "7", which is exactly what a sighted person must not be shown either.
   */
  valueText?: string;
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
  ariaLabel,
  valueText,
}: SliderProps) {
  const id = useId();
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {/*
       * The label and the value travel together: the row exists to name the control and show
       * where it stands. `descriptor` alone used to bring it too, which drew the raw number a
       * second time under a screen that had already set the figure itself.
       */}
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-[13px] font-semibold text-muted">
            {label}
          </label>
          <span className="numeral text-3xl">{value}</span>
        </div>
      ) : null}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--slider-pct': `${pct}%` } as React.CSSProperties}
        /*
         * The track's `linear-gradient` is a hard two-stop colour switch at --slider-pct, i.e.
         * how you paint a filled portion in WebKit, which has no ::-moz-range-progress. It is not
         * a decorative gradient and is not what the brand's no-gradients rule is about.
         *
         * The slider is a control, so its fill is the interface accent (`--accent`, light blue —
         * the active state of the third palette), not the programme colour, which is reserved
         * for progress. Thumb and track are squared off like every other
         * control, and the thumb keeps its 28px so it stays draggable.
         */
        className={clsx(
          'h-8 w-full cursor-pointer appearance-none bg-transparent disabled:opacity-40',
          '[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-none',
          '[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--accent)_var(--slider-pct),var(--surface-3)_var(--slider-pct))]',
          '[&::-webkit-slider-thumb]:-mt-3 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-control',
          '[&::-webkit-slider-thumb]:bg-accent',
          '[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-none [&::-moz-range-track]:bg-surface-3',
          '[&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-none [&::-moz-range-progress]:bg-accent',
          '[&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-control',
          '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent',
        )}
      />
      {descriptor ? <p className="text-[13px] text-muted">{descriptor}</p> : null}
      {(minLabel || maxLabel) && (
        <div className="eyebrow flex justify-between">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
