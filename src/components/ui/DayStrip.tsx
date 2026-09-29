import { clsx } from 'clsx';

export interface StripDayItem {
  /** A stable key and the value picked — the ISO date. */
  key: string;
  /** Day of the month, the figure in the dot. */
  day: number;
  /** The weekday's short name over the dot («пн», «Mon»). */
  weekday: string;
  /** What a screen reader hears: the date and how many free times it has. */
  label: string;
  /** Nothing to pick that day: drawn, and not a button a tap can land on. */
  disabled?: boolean;
}

export interface DayStripProps {
  days: readonly StripDayItem[];
  value: string | null;
  onChange: (key: string) => void;
  /** Accessible name of the row. */
  label: string;
  className?: string;
}

/*
 * A row of days to pick one from — the selectable sibling of `DotCalendar`.
 *
 * The same round dot with the day of the month in it, so a calendar reads as one object across
 * the product, with three states that are about choosing rather than about what was done:
 *
 *   - selected — the light blue under ink (14.7): selection is the light blue's job in the
 *     semantic map (design/CHANGELOG.md §15), the same fill as a selected `Chip`;
 *   - open — a hairline ring: there is free time that day;
 *   - disabled — the faint dot of a future day in `DotCalendar`, and not focusable: a day with no
 *     free time is information («суббота занята»), not an action.
 *
 * It scrolls sideways inside its container (`deck-scroller`, no scrollbar) rather than wrapping:
 * two weeks are one strip in time, and a second row would read as a second fortnight.
 */
export function DayStrip({ days, value, onChange, label, className }: DayStripProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx('deck-scroller flex gap-1.5 overflow-x-auto pb-1', className)}
    >
      {days.map((d) => {
        const selected = d.key === value;
        return (
          <button
            key={d.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={d.label}
            disabled={d.disabled}
            onClick={() => onChange(d.key)}
            className="group flex shrink-0 flex-col items-center gap-1.5 disabled:pointer-events-none"
          >
            <span
              aria-hidden="true"
              className={clsx(
                'text-[11px] leading-none',
                d.disabled ? 'text-muted-2' : 'text-muted',
              )}
            >
              {d.weekday}
            </span>
            <span
              aria-hidden="true"
              className={clsx(
                'tabular flex size-11 items-center justify-center rounded-full text-[14px] font-semibold',
                'transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-out) group-active:scale-[0.96]',
                selected
                  ? 'bg-accent text-on-accent'
                  : d.disabled
                    ? 'bg-paper/5 text-muted-2'
                    : 'border border-border-strong text-text',
              )}
            >
              {d.day}
            </span>
          </button>
        );
      })}
    </div>
  );
}
