import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Icon rendered before the label. */
  icon?: ReactNode;
  /** Icon rendered after the label. */
  iconRight?: ReactNode;
}

/*
 * Buttons are black and white, full stop. The primary is a white fill with black text — the
 * interface accent is white now, and `--primary` flips to ink on paper, so the same class is the
 * black button the profile screen wants. Secondary is a raised surface behind a strong hairline,
 * ghost is text alone, danger is an outline with red text. None of them ever takes the programme
 * colour: on a course screen the colour is on the cover, the progress and the day number, and
 * the button stays the one thing that is certainly a button.
 *
 * Hover lightens by one surface or drops to .85 opacity; press is a 2% scale. Nothing bounces.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-85',
  secondary: 'bg-surface-2 text-text border border-border-strong hover:bg-surface-3',
  ghost: 'bg-transparent text-muted hover:text-text',
  danger: 'bg-transparent text-danger border border-border-strong hover:bg-surface-2',
};

/*
 * 40 / 48 / 56 tall. The label is capitals tracked .16em (`.control-label`), which sets wide, so
 * it stays at 12–13px and the padding does the work of making the box read as a button. `sm` is
 * under the 44px touch minimum on its own — it is for rows of secondary actions — and
 * `tap-target-y` (global.css) grows its hit area without growing the box; the other two clear it.
 */
const SIZE: Record<ButtonSize, string> = {
  sm: 'tap-target-y h-10 px-4.5 text-[12px]',
  md: 'h-12 px-6.5 text-[13px]',
  lg: 'h-14 px-8 text-[13px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    icon,
    iconRight,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'control-label inline-flex select-none items-center justify-center gap-2 rounded-control',
        'transition-[background-color,color,opacity,transform] duration-150 ease-(--ease-out) active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children ? <span className="truncate">{children}</span> : null}
      {iconRight}
    </button>
  );
});
