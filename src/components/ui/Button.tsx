import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

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
 * The primary button is where most of the accent's budget in the product is spent, and it can
 * afford to be a solid blue fill precisely because there is at most one of them in view at a
 * time. Secondary loses its filled surface and becomes an outline, so two buttons side by side
 * read as one offer and one alternative rather than two equal blocks.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-primary hover:opacity-85',
  secondary: 'bg-transparent text-text border border-border-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-text hover:bg-white/5',
  danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
};

/*
 * Labels are uppercase and tracked at 0.08em, which sets appreciably wider than the sentence-case
 * equivalent — hence the smaller type at each step. Heights are unchanged and both clear the 44px
 * touch minimum on their own.
 */
const SIZE: Record<ButtonSize, string> = {
  md: 'h-12 px-5 text-[12px]',
  lg: 'h-14 px-6 text-[13px]',
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
        'transition-[background-color,opacity,transform] duration-150 active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={18} /> : icon}
      {children ? <span className="truncate">{children}</span> : null}
      {iconRight}
    </button>
  );
});
