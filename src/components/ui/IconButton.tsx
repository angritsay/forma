import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type IconButtonVariant = 'surface' | 'ghost' | 'primary' | 'on-art';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name (required: the button has no visible text). */
  label: string;
  /** Icon name from the kit set, or any node. */
  icon: IconName | ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const VARIANT: Record<IconButtonVariant, string> = {
  surface: 'bg-surface-2 border border-border text-text hover:bg-surface-3',
  ghost: 'bg-transparent text-text hover:bg-white/5',
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  'on-art': 'bg-black/10 text-on-primary hover:bg-black/20',
};

// `sm` is 36px by design; `tap-target` (global.css) grows its hit area to the 44px minimum.
const SIZE: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9 tap-target',
  md: 'h-11 w-11',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'surface', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-pill transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {typeof icon === 'string' ? (
        <Icon name={icon as IconName} size={size === 'sm' ? 18 : 20} />
      ) : (
        icon
      )}
    </button>
  );
});
