import { Chip } from '@/components/ui/Chip';
import { OptionTile } from './OptionTile';

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
}

export interface ChipGroupProps<T extends string | number> {
  options: readonly ChipOption<T>[];
  /** Selected values (one entry for single-select). */
  values: readonly T[];
  onToggle: (value: T) => void;
  label: string;
  multiple?: boolean;
  /**
   * `tile` for a question the athlete is answering, `pill` for a filter or a short numeric set.
   *
   * The default is `pill` so that everything which was a filter stays one — the admin's course and
   * plan pickers, and the dumbbell and kettlebell weights. Nine plates reading «2 кг» would be
   * absurd where nine pills are exactly right; the question steps opt in.
   */
  variant?: 'pill' | 'tile';
}

/** Group of toggles; `multiple` switches from radio to checkbox semantics. */
export function ChipGroup<T extends string | number>({
  options,
  values,
  onToggle,
  label,
  multiple = false,
  variant = 'pill',
}: ChipGroupProps<T>) {
  const role = multiple ? ('checkbox' as const) : ('radio' as const);
  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={label}
      className={
        variant === 'tile'
          ? /*
             * A wrapping row of plates sized by their own labels, not a grid of equal columns.
             *
             * The grid came first and was wrong: a phone leaves 342px between the gutters, so three
             * equal columns are 108px wide with 80px of room inside, and «Тумба или устойчивая
             * ступенька» has a single word in it that needs 95px. Equal columns cannot hold answers
             * of unequal length — the longest one simply hangs over its own edge.
             *
             * `flex-auto` on the plates (see `OptionTile`) starts each one at its label's width and
             * then shares out whatever the row has left, so a row still ends flush at both margins
             * while «Коврик» and the тумба get the widths they actually need. Flex also stretches a
             * row to its tallest member, which is the one thing the grid was doing right: a label
             * that wraps to two lines lifts its neighbours rather than standing out of line.
             */
            'flex flex-wrap items-stretch gap-2'
          : 'flex flex-wrap gap-2'
      }
    >
      {options.map((o) => {
        const selected = values.includes(o.value);
        if (variant === 'tile') {
          return (
            <OptionTile
              key={String(o.value)}
              role={role}
              selected={selected}
              onClick={() => onToggle(o.value)}
            >
              {o.label}
            </OptionTile>
          );
        }
        return (
          <Chip
            key={String(o.value)}
            role={role}
            aria-checked={selected}
            selected={selected}
            onClick={() => onToggle(o.value)}
          >
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}
