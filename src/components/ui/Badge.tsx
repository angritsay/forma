import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

export type BadgeTone =
  | 'neutral'
  | 'inverse'
  | 'course'
  | 'success'
  | 'warning'
  | 'danger'
  /** Previous brandbook's name for `inverse`; kept so callers do not break. */
  | 'accent'
  /** Previous brandbook's name for the stamp on course art; now the dark plate. */
  | 'on-art';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: IconName;
  size?: 'sm' | 'md';
}

/*
 * A badge is a stamp: a state on a card, a count on a row. 24px, capitals at 11px tracked .12em.
 * Neutral is an outline; `inverse` is the white fill for the one genuine "this one"; `course` is
 * the only tone that takes colour — the programme colour, with black text — for a stamp that
 * names the programme itself. Success, warning and danger keep the colour on the text and stay
 * outlined, so a list of statuses is a list of words, not a row of coloured blocks.
 *
 * `accent` was the blue "this one" and renders as `inverse`. `on-art` sat on a pastel tile and
 * is now the dark plate the design system stamps on a course cover — `--ink` on `--paper`, which
 * do not flip with the theme, so it is dark on any tile in any theme.
 */
const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-transparent border-border-strong text-text',
  inverse: 'bg-primary border-transparent text-on-primary',
  course: 'bg-course border-transparent text-on-course',
  success: 'bg-transparent border-border-strong text-success',
  warning: 'bg-transparent border-border-strong text-warning',
  danger: 'bg-transparent border-border-strong text-danger',
  accent: 'bg-primary border-transparent text-on-primary',
  'on-art': 'bg-ink/85 border-transparent text-paper',
};

/* `sm` is the design system's badge; `md` is a touch roomier for a stamp that stands alone. */
const SIZE = {
  sm: 'h-6 px-2.5 text-[11px]',
  md: 'h-7 px-3 text-[11px]',
} as const;

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
        'inline-flex items-center gap-1 whitespace-nowrap rounded-control border font-semibold uppercase tracking-[0.12em]',
        SIZE[size],
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}
