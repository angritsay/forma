import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type IconButtonVariant = 'surface' | 'ghost' | 'primary' | 'on-art';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name (required: the button has no visible text). */
  label: string;
  /** Mark from the kit set — a glyph where one exists — or any node. */
  icon: IconName | ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

/*
 * A square with one mark in it, in the same black and white as Button: a hairline frame, bare
 * text, or the white fill. `on-art` sits over a photograph or a video and is the one that darkens
 * — an ink plate behind a light hairline — so it stays findable on a busy frame without ever
 * lightening into a pill of frosted glass.
 */
const VARIANT: Record<IconButtonVariant, string> = {
  surface: 'bg-transparent border border-border-strong text-text hover:bg-surface-2',
  ghost: 'bg-transparent text-text hover:bg-surface-2',
  primary: 'bg-primary text-on-primary hover:opacity-85',
  'on-art': 'bg-ink/55 border border-paper/25 text-paper hover:bg-ink/70',
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
        'inline-flex shrink-0 items-center justify-center rounded-control',
        'transition-[background-color,color,opacity,transform] duration-150 ease-(--ease-out) active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {typeof icon === 'string' ? (
        <Icon name={icon as IconName} size={size === 'sm' ? 16 : 18} />
      ) : (
        icon
      )}
    </button>
  );
});
