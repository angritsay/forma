import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'on-art';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: IconName;
  size?: 'sm' | 'md';
}

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-white/10 text-text',
  accent: 'bg-accent text-on-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/20 text-danger',
  'on-art': 'bg-black/15 text-on-primary',
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
        'inline-flex items-center gap-1 whitespace-nowrap rounded-pill font-semibold',
        size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-2.5 text-sm',
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
