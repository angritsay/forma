import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'on-art';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: IconName;
  size?: 'sm' | 'md';
}

/*
 * A badge is a stamp on top of something else (a count on a tab, a state on a card), so unlike
 * Chip it keeps a fill — an outline would disappear against the busy surface it labels. The
 * fills are kept dim; `accent` is the only solid one and is reserved for a genuine "this one".
 */
const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-white/10 text-text',
  accent: 'bg-accent text-on-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/20 text-danger',
  'on-art': 'bg-black/35 text-tile-fg',
};

export function Badge({
  tone = 'neutral',
  icon,
  size = 'sm',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'control-label inline-flex items-center gap-1 whitespace-nowrap rounded-control',
        size === 'sm' ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-[11px]',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 12 : 14} /> : null}
      {children}
    </span>
  );
}
