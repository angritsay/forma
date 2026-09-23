import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'course';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'control' | 'pill';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * The corner, and **the ground decides it, not the button**.
   *
   * `control` (the default) is the rounded rectangle at `--r-control` for a button on a flat
   * ground. `pill` is fully rounded, for a button laid on a photograph. See `SHAPE` below for
   * why the rule is drawn there and not by what the button does.
   */
  shape?: ButtonShape;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Icon rendered before the label. */
  icon?: ReactNode;
  /** Icon rendered after the label. */
  iconRight?: ReactNode;
}

/*
 * Buttons are black and white almost everywhere. The primary is a white fill with black text — the
 * interface accent is white now, and `--primary` flips to ink on paper, so the same class is the
 * black button the profile screen wants. Secondary is a raised surface behind a strong hairline,
 * ghost is text alone, danger is an outline with red text. Inside a programme none of those four
 * takes the programme colour: on a course screen the colour is on the cover, the progress and the
 * day number, and the button stays the one thing that is certainly a button.
 *
 * `course` is the one exception, and it is not a new idea — the club's «Вступить за 666 ₽ / мес»
 * has been a filled orange bar since that screen was drawn (`ClubPitch.tsx`), built by hand out of
 * `bg-course` because there was no variant for it. There is now, for the one job that earns it:
 * **the button that takes money on a screen that is selling.** On such a screen the white button is
 * just another white button, and the tab's own colour is what says «вот это и есть покупка».
 *
 * The ink is `text-tile-fg`, which `courseTileVars()` picks by measured contrast for whatever tile
 * the button sits under — near-black on orange, neon and bleu ciel, white on the club's electric
 * blue. It used to be a fixed near-black, which was safe only while every tile was pale; the third
 * palette put a dark blue among them.
 *
 * Do not reach for it anywhere else. A colour that marks the purchase stops marking anything the
 * moment a second button on the screen wears it.
 *
 * Hover lightens by one surface or drops to .85 opacity; press is a 2% scale. Nothing bounces.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-85',
  secondary: 'bg-surface-2 text-text border border-border-strong hover:bg-surface-3',
  ghost: 'bg-transparent text-muted hover:text-text',
  danger: 'bg-transparent text-danger border border-border-strong hover:bg-surface-2',
  course: 'bg-course text-tile-fg hover:opacity-90',
};

/*
 * 40 / 48 / 56 tall, and the label grew when the capitals went.
 *
 * It used to be 12–13px, because `.control-label` was capitals tracked .16em and that sets wide
 * enough that a 15px label would have burst the box — the padding did the work of making it read
 * as a button instead. Sentence case sets roughly a quarter narrower, so the same box holds two
 * more points of type: 14px on `sm`, 15px on `md` and `lg`. The box did not move; only the words
 * in it got legible. «Начать тренировку» measures ~176px at 15px sentence case against ~216px at
 * 13px tracked caps, so the widest label in the app gained room rather than losing it.
 *
 * `sm` is under the 44px touch minimum on its own — it is for rows of secondary actions — and
 * `tap-target-y` (global.css) grows its hit area without growing the box; the other two clear it.
 */
const SIZE: Record<ButtonSize, string> = {
  sm: 'tap-target-y h-10 px-4.5 text-[14px]',
  md: 'h-12 px-6.5 text-[15px]',
  lg: 'h-14 px-8 text-[15px]',
};

/*
 * The two corners, and the rule that picks between them.
 *
 * > A control laid on a photograph is a pill. A control on a flat ground is a rounded rectangle
 * > at `--r-control`.
 *
 * This replaces the older rule — pressed stays on the control radius, read may be a pill — which
 * the owner's two mockups broke by disagreeing: «Продолжить» on the course card's photograph is a
 * full pill, «Вступить за 666 ₽ / мес» on the club's page ground is a 16px rectangle. Both are
 * buttons and both get pressed, so purpose cannot be what tells them apart. Asked which one wins
 * she said «оставить оба», and the ground is what actually differs.
 *
 * The reason it holds: on a photograph a button has to announce that it is a separate object set
 * down on a picture, and full rounding is the strongest way to say so without a border or a
 * shadow. On a flat ground there is no picture to be separate from, and a pill there reads as a
 * tag — a thing you read — rather than a thing you press. `design/CHANGELOG.md` §13.
 *
 * So: pass `shape="pill"` when the button sits on an image, and leave it alone everywhere else.
 * Do not "unify" these; one of them is wrong in the other's place.
 */
const SHAPE: Record<ButtonShape, string> = {
  control: 'rounded-control',
  pill: 'rounded-pill',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    shape = 'control',
    loading = false,
    fullWidth = false,
    icon,
    iconRight,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'control-label inline-flex select-none items-center justify-center gap-2',
        'transition-[background-color,color,opacity,transform] duration-150 ease-(--ease-out) active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-40',
        SHAPE[shape],
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children ? <span className="truncate">{children}</span> : null}
      {iconRight}
    </button>
  );
});
