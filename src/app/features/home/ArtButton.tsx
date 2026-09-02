/**
 * Dark pill button for pastel "hero art" surfaces (inverse of the kit's primary button).
 * Renders an <a> when `href` is given, a <button> otherwise.
 */
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface ArtButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const BASE =
  'inline-flex h-12 select-none items-center justify-center gap-2 rounded-pill bg-on-primary px-5 text-[15px] font-semibold text-primary transition-[opacity,transform] active:scale-[0.98] hover:opacity-90';

export function ArtButton({
  children,
  icon,
  onClick,
  href,
  disabled,
  fullWidth,
  className,
}: ArtButtonProps) {
  const classes = clsx(BASE, fullWidth && 'w-full', disabled && 'opacity-50', className);
  if (href) {
    return (
      <a href={href} className={classes} aria-disabled={disabled || undefined}>
        {icon}
        <span className="truncate">{children}</span>
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
