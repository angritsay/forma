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

/*
 * The same four looks as Button, kept in step by hand because an <a> cannot be a <button>: the
 * white fill, the raised surface behind a strong hairline, bare muted text, and the red outline.
 * None of them ever takes the programme colour.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-85',
  secondary: 'bg-surface-2 text-text border border-border-strong hover:bg-surface-3',
  ghost: 'bg-transparent text-muted hover:text-text',
  danger: 'bg-transparent text-danger border border-border-strong hover:bg-surface-2',
};

/* 40 / 48 / 56 tall with a 12–13px capitals label, as Button. */
const SIZE: Record<ButtonSize, string> = {
  sm: 'tap-target-y h-10 px-4.5 text-[12px]',
  md: 'h-12 px-6.5 text-[13px]',
  lg: 'h-14 px-8 text-[13px]',
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
        'control-label inline-flex select-none items-center justify-center gap-2 rounded-control',
        'transition-[background-color,color,opacity,transform] duration-150 ease-(--ease-out) active:scale-[0.98]',
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
