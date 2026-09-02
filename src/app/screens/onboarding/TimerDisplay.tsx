import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { formatClock } from '@/i18n/index';

export interface TimerDisplayProps {
  seconds: number;
  /** Status line under the digits ("Time!", "Press Start to begin"). */
  status?: ReactNode;
  /** Control buttons. */
  children?: ReactNode;
  /** Highlight when the timer finished. */
  done?: boolean;
}

/** Big tabular digits for the self-test timers. */
export function TimerDisplay({ seconds, status, children, done }: TimerDisplayProps) {
  return (
    <Card level={2} className="flex flex-col items-center gap-4">
      <div
        aria-live="polite"
        className={clsx(
          'tabular text-center text-7xl font-bold leading-none',
          done && 'text-accent',
        )}
      >
        {formatClock(seconds)}
      </div>
      {status ? <p className="text-center text-sm text-muted">{status}</p> : null}
      {children ? (
        <div className="flex w-full flex-wrap justify-center gap-2">{children}</div>
      ) : null}
    </Card>
  );
}
