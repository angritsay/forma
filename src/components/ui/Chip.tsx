import { clsx } from 'clsx';
import { forwardRef, type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type ChipTone = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'on-art';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Kit icon rendered before the label (e.g. flame for calories). */
  icon?: IconName | ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
  /** Selected state for toggle chips (renders aria-pressed). */
  selected?: boolean;
  /** When set the chip is a <button>. */
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
}

const TONE: Record<ChipTone, string> = {
  default: 'bg-surface-2 border-border text-text',
  accent: 'bg-accent/15 border-accent/30 text-accent',
  success: 'bg-success/15 border-success/30 text-success',
  warning: 'bg-warning/15 border-warning/30 text-warning',
  danger: 'bg-danger/15 border-danger/30 text-danger',
  'on-art': 'bg-black/10 border-black/10 text-on-primary',
};

const SIZE: Record<ChipSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1',
  md: 'h-9 px-3.5 text-sm gap-1.5',
};

export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(
  {
    icon,
    tone = 'default',
    size = 'md',
    selected,
    onClick,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  const iconNode =
    typeof icon === 'string' ? (
      <Icon name={icon as IconName} size={size === 'sm' ? 14 : 16} />
    ) : (
      icon
    );
  const classes = clsx(
    'inline-flex shrink-0 items-center whitespace-nowrap rounded-pill border font-medium',
    SIZE[size],
    selected ? 'bg-primary border-primary text-on-primary' : TONE[tone],
    onClick &&
      'transition-colors active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
    className,
  );
  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={rest.role ? undefined : selected}
        className={classes}
        {...(rest as HTMLAttributes<HTMLButtonElement>)}
      >
        {iconNode}
        {children}
      </button>
    );
  }
  return (
    <span ref={ref as React.Ref<HTMLSpanElement>} className={classes} {...rest}>
      {iconNode}
      {children}
    </span>
  );
});
