import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface DividerProps {
  /** Optional centered caption. */
  label?: ReactNode;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={clsx('border-0 border-t border-border', className)} />;
  }
  return (
    <div
      role="separator"
      className={clsx('flex items-center gap-3 text-xs text-muted-2', className)}
    >
      <span className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
