import { clsx } from 'clsx';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  /** Helper text under the field. */
  hint?: ReactNode;
  /** Error text under the field; also marks the field invalid. */
  error?: ReactNode;
  /** Node rendered inside the field on the left (a mark, a unit). */
  leading?: ReactNode;
  /** Node rendered inside the field on the right (unit, button). */
  trailing?: ReactNode;
  /** Class for the outer wrapper. */
  wrapperClassName?: string;
}

/*
 * A field is a 48px sharp rectangle on --surface-2 behind a hairline. Focus is a 1px white border
 * and nothing else — no ring, no glow; `--primary` flips to ink on paper so the same class is
 * right on both grounds. An error is the same border in --danger. The label sits above at 13px.
 *
 * The field's own text stays 16px rather than the design system's 15: below 16px iOS Safari
 * zooms the page when the field takes focus.
 */
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
        <label htmlFor={inputId} className="text-[13px] font-semibold text-muted">
          {label}
        </label>
      ) : null}
      <div
        className={clsx(
          'flex h-12 items-center gap-3 rounded-control border bg-surface-2 px-4',
          'transition-colors duration-150 ease-(--ease-out) focus-within:border-primary',
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
            'disabled:opacity-40',
            className,
          )}
          {...rest}
        />
        {trailing ? <span className="shrink-0 text-muted">{trailing}</span> : null}
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
});
