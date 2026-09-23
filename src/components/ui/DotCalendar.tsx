import { clsx } from 'clsx';

export type DotState = 'done' | 'today' | 'today-done' | 'open' | 'future';

export interface DotDay {
  /** A stable key — the ISO date. */
  key: string;
  state: DotState;
  /** What a screen reader hears for the dot: the date and whether it was done. */
  label?: string;
  /** The day of the month, drawn inside a dot big enough to hold it. */
  day?: number;
}

export interface DotCalendarProps {
  days: readonly DotDay[];
  /**
   * Accessible name of the whole grid. Leave it out only for a strip that repeats what its
   * container already says in words (the club's streak pill): the grid is then hidden from
   * assistive tech as decoration.
   */
  label?: string;
  /** Dots per row. Default 7, a week. */
  columns?: number;
  /**
   * `sm` is a strip of bare dots (8px) for a pill or a row; `md` fills the grid's columns and
   * writes the day of the month in the ones that carry ink.
   */
  size?: 'sm' | 'md';
  className?: string;
}

/*
 * The club's calendar as a grid of dots (global.css header, style B).
 *
 *   - done — the crossroads gradient. The gradient is one per grid, not one per dot: every dot
 *     takes a slice of a gradient as wide as the grid (`background-size` in columns, position by
 *     column), so a row of done days reads as one ribbon broken into beads. Nothing is written on
 *     it — the gradient runs from light to deep blue and no one ink reads on all of it.
 *   - today — neon with ink (17.3), the one dot that asks for something.
 *   - today-done — neon too, with a check: today is still today once it is done.
 *   - open — a missed or not-yet-done past day: a hairline ring, no fill.
 *   - future — a faint dot.
 */
const BASE: Record<'sm' | 'md', string> = {
  sm: 'size-2',
  md: 'aspect-square w-full text-[11px] font-semibold',
};

export function DotCalendar({
  days,
  label,
  columns = 7,
  size = 'md',
  className,
}: DotCalendarProps) {
  return (
    <ol
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={clsx('grid', size === 'sm' ? 'gap-1' : 'gap-1.5', className)}
      /* `md` shares the grid's width; `sm` is bare 8px beads that size the strip themselves. */
      style={{
        gridTemplateColumns: `repeat(${columns}, ${size === 'sm' ? '0.5rem' : 'minmax(0, 1fr)'})`,
      }}
    >
      {days.map((d, i) => {
        const col = i % columns;
        const done = d.state === 'done';
        const today = d.state === 'today' || d.state === 'today-done';
        return (
          <li
            key={d.key}
            aria-label={d.label}
            className={clsx(
              'tabular flex items-center justify-center rounded-full',
              BASE[size],
              done && 'bg-cross',
              today && 'bg-action text-on-action',
              d.state === 'open' && 'border border-border-strong',
              d.state === 'future' && 'bg-paper/10',
            )}
            style={
              done
                ? {
                    backgroundSize: `${columns * 100}% 100%`,
                    backgroundPosition: columns > 1 ? `${(col / (columns - 1)) * 100}% 0` : '0 0',
                  }
                : undefined
            }
          >
            {size === 'md' && today ? (
              <span aria-hidden="true">{d.state === 'today-done' ? '✓' : d.day}</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
