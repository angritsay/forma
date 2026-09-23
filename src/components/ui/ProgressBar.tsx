import { clsx } from 'clsx';

export type ProgressTone = 'course' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';

export interface ProgressBarProps {
  /** Progress 0..1 (values outside are clamped). */
  value: number;
  /** Accessible name of the bar. */
  label?: string;
  /** Text shown to the right of the bar (e.g. "3/12"). */
  valueText?: string;
  /** Fill colour. Default `course`: the programme colour if a course is in scope, else white. */
  tone?: ProgressTone;
  size?: 'sm' | 'md';
  /**
   * What the bar lies on. `dark` (default) is charcoal or a surface card; `field` is the blue hero
   * field, where the track is a white alpha and the fill is white — the programme's colour as a
   * thin rule on electric blue would be one more colour on a field that already has its two.
   */
  ground?: 'dark' | 'field';
  className?: string;
}

/*
 * The fill is the programme colour when a course is in scope — `--course-accent`, set by
 * courseTileVars() on the course's card or screen — and white otherwise. It is the *accent* and
 * not the tile because a bar is a thin figure on the ground: the club's and the coach's blues
 * measure 2.26 and 4.37 on charcoal and would all but vanish, and the accent is exactly the tile's
 * colour made readable there (light blue for both blues, the tile itself for the rest). That is rule 1 of the
 * brandbook in one control: the bar is one of the three places the colour may land, and on a
 * screen with no course there is no colour at all. `primary` and `accent` force white (they are
 * the same white now; `accent` is kept for callers that still say it), and the semantic tones are
 * for a bar that reports a result rather than progress.
 */
const TONE: Record<Exclude<ProgressTone, 'course'>, string> = {
  primary: 'bg-primary',
  accent: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export const COURSE_FILL = 'var(--course-accent, var(--primary))';

export function ProgressBar({
  value,
  label,
  valueText,
  tone = 'course',
  size = 'md',
  ground = 'dark',
  className,
}: ProgressBarProps) {
  const onField = ground === 'field';
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-valuetext={valueText}
        /*
         * A rule, not a capsule: 4px, square ends, --surface-3 behind it. The rounded 6/10px bar
         * was the most repeated pill shape in the product — one per course, per day, per stat —
         * and thinning it and squaring the ends is most of what makes a list of courses read as
         * a ruled index rather than a dashboard.
         */
        className={clsx(
          'w-full overflow-hidden',
          onField ? 'bg-paper/20' : 'bg-surface-3',
          size === 'sm' ? 'h-0.5' : 'h-1',
        )}
      >
        <div
          className={clsx(
            'h-full transition-[width] duration-280 ease-(--ease-out)',
            onField ? 'bg-on-field' : tone !== 'course' && TONE[tone],
          )}
          style={{
            width: `${v * 100}%`,
            backgroundColor: tone === 'course' && !onField ? COURSE_FILL : undefined,
          }}
        />
      </div>
      {valueText ? (
        <span
          className={clsx(
            'numeral tabular shrink-0 text-[11px]',
            onField ? 'text-on-field/85' : 'text-muted',
          )}
        >
          {valueText}
        </span>
      ) : null}
    </div>
  );
}
