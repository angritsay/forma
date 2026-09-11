import { clsx } from 'clsx';
import { forwardRef, type HTMLAttributes, type MouseEventHandler } from 'react';
import { courseTileVars } from '@/lib/ui/tile';

export type CardLevel = 1 | 2 | 3;
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Surface level (1 = base card, 3 = most raised). */
  level?: CardLevel;
  /**
   * Draw the card as course art rather than a surface. `true` uses the neutral default tile; a
   * hex string (a course's `tile` from content) sets `--course-tile` and the matching ink through
   * courseTileVars(), so text lands black on a programme colour and light on a neutral surface.
   *
   * This is the one place a Card takes colour, and it is the course's colour, never the kit's.
   */
  tile?: boolean | string;
  padding?: CardPadding;
  /** Renders a <button> so the whole card is an accessible, focusable control. */
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  /** Highlighted border (e.g. selected option). */
  selected?: boolean;
}

/*
 * A card is a sharp rectangle one surface up from its ground, told apart by a hairline and
 * nothing else — --shadow-card is none, and a dark card on a dark ground does not need a shadow
 * to look raised, it needs an edge.
 */
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
  const tileStyle = typeof tile === 'string' ? courseTileVars(tile) : undefined;
  const classes = clsx(
    'relative rounded-card',
    tile ? 'hero-art border-0' : LEVEL[level],
    PADDING[padding],
    // Selection is a 1px white line inside the edge — an inset ring, so it never changes the
    // card's size and never carries a colour.
    selected && 'ring-1 ring-inset ring-primary',
    onClick &&
      'w-full text-left transition-[background-color,transform] duration-150 ease-(--ease-out) active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none',
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
