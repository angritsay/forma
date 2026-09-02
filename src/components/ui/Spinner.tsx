import { clsx } from 'clsx';
import { useKitLabels } from './KitContext';

export interface SpinnerProps {
  /** Pixel size. Default 20. */
  size?: number;
  className?: string;
  /** Accessible label; defaults to the kit "loading" label. */
  label?: string;
}

export function Spinner({ size = 20, className, label }: SpinnerProps) {
  const labels = useKitLabels();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label ?? labels.loading}
      className={clsx('animate-spin', className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
