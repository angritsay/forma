import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface OptionTileProps {
  selected: boolean;
  onClick: () => void;
  /** `checkbox` in a multi-select group, `radio` in a single-select one. */
  role: 'checkbox' | 'radio';
  /** Full-width row of its own, instead of sharing a row with the other answers. */
  wide?: boolean;
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
 */
export function OptionTile({ selected, onClick, role, wide = false, children }: OptionTileProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={clsx(
        'flex min-h-12 items-center rounded-control border px-3.5 py-2.5 text-left',
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
      {children}
    </button>
  );
}
