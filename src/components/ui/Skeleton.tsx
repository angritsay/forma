import { clsx } from 'clsx';

export interface SkeletonProps {
  /** Size through classes (e.g. "h-4 w-32"). */
  className?: string;
  /** Radius: 'inner' (16px), 'card' (24px), 'pill'. Default 'inner'. */
  rounded?: 'inner' | 'card' | 'pill';
  /** Render N stacked text lines instead of one block. */
  lines?: number;
}

const RADIUS = { inner: 'rounded-inner', card: 'rounded-card', pill: 'rounded-pill' } as const;

export function Skeleton({ className, rounded = 'inner', lines }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={clsx('flex flex-col gap-2', className)} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={clsx(
              'h-3.5 animate-pulse bg-surface-3',
              RADIUS.pill,
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
