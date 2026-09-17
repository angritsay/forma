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
 * A badge is a stamp: a state on a card, a count on a row. 24px, sentence case at 12px. It was
 * capitals at 11px tracked .12em, and it leaves them with the rest of the product — a stamp that
 * shouts beside a chip that does not is exactly the half-migration the owner ruled against.
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
  sm: 'h-6 px-2.5 text-[12px]',
  md: 'h-7 px-3 text-[12px]',
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
        /*
         * `shrink-0` is a bug fix, not a tidy-up. `design/CHANGELOG.md` §9 already rules that a
         * label does not give up its width to the text beside it — «ярлык не сжимается вместо
         * текста» — and `Badge` was the one stamp that never got the class. In the admin's
         * purchase row the status badge sits opposite a truncating email under `justify-between`,
         * so flexbox took the missing width out of the badge: «Активна» measured 59px of text in
         * a 49px box and was drawn cut off at the row's edge.
         *
         * Sentence case did not cause it and in fact relieved it — the same word sets 49px where
         * the tracked capitals set 62 — which is only why it took a screenshot to notice. The
         * text beside a stamp truncates; the stamp keeps its word.
         */
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-control border font-semibold tracking-[0.01em]',
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
