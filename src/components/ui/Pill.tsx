import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export type PillTone =
  | 'neutral'
  | 'course'
  | 'course-fill'
  | 'paper'
  | 'neon'
  | 'orange'
  | 'ciel'
  | 'sky'
  | 'white'
  | 'ghost';

export type PillTilt = 'left' | 'right';

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  /**
   * A sticker's lean, ±5–6°: the owner's style A sets a tag or two on a hero field at a slant, as
   * if stuck on by hand. One or two per screen at most, and never on a pill inside a row of text —
   * a tilted pill in a line of type reads as a rendering bug, not a sticker.
   */
  tilt?: PillTilt;
}

/*
 * A fact as a pill: «12 баллов», «Приз · час с тренером», «Пробная неделя · 7 дней». 32px tall,
 * 13px sentence case, fully rounded — the shape the owner's prototype (`design/ui_kits/app-v2`)
 * gives a small piece of information that is not a control. That is the whole distinction from
 * `Chip` and `Badge`, which stay on the control radius: a chip is pressed or selected, a badge is
 * a state stamped on a card, a pill is read.
 *
 * It was 28px tall at 10px tracked capitals, and of everything in the kit this was the worst
 * punished by them: 10px is already the floor of legibility, and capitals at .16em took what was
 * left. It is the one place where the word «read» in the paragraph above was not true. Sentence
 * case at 13px is a third larger with no more set width, and the box grows one step to 32 to hold
 * it — still a pill, still smaller than a chip, and now actually readable.
 *
 * Note the corner is `--r-pill` and stays there whatever the ground is. The photograph-or-ground
 * rule in `Button` is about *controls*; a pill is a fact, and a fact is round everywhere.
 *
 * `course` is the programme colour on the border and the words; `course-fill` is the colour as a
 * fill with the tile's black ink, for the one pill on a screen that is the point of it (the prize);
 * `paper` is white on ink, for a pill laid on a dark figure.
 *
 * The third palette (global.css header) adds the named fills, one job each, all measured in
 * `tile.test.ts`:
 *
 *   - `neon` — the tags that ask for attention: «новое», «задание дня», «лидер», «сегодня».
 *     `--on-action` ink, 17.3.
 *   - `orange` — the beginners' section tag. Ink 6.04.
 *   - `ciel` — the coach's section tag. Ink 4.75.
 *   - `sky` — the brand's light blue, for a fact that belongs to the product rather than a section.
 *   - `white` — a sticker on the blue hero field: electric blue on white, 7.71.
 *   - `ghost` — an outline on the blue hero field: white words and a white hairline. White on the
 *     field is 7.71; the ring is decoration and carries nothing.
 *
 * The section colours are tags and never fields: a pill is the most colour a section may wear.
 */
const TONE: Record<PillTone, string> = {
  neutral: 'border-border-strong text-muted',
  course: 'border-course-accent/60 text-course-accent',
  'course-fill': 'border-transparent bg-course text-tile-fg',
  paper: 'border-transparent bg-paper text-ink',
  neon: 'border-transparent bg-action text-on-action',
  orange: 'border-transparent bg-orange text-ink',
  ciel: 'border-transparent bg-ciel text-ink',
  sky: 'border-transparent bg-accent text-on-accent',
  white: 'border-transparent bg-paper text-field',
  ghost: 'border-on-field/85 text-on-field',
};

const TILT: Record<PillTilt, string> = {
  left: '-rotate-6',
  right: 'rotate-5',
};

export function Pill({ tone = 'neutral', tilt, className, children, ...rest }: PillProps) {
  return (
    <span
      className={clsx(
        /* `min-w-0` and no `shrink-0`: in a row it gives way and its words ellipsise, so a long
           prize can never push the kicker beside it off the screen. */
        'control-label inline-flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-pill border px-3 text-[13px]',
        TONE[tone],
        tilt && TILT[tilt],
        className,
      )}
      {...rest}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
