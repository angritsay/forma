import { clsx } from 'clsx';
import { forwardRef, type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type ChipTone = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'on-art';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Kit mark rendered before the label — a glyph where one exists, an object icon otherwise. */
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
 * A chip is a small fact or a filter: 34px, capitals at 12px, tracked a little (.06em — less
 * than a button label, because a chip is read as a word, not scanned as a control). Inactive
 * chips sit on --surface-3 behind a hairline; the selected one is the white fill with black text,
 * the same inversion the primary button uses, and it is the only fill in the row so the eye
 * finds it first.
 *
 * The named tones are for chips that state something rather than select something. `accent`
 * used to be the blue highlight and is now the same chip with a stronger hairline and full-white
 * text — a target rep count, the last three seconds of a rest. The semantic tones keep their
 * colour on the text only. `on-art` sits on course art and reads whatever ink the tile has set
 * through `--course-tile-fg`, so it is black on a programme colour and light on a neutral one.
 */
const TONE: Record<ChipTone, string> = {
  default: 'bg-surface-3 border-border text-muted',
  accent: 'bg-surface-3 border-border-strong text-text',
  success: 'bg-transparent border-border-strong text-success',
  warning: 'bg-transparent border-border-strong text-warning',
  danger: 'bg-transparent border-border-strong text-danger',
  'on-art': 'bg-tile-fg/10 border-tile-fg/30 text-tile-fg',
};

/* `md` is the design system's chip; `sm` is the same chip a step down for metrics inside a card. */
const SIZE: Record<ChipSize, string> = {
  sm: 'h-7 px-2.5 text-[11px] gap-1',
  md: 'h-8.5 px-3 text-[12px] gap-1.5',
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
  const iconNode = typeof icon === 'string' ? <Icon name={icon as IconName} size={12} /> : icon;
  const classes = clsx(
    'inline-flex shrink-0 items-center whitespace-nowrap rounded-control border font-semibold uppercase tracking-[0.06em]',
    SIZE[size],
    selected ? 'border-primary bg-primary text-on-primary' : TONE[tone],
    // Interactive chips are 28/34px tall by design; `tap-target-y` (global.css) lifts the hit area
    // to the 44px minimum without changing the layout.
    onClick &&
      'tap-target-y transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-out) active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
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
