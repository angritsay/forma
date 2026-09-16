import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Glyph } from '@/components/ui/Icon';

export interface OptionTileProps {
  selected: boolean;
  onClick: () => void;
  /** `checkbox` in a multi-select group, `radio` in a single-select one. */
  role: 'checkbox' | 'radio';
  /** Full-width row of its own, instead of sharing a row with the other answers. */
  wide?: boolean;
  /**
   * Draw the check that lands when the plate is picked. Off for a plate whose whole content is
   * one big numeral (the minutes), where the inversion is already the mark and a circle beside a
   * 28px figure would fight it.
   */
  mark?: boolean;
  children: ReactNode;
}

/**
 * One answer, as a plate you tap.
 *
 * The onboarding used to ask its questions with chips — 34px pills in a wrapping row. They worked
 * as filters, which is what a chip is for, and badly as answers: a pill is a word you read, and an
 * answer is a thing you choose. Nothing about the row said any of it could be pressed, and nothing
 * gave the eye a target.
 *
 * Two things follow from that and both are load-bearing:
 *
 *  - **the label wraps.** `Chip` carries `whitespace-nowrap`, so «Тумба или устойчивая ступенька» —
 *    thirty characters of tracked capitals — claimed more than half a row on its own and broke the
 *    grid into rags. A plate is allowed two lines.
 *  - **no `tap-target-y`.** A chip is 34px and needs the pseudo-element that lifts its hit area to
 *    44px; a plate is 48px and already past it, and the same pseudo-element inside a grid would
 *    overlap its neighbours.
 *
 * Selected is the white fill with black text — the one inversion the system uses for "this is the
 * thing that acts", the same as the primary button and the recommended row in the player's
 * difficulty sheet. It is the only fill in the group, so the chosen answer is found first.
 *
 * **Picking one looks like something.** A check in a circle lands on the plate on the spring
 * (`.pop-in`, design/CHANGELOG.md §10: «сделанное выглядит сделанным») — the same mark a delivered
 * challenge task gets. On the white plate the circle is ink with a paper check, the plate's own
 * inversion inverted back, so it reads on the fill it sits on. It is keyed on nothing and mounts
 * only while selected, so it pops once per pick and not on every re-render.
 */
export function OptionTile({
  selected,
  onClick,
  role,
  wide = false,
  mark = true,
  children,
}: OptionTileProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={clsx(
        'flex min-h-12 items-center gap-3 rounded-control border px-3.5 py-2.5 text-left',
        'text-[13px] font-semibold tracking-[0.04em] uppercase',
        'transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-out)',
        'active:scale-[0.99]',
        /*
         * `flex-auto`, not a fixed width: the plate starts at its label's own width and then takes
         * a share of whatever its row has left over, so «Коврик» stays small, «Тумба или устойчивая
         * ступенька» gets the room it needs, and the row still ends flush at the right margin.
         */
        wide ? 'w-full' : 'flex-auto',
        selected
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border bg-surface-2 text-text hover:bg-surface-3',
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {mark && selected ? (
        <span
          aria-hidden="true"
          className="pop-in flex size-5 shrink-0 items-center justify-center rounded-pill bg-on-primary text-primary"
        >
          <Glyph size={11}>✓</Glyph>
        </span>
      ) : null}
    </button>
  );
}
