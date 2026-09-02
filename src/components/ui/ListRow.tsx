import { clsx } from 'clsx';
import { forwardRef, type MouseEventHandler, type ReactNode } from 'react';
import { Icon } from './Icon';

export interface ListRowProps {
  /** Avatar, icon or thumbnail on the left. */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right slot; defaults to a chevron for interactive rows. */
  trailing?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  href?: string;
  disabled?: boolean;
  className?: string;
}

export const ListRow = forwardRef<HTMLElement, ListRowProps>(function ListRow(
  { leading, title, subtitle, trailing, onClick, href, disabled, className },
  ref,
) {
  const interactive = Boolean(onClick || href);
  const content = (
    <>
      {leading ? <span className="flex shrink-0 items-center text-muted">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        {subtitle ? <span className="block truncate text-sm text-muted">{subtitle}</span> : null}
      </span>
      <span className="flex shrink-0 items-center gap-2 text-muted">
        {trailing !== undefined ? trailing : interactive ? <Icon name="chevron" size={18} /> : null}
      </span>
    </>
  );
  const classes = clsx(
    'flex w-full items-center gap-3 px-4 py-3 text-left',
    interactive && 'rounded-inner transition-colors hover:bg-white/5 active:bg-white/10',
    disabled && 'pointer-events-none opacity-50',
    className,
  );
  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        aria-disabled={disabled}
      >
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={classes}
      >
        {content}
      </button>
    );
  }
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={classes}>
      {content}
    </div>
  );
});
