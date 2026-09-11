import { clsx } from 'clsx';
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Glyph } from './Icon';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value' | 'size'
> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  wrapperClassName?: string;
}

/**
 * A native `<select>` in the kit's clothing: the same 48px field as {@link Input}, with a `›`
 * turned downwards where the platform arrow was.
 *
 * {@link SegmentedControl} covers two or three choices; this is for the long ones the course
 * builder needs — a movement pattern out of sixteen, a muscle group out of fifteen, which course
 * folder a video belongs in. Native on purpose: the phone gets its own wheel, the desktop gets
 * type-ahead and keyboard selection, and neither needs a listbox reimplemented here.
 */
function SelectInner<T extends string>(
  {
    label,
    hint,
    error,
    options,
    value,
    onChange,
    className,
    wrapperClassName,
    id,
    ...rest
  }: SelectProps<T>,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
      {label ? (
        <label htmlFor={fieldId} className="text-[13px] font-semibold text-muted">
          {label}
        </label>
      ) : null}
      <div
        className={clsx(
          'relative flex h-12 items-center rounded-control border bg-surface-2',
          'transition-colors duration-150 ease-(--ease-out) focus-within:border-primary',
          error ? 'border-danger' : 'border-border',
        )}
      >
        <select
          ref={ref}
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            // `appearance-none` drops the platform arrow so the kit's glyph can sit on the right;
            // the padding keeps the text clear of it.
            'h-full w-full appearance-none bg-transparent pr-11 pl-4 text-base text-text outline-none',
            'disabled:opacity-40',
            className,
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <Glyph size={16} className="pointer-events-none absolute right-4 rotate-90 text-muted">
          ›
        </Glyph>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Select = forwardRef(SelectInner) as <T extends string>(
  props: SelectProps<T> & { ref?: React.ForwardedRef<HTMLSelectElement> },
) => ReturnType<typeof SelectInner>;
