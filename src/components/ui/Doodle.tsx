import { clsx } from 'clsx';
import type { DoodleKind } from '@/content/schema';

export type { DoodleKind };

/**
 * The glyphs, each a few loose strokes on a 32×32 grid. They are drawn the way the swoosh is: one
 * gesture per stroke, a little uneven, ends left open where a marker would lift — a heart whose
 * last curve overshoots its start, a lotus whose petals do not quite meet. Straightened out they
 * would be icons, and the kit already has icons (`Icon.tsx`); these are the hand of style A.
 */
export const DOODLES: Record<DoodleKind, readonly string[]> = {
  /* An almond and a pupil — «смотрю, как ты двигаешься». */
  eye: [
    'M3 16 C 9 7.5, 23 7, 29 16.5',
    'M3.5 16.5 C 9.5 24.5, 22.5 25, 28.5 15.5',
    'M19 16 C 19 18, 17.6 19.4, 16 19.4 C 14.2 19.4, 12.9 17.9, 13 16 C 13.1 14.1, 14.6 12.8, 16.3 12.9 C 17.9 13.1, 19 14.3, 18.8 16.3',
  ],
  /* A dumbbell — the load he works out. */
  dumbbell: [
    'M9.5 16.2 C 14 15.8, 18 16.2, 22.5 15.8',
    'M6.2 10 C 5.6 13.5, 5.6 18.5, 6.3 22.2',
    'M9.8 10.8 C 9.3 14, 9.4 18.2, 9.9 21.4',
    'M25.8 9.8 C 26.4 13.5, 26.4 18.5, 25.7 22',
    'M22.2 10.8 C 22.7 14, 22.6 18, 22.1 21.2',
    'M3.2 14 C 3 15.3, 3 16.8, 3.3 18.2',
    'M28.8 13.8 C 29 15.2, 29 16.8, 28.7 18',
  ],
  /* A looping arrow — what comes next. */
  arrow: [
    'M3.5 23 C 8 12.5, 15.5 27, 19.5 15.5 C 21.5 10.5, 24.5 8.2, 28 7',
    'M22 5.8 C 24.2 6.4, 26.2 6.7, 28 7 C 27.1 8.8, 26.5 10.6, 26.2 12.6',
  ],
  /* A lotus on a line of water — yoga. */
  lotus: [
    'M16 24.5 C 11.2 19.8, 12 12, 16 6.5 C 20.2 12, 20.8 19.8, 16.4 24.8',
    'M15.6 24.8 C 9.6 24.2, 5 20.2, 4 14 C 9 14.4, 12.8 17, 15 21',
    'M16.4 24.8 C 22.4 24.2, 27 20.2, 28 14 C 23 14.4, 19.2 17, 17 21',
    'M7.5 28 C 13 29, 19 28.8, 24.8 27.6',
  ],
  /* A bowl with the warmth rising off it — food, not a diet. */
  bowl: [
    'M3.8 15.4 C 12 14.6, 20 15.2, 28.2 14.8',
    'M4.4 15.6 C 5.4 23.2, 10 27.2, 16 27.2 C 22 27.2, 26.6 23, 27.6 15.2',
    'M12.6 12 C 10.8 9.4, 14.8 7.4, 12.8 4.2',
    'M19.2 12 C 17.4 9.4, 21.4 7.4, 19.4 4.2',
  ],
  /* A speech bubble with three dots — the conversations. */
  talk: [
    'M7.5 19.6 C 4.6 16.8, 4 11, 6.2 7.4 C 12 5.6, 21.6 5.5, 26.8 7.6 C 28.8 11.8, 28.6 16.8, 26 19.6 C 21.8 21.2, 16 21.2, 12.2 20.6 L 7 25.2 L 8.2 20.2',
    'M11.2 13.4 L 11.3 13.5',
    'M16.2 13.4 L 16.3 13.5',
    'M21.2 13.4 L 21.3 13.5',
  ],
  /* The heart in place of the swoosh, on Nastia's card. */
  heart: [
    'M16 27 C 9 21.2, 3.6 16.2, 4.4 10.2 C 5.3 5, 12.2 3.8, 16 10.2 C 19.6 4, 26.6 5, 27.6 10.6 C 28.6 16.4, 22.2 21.6, 15.2 27.8',
  ],
};

export interface DoodleProps {
  kind: DoodleKind;
  /** Stroke width in CSS pixels, whatever the glyph's size. */
  strokeWidth?: number;
  className?: string;
}

/**
 * A hand-drawn glyph in the swoosh's stroke (`Swoosh.tsx`): round caps, `currentColor`, a line
 * that keeps its weight at any size (`non-scaling-stroke`). Decoration only — hidden from
 * assistive tech; the words beside it say what it means.
 *
 * The owner, on the coach tab's three points: «надо добавить визуал… и больше воздуха», and on
 * her card: «вместо подчёркивания сделай в таком же стиле сердечко». These are both.
 */
export function Doodle({ kind, strokeWidth = 2.5, className }: DoodleProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 32 32"
      className={clsx('block overflow-visible', className ?? 'size-8')}
    >
      {DOODLES[kind].map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
