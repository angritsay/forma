import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  /** A small mark above the title — a glyph where one exists. Optional; the words do the job. */
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  /** Call to action (Button/link). */
  action?: ReactNode;
  className?: string;
}

/**
 * Nothing here yet, or something went wrong: a display-face heading, a line of body text and, if
 * there is something to do about it, one action. Set left, like everything else on a screen —
 * the previous version centred a framed icon over centred text and read as a placeholder
 * illustration rather than as a message from the app.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-start gap-3 px-5 py-10 text-left', className)}>
      {icon ? <Icon name={icon} size={16} className="text-muted-2" /> : null}
      <h3 className="font-display text-2xl text-balance">{title}</h3>
      {description ? <p className="max-w-[36ch] text-[15px] text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
