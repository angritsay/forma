/** Anchor styled like the kit's Button — for links that leave the app (landing pages). */
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { ButtonSize, ButtonVariant } from '@/components/ui/Button';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
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
  className?: string;
}

export function LinkButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  className,
}: LinkButtonProps) {
  return (
    <a
      href={href}
      className={clsx(
        'inline-flex select-none items-center justify-center gap-2 rounded-pill font-semibold',
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
