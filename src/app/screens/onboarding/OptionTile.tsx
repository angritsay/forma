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
 *    thirty characters — claimed more than half a row on its own and broke the grid into rags. A
 *    plate is allowed two lines.
 *  - **no `tap-target-y`.** A chip is 34px and needs the pseudo-element that lifts its hit area to
 *    44px; a plate is 48px and already past it, and the same pseudo-element inside a grid would
 *    overlap its neighbours.
 *
 * Selected is the light blue with ink words — selection is the light blue's job in the semantic
 * colour map (global.css header, design/CHANGELOG.md §15), the same as a selected `Chip`. It is
 * the only fill in the group, so the chosen answer is found first.
 *
 * **Picking one looks like something.** A check in a circle lands on the plate on the spring
 * (`.pop-in`, design/CHANGELOG.md §10: «сделанное выглядит сделанным») — the same mark a delivered
 * club task gets. On the white plate the circle is ink with a paper check, the plate's own
 * inversion inverted back, so it reads on the fill it sits on (ink on light blue 14.7). It is keyed on nothing and mounts
 * only while selected, so it pops once per pick and not on every re-render.
 *
 * **The label is sentence case, and this file is why the rule needed a second pass.** The case came
 * off `.display`, `.font-display`, `.eyebrow` and `.control-label` at the root (PR #93), and it
 * could not reach a `uppercase tracking-[0.04em]` written into a component's own class list — so
 * the wizard shipped with «ПОВЫШЕННОЕ ДАВЛЕНИЕ» shouting under a «Что беречь?» that no longer did.
 * 13 → 15px with the tracking back to 0, and the plate does not move: sentence case sets about a
 * quarter narrower, so two more points of type fit the same 48px box. Measured at 390×844 on the
 * built stylesheet, the widths come out within a few pixels of the capitals they replace
 * («Повышенное давление» 221 → 218) and the rows pack exactly as before — so this buys legibility
 * rather than density. An audit note predicted «Что беречь?» would fall from four rows to three;
 * it does not, and 14px would be the size to try if the packing ever has to change.
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
        'text-[15px] font-semibold',
        'transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-out)',
        'active:scale-[0.99]',
        /*
         * `flex-auto`, not a fixed width: the plate starts at its label's own width and then takes
         * a share of whatever its row has left over, so «Коврик» stays small, «Тумба или устойчивая
         * ступенька» gets the room it needs, and the row still ends flush at the right margin.
         */
        wide ? 'w-full' : 'flex-auto',
        /* Chosen is the light blue with ink words, as every selection in the app. */
        selected
          ? 'border-accent bg-accent text-on-accent'
          : 'border-border bg-surface-2 text-text hover:bg-surface-3',
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {/*
       * The mark's room is held open whether or not the mark is there.
       *
       * It used to mount on selection, and a plate is `flex-auto` — so picking «25–34» made it
       * 32px wider, which pushed «35–44» off the end of the row and re-packed every plate below
       * it. The answers moved under the finger that had just chosen one («не хорошо что пилюли
       * перепрыгивают при выборе»), and on a six-answer question the whole grid changed shape.
       *
       * So the slot is always in the layout and only its contents come and go. `.pop-in` still
       * rides on the check itself, so picking still looks like something; what it no longer does
       * is move the other five answers. Plates that ask for no mark get no slot at all — nothing
       * to reserve, and their row packs as it always did.
       */}
      {mark ? (
        <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
          {selected ? (
            <span className="pop-in flex size-5 items-center justify-center rounded-pill bg-ink text-accent">
              <Glyph size={11}>✓</Glyph>
            </span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}
