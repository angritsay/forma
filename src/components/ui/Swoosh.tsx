import { clsx } from 'clsx';

export type SwooshTone = 'accent' | 'action';

export interface SwooshProps {
  /**
   * `accent` (default) is the light blue of the key word it underlines; `action` is the neon, for a
   * field whose key word is already set in light blue and wants the line to answer it.
   */
  tone?: SwooshTone;
  className?: string;
}

const TONE: Record<SwooshTone, string> = {
  accent: 'text-accent',
  action: 'text-action',
};

/**
 * The hand-drawn underline of style A — one stroke under the key word of a hero field.
 *
 * A single cubic with round caps, stretched to the width of whatever it sits under
 * (`preserveAspectRatio="none"`), so it follows a short word and a long one alike. It is drawn, not
 * typed: `text-decoration` would sit on the baseline and repeat under every letter, and the whole
 * point is one gesture that looks like it was made with a marker after the type was set.
 *
 * Decoration only — hidden from assistive tech, and it never carries meaning a reader would miss.
 */
export function Swoosh({ tone = 'accent', className }: SwooshProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 150 14"
      preserveAspectRatio="none"
      /* A caller that places it also sizes it; otherwise it is a 12px line the width of its box. */
      className={clsx('block overflow-visible', TONE[tone], className ?? 'h-3 w-full')}
    >
      <path
        d="M3 10 C 45 3, 100 2, 147 8"
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
