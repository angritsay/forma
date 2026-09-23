import { clsx } from 'clsx';
import { forwardRef } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name. The visible label is the row this sits in, so it is not drawn here. */
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A setting that is on or off.
 *
 * The kit's first one, and it exists because the product's first true boolean arrived: sound. The
 * alternatives were both worse — a row that opens a sheet with two options is a tap and a dismissal
 * for something the eye can already see the state of, and a row of text that toggles on tap looks
 * exactly like the rows beside it that navigate.
 *
 * **The light-blue fill is the "on" state** — the third palette's accent marks what is active
 * (global.css header; it was the white fill while the accent was white): it is the one thing in the
 * row that acts, so it is the one thing that is filled. Off
 * is `--surface-3` behind the same hairline every quiet control wears.
 *
 * `role="switch"` rather than a checkbox: a screen reader then says «вкл»/«выкл» instead of
 * «отмечено», which is what this actually means. The track is the whole hit area — 44px tall
 * including the invisible padding, so it clears the touch minimum without drawing a 44px box.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, label, disabled, className },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border',
        'transition-colors duration-150 ease-(--ease-out)',
        // The touch target, without the box: 44px tall, centred on the 24px track.
        'after:absolute after:-inset-y-2.5 after:-inset-x-1 after:content-[""]',
        checked ? 'border-accent bg-accent' : 'border-border bg-surface-3',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'block size-4.5 rounded-pill transition-transform duration-150 ease-(--ease-out)',
          checked ? 'translate-x-[22px] bg-on-accent' : 'translate-x-[3px] bg-muted',
        )}
      />
    </button>
  );
});
