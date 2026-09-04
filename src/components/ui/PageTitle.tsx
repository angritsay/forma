import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface PageTitleProps {
  title: ReactNode;
  /** Small label above the title. */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  className?: string;
}

const SIZE = { md: 'text-3xl', lg: 'text-4xl', xl: 'text-5xl' } as const;

/** Italic display heading in the reference style. */
export function PageTitle({
  title,
  eyebrow,
  subtitle,
  size = 'lg',
  align = 'left',
  as: Tag = 'h1',
  className,
}: PageTitleProps) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-2',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <Tag className={clsx('font-display text-balance', SIZE[size])}>{title}</Tag>
      {subtitle ? <p className="text-[15px] text-muted">{subtitle}</p> : null}
    </div>
  );
}
