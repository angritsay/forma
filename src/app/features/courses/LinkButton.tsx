/**
 * Anchor styled like the kit's Button — for links that leave the app (landing pages, payment).
 *
 * Inside a Telegram Mini App such a link must not navigate the webview: the app would be replaced
 * by the site, and a payment page needs the person's own browser. The click is handed to Telegram
 * instead, which opens it outside; on the open web the anchor behaves like any other.
 */
import { clsx } from 'clsx';
import type { MouseEvent, ReactNode } from 'react';
import type { ButtonSize, ButtonVariant } from '@/components/ui/Button';
import { externalTarget, openExternal } from '@/lib/telegram/webapp';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-primary hover:bg-accent/90',
  secondary: 'bg-surface-2 text-text border border-border hover:bg-surface-3',
  ghost: 'bg-transparent text-text hover:bg-white/5',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25',
};

const SIZE: Record<ButtonSize, string> = {
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-14 px-6 text-base',
};

export interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  /** Open in a new tab (a calendar, a payment page the user comes back from). */
  external?: boolean;
  className?: string;
}

export function LinkButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  external,
  className,
}: LinkButtonProps) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = externalTarget(href);
    if (target && openExternal(target)) e.preventDefault();
  };

  return (
    <a
      href={href}
      onClick={onClick}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className={clsx(
        'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold',
        'transition-[background-color,opacity,transform] duration-150 active:scale-[0.98]',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </a>
  );
}
