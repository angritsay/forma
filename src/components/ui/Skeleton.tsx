import { clsx } from 'clsx';

export interface SkeletonProps {
  /** Size through classes (e.g. "h-4 w-32"). */
  className?: string;
  /**
   * Which radius token the placeholder stands in for: 'inner', 'card' or 'control'. All three
   * are 0 in the sharp system, so the prop names the thing being loaded rather than a shape —
   * a card placeholder says `card` and stays in step with Card should the token ever move.
   */
  rounded?: 'inner' | 'card' | 'control';
  /** Render N stacked text lines instead of one block. */
  lines?: number;
}

const RADIUS = {
  inner: 'rounded-inner',
  card: 'rounded-card',
  control: 'rounded-control',
} as const;

/** A quiet --surface-3 block that breathes; the fade is the only motion. */
export function Skeleton({ className, rounded = 'inner', lines }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={clsx('flex flex-col gap-2', className)} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={clsx(
              'h-3.5 animate-pulse bg-surface-3',
              RADIUS.control,
              i === lines - 1 && 'w-2/3',
            )}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={clsx('animate-pulse bg-surface-3', RADIUS[rounded], className)}
    />
  );
}
