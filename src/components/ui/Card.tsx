import { clsx } from 'clsx';
import { forwardRef, type CSSProperties, type HTMLAttributes, type MouseEventHandler } from 'react';

export type CardLevel = 1 | 2 | 3;
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Surface level (1 = base card, 3 = most elevated). */
  level?: CardLevel;
  /**
   * Pastel "hero art" gradient. `true` uses the brand mint → sky; a `[from, to]` tuple
   * (course accent colors from content) overrides the stops through CSS variables.
   */
  gradient?: boolean | [string, string];
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
    gradient,
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
  const gradientStyle: CSSProperties | undefined = Array.isArray(gradient)
    ? ({ '--course-g1': gradient[0], '--course-g2': gradient[1] } as CSSProperties)
    : undefined;
  const classes = clsx(
    'relative rounded-card',
    gradient ? 'hero-art border-0' : LEVEL[level],
    PADDING[padding],
    selected && 'ring-2 ring-primary',
    onClick &&
      'w-full text-left transition-[background-color,transform] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none',
    className,
  );
  const merged = gradientStyle ? { ...gradientStyle, ...style } : style;

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
