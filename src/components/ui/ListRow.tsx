import { clsx } from 'clsx';
import { forwardRef, type MouseEventHandler, type ReactNode } from 'react';
import { Glyph } from './Icon';

export interface ListRowProps {
  /** Avatar, numeral or thumbnail on the left. */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right slot; defaults to a `›` glyph for interactive rows. */
  trailing?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  href?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * One row of a list, ruled off from the row above by a hairline. Rows carry their own dividers
 * — a hairline on top, dropped on the first child — so a stack of them needs no box around it
 * and no `divide-y` on the parent; a list is lines, not a card of cards.
 */
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
        {subtitle ? (
          <span className="block truncate text-[13px] text-muted">{subtitle}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-2 text-muted-2">
        {trailing !== undefined ? trailing : interactive ? <Glyph size={16}>›</Glyph> : null}
      </span>
    </>
  );
  const classes = clsx(
    'flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-left first:border-t-0',
    interactive &&
      'transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 active:bg-surface-3',
    disabled && 'pointer-events-none opacity-40',
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
