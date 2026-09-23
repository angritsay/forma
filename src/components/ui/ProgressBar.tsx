import { clsx } from 'clsx';

export type ProgressTone = 'course' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';

export interface ProgressBarProps {
  /** Progress 0..1 (values outside are clamped). */
  value: number;
  /** Accessible name of the bar. */
  label?: string;
  /** Text shown to the right of the bar (e.g. "3/12"). */
  valueText?: string;
  /**
   * Fill colour. Default `accent`: progress is the light blue's job in the semantic colour map
   * (global.css header). `course` is the programme's identity colour — a course's own figure only.
   */
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
 * The fill is the brand's light blue `--accent` by default: progress is one of the light blue's
 * jobs in the semantic colour map (global.css header, design/CHANGELOG.md §15). It used to be the
 * programme colour whenever a course was in scope, which on «Форма с нуля» made every bar orange —
 * and orange means effort in this product, not «how far along». `course` is still here for a
 * figure that *is* the course (`--course-accent`, set by courseTileVars()); `primary` is plain
 * white for the rare bar that must not read as brand; the semantic tones are for a bar that
 * reports a result rather than progress.
 */
const TONE: Record<Exclude<ProgressTone, 'course'>, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export const COURSE_FILL = 'var(--course-accent, var(--accent))';

export function ProgressBar({
  value,
  label,
  valueText,
  tone = 'accent',
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
