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
  surface: 'bg-transparent border border-border text-text hover:bg-surface-2',
  ghost: 'bg-transparent text-text hover:bg-white/5',
  primary: 'bg-accent text-on-primary hover:opacity-85',
  /*
   * `on-art` sits on a dark course tile or on a photograph, not on a pastel one any more, so it
   * darkens instead of lightening and carries a hairline of its own to stay findable against a
   * busy frame.
   */
  'on-art': 'bg-black/45 border border-white/25 text-white hover:bg-black/60',
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
        'inline-flex shrink-0 items-center justify-center rounded-control transition-colors',
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
