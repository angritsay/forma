import { clsx } from 'clsx';
import { forwardRef, type CSSProperties, type HTMLAttributes, type MouseEventHandler } from 'react';

export type CardLevel = 1 | 2 | 3;
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Surface level (1 = base card, 3 = most elevated). */
  level?: CardLevel;
  /**
   * Draw the card as course art rather than a surface. `true` uses the default tile; a hex
   * string (a course's `tile` from content) picks that course's tile through a CSS variable.
   *
   * This replaces the old `gradient` prop, which took a `[from, to]` pastel pair. The brand has
   * no gradients now: course art is one flat, muted dark blue.
   */
  tile?: boolean | string;
  padding?: CardPadding;
  /** Renders a <button> so the whole card is an accessible, focusable control. */
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  /** Highlighted border (e.g. selected option). */
  selected?: boolean;
}

const LEVEL: Record<CardLevel, string> = {
  1: 'bg-surface border border-border',
  2: 'bg-surface-2 border border-border',
  3: 'bg-surface-3 border border-border-strong',
};

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    level = 1,
    tile,
    padding = 'md',
    onClick,
    disabled,
    selected,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const tileStyle: CSSProperties | undefined =
    typeof tile === 'string' ? ({ '--course-tile': tile } as CSSProperties) : undefined;
  const classes = clsx(
    'relative rounded-card',
    tile ? 'hero-art border-0' : LEVEL[level],
    PADDING[padding],
    selected && 'ring-2 ring-accent',
    onClick &&
      'w-full text-left transition-[background-color,transform] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none',
    className,
  );
  const merged = tileStyle ? { ...tileStyle, ...style } : style;

  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={rest.role ? undefined : selected}
        className={classes}
        style={merged}
        {...(rest as HTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={classes}
      style={merged}
      {...(rest as HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
});
