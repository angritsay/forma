/**
 * Anchor styled like the kit's Button — for links that leave the app (landing pages, payment).
 *
 * Inside a Telegram Mini App such a link must not navigate the webview: the app would be replaced
 * by the site, and a payment page needs the person's own browser. The click is handed to Telegram
 * instead, which opens it outside; on the open web the anchor behaves like any other.
 */
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { ButtonShape, ButtonSize, ButtonVariant } from '@/components/ui/Button';
import { externalLinkProps } from '@/app/hooks/useExternalLink';

/*
 * The same looks as Button, kept in step by hand because an <a> cannot be a <button>: the white
 * fill, the raised surface behind a strong hairline, bare muted text, the red outline, and the
 * programme colour. The first four never take the programme colour; `course` is the exception
 * Button's own `VARIANT` table explains, and it belongs here as much as there — the button that
 * takes money is usually a link out to the payment page rather than a <button>. So do the neon
 * `action` (the screen's one main button), the club's `gradient` (the warm half of the crossroads
 * gradient under ink — the club's «Вступить» is exactly a link out to the till) and `on-field`
 * (white on the blue hero field).
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-85',
  secondary: 'bg-surface-2 text-text border border-border-strong hover:bg-surface-3',
  ghost: 'bg-transparent text-muted hover:text-text',
  danger: 'bg-transparent text-danger border border-border-strong hover:bg-surface-2',
  course: 'bg-course text-tile-fg hover:opacity-90',
  action: 'bg-action text-on-action hover:opacity-90',
  gradient: 'bg-warm text-ink hover:opacity-90',
  'on-field': 'bg-paper text-field hover:opacity-90',
};

/* 40 / 48 / 56 tall with a 14–15px sentence-case label, as Button — keep the two tables equal. */
const SIZE: Record<ButtonSize, string> = {
  sm: 'tap-target-y h-10 px-4.5 text-[14px]',
  md: 'h-12 px-6.5 text-[15px]',
  lg: 'h-14 px-8 text-[15px]',
};

/* The photograph-or-ground rule, as Button. Its `SHAPE` table carries the reasoning. */
const SHAPE: Record<ButtonShape, string> = {
  control: 'rounded-control',
  pill: 'rounded-pill',
};

export interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `pill` for a link-button laid on a photograph; the default sits on a flat ground. */
  shape?: ButtonShape;
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
  shape = 'control',
  fullWidth,
  icon,
  external,
  className,
}: LinkButtonProps) {
  return (
    <a
      {...externalLinkProps(href)}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className={clsx(
        'control-label inline-flex select-none items-center justify-center gap-2',
        'transition-[background-color,color,opacity,transform] duration-150 ease-(--ease-out) active:scale-[0.98]',
        SHAPE[shape],
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
