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

/*
 * Chips are hairline outlines on the page's own ground, not filled surfaces. A row of tinted
 * pills was the single largest source of "big coloured area" in the old UI; as outlined
 * rectangles they carry the same information and leave the accent free for the thing that acts.
 *
 * `on-art` sits on a dark course tile rather than a pastel one, so its ink is light now.
 */
const TONE: Record<ChipTone, string> = {
  default: 'bg-transparent border-border text-muted',
  accent: 'bg-transparent border-accent/40 text-accent',
  success: 'bg-transparent border-success/40 text-success',
  warning: 'bg-transparent border-warning/40 text-warning',
  danger: 'bg-transparent border-danger/40 text-danger',
  'on-art': 'bg-black/25 border-white/15 text-tile-fg',
};

/* Uppercase and tracked, so a step smaller than the sentence-case equivalent it replaces. */
const SIZE: Record<ChipSize, string> = {
  sm: 'h-7 px-2.5 text-[10px] gap-1',
  md: 'h-9 px-3.5 text-[11px] gap-1.5',
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
    'control-label inline-flex shrink-0 items-center whitespace-nowrap rounded-control border',
    SIZE[size],
    selected ? 'border-accent bg-accent text-on-primary' : TONE[tone],
    // Interactive chips are 28/36px tall by design; `tap-target-y` (global.css) lifts the hit area
    // to the 44px minimum without changing the layout.
    onClick &&
      'tap-target-y transition-colors active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
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
