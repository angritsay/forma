import { clsx } from 'clsx';
import type { ReactNode } from 'react';
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

/**
 * The self-test clock: big tabular digits in the display face on the brandbook's "crosshair"
 * plate — four corner ticks and no frame, the mark for the one key fact on a screen. The test
 * step has no course in scope, so the ticks are white like everything else here; a finished
 * timer is told by the status line going from grey to full white, not by a colour.
 */
export function TimerDisplay({ seconds, status, children, done }: TimerDisplayProps) {
  return (
    <div className="plate-target flex flex-col items-start gap-4 p-5">
      <span className="plate-ticks" aria-hidden="true" />
      <div aria-live="polite" className="numeral text-7xl leading-none">
        {formatClock(seconds)}
      </div>
      {status ? <p className={clsx('eyebrow-sentence', done && 'text-text')}>{status}</p> : null}
      {children ? <div className="flex w-full flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
