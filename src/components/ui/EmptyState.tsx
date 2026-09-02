import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  /** Call to action (Button/link). */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      {icon ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-surface-2 text-muted">
          <Icon name={icon} size={26} />
        </span>
      ) : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-[32ch] text-[15px] text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
