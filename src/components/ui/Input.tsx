import { clsx } from 'clsx';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  /** Helper text under the field. */
  hint?: ReactNode;
  /** Error text under the field; also marks the field invalid. */
  error?: ReactNode;
  /** Node rendered inside the field on the left (icon). */
  leading?: ReactNode;
  /** Node rendered inside the field on the right (unit, button). */
  trailing?: ReactNode;
  /** Class for the outer wrapper. */
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, trailing, className, wrapperClassName, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      ) : null}
      <div
        className={clsx(
          'flex h-14 items-center gap-3 rounded-inner border bg-surface-2 px-4 transition-colors',
          'focus-within:border-border-strong',
          error ? 'border-danger' : 'border-border',
        )}
      >
        {leading ? <span className="shrink-0 text-muted">{leading}</span> : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            'min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted-2',
            'disabled:opacity-50',
            className,
          )}
          {...rest}
        />
        {trailing ? <span className="shrink-0 text-muted">{trailing}</span> : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
