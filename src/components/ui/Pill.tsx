import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export type PillTone = 'neutral' | 'course' | 'course-fill' | 'paper';

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

/*
 * A fact as a pill: «12 баллов», «Приз · час с тренером», «Пробная неделя · 7 дней». 28px tall,
 * 10px tracked capitals, fully rounded — the shape the owner's prototype (`design/ui_kits/app-v2`)
 * gives a small piece of information that is not a control. That is the whole distinction from
 * `Chip` and `Badge`, which stay on the 12px control radius: a chip is pressed or selected, a badge
 * is a state stamped on a card, a pill is read.
 *
 * `course` is the programme colour on the border and the words; `course-fill` is the colour as a
 * fill with the tile's black ink, for the one pill on a screen that is the point of it (the prize);
 * `paper` is white on ink, for a pill laid on a dark figure.
 */
const TONE: Record<PillTone, string> = {
  neutral: 'border-border-strong text-muted',
  course: 'border-course/60 text-course',
  'course-fill': 'border-transparent bg-course text-on-course',
  paper: 'border-transparent bg-paper text-ink',
};

export function Pill({ tone = 'neutral', className, children, ...rest }: PillProps) {
  return (
    <span
      className={clsx(
        /* `min-w-0` and no `shrink-0`: in a row it gives way and its words ellipsise, so a long
           prize can never push the kicker beside it off the screen. */
        'control-label inline-flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-pill border px-3 text-[10px]',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
