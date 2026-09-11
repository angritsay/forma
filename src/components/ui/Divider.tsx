import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface DividerProps {
  /** Optional caption set in the line, as a kicker. */
  label?: ReactNode;
  className?: string;
}

/** The brand's divider: a 1px hairline in --border (`.hairline`, global.css), optionally captioned. */
export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={clsx('hairline', className)} />;
  }
  return (
    <div role="separator" className={clsx('eyebrow flex items-center gap-3', className)}>
      <span className="hairline flex-1" />
      <span>{label}</span>
      <span className="hairline flex-1" />
    </div>
  );
}
