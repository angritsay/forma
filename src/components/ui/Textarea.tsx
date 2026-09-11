import { clsx } from 'clsx';
import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  /** Helper text under the field. */
  hint?: ReactNode;
  /** Error text under the field; also marks the field invalid. */
  error?: ReactNode;
  /** Class for the outer wrapper. */
  wrapperClassName?: string;
}

/**
 * A multi-line field, styled as {@link Input} is.
 *
 * The kit had no textarea because nothing in the app ever asked for one: every screen either shows
 * prose or collects a single line. The course builder writes prose — course descriptions, what a
 * day is for, teaching notes on a pose — and that is what this is for.
 *
 * It sets its own height rather than inheriting the field's fixed `h-14`, and `field-sizing-content`
 * grows it with the text where the browser supports it (Chrome 123+, and Safari 26+ — Firefox
 * ignores it and keeps `rows`).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, wrapperClassName, id, rows = 4, ...rest },
  ref,
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
        <label htmlFor={fieldId} className="text-sm font-medium text-muted">
          {label}
        </label>
      ) : null}
      <div
        className={clsx(
          'rounded-inner border bg-surface-2 px-4 py-3 transition-colors',
          'focus-within:border-border-strong',
          error ? 'border-danger' : 'border-border',
        )}
      >
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            'block w-full resize-y bg-transparent text-base leading-relaxed text-text outline-none',
            'placeholder:text-muted-2 disabled:opacity-50 [field-sizing:content]',
            className,
          )}
          {...rest}
        />
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
