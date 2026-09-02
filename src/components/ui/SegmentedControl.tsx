import { clsx } from 'clsx';
import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: IconName;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible group name. */
  label?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

/** Radio-group styled as a pill switch; arrow keys move the selection. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  fullWidth = false,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, dir: 1 | -1) => {
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(from);
    const next = enabled[(pos + dir + enabled.length) % enabled.length] ?? enabled[0]!;
    const opt = options[next];
    if (!opt) return;
    onChange(opt.value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(i, -1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx(
        'inline-flex rounded-pill border border-border bg-surface-2 p-1',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={onKeyDown(i)}
            className={clsx(
              'inline-flex items-center justify-center gap-1.5 rounded-pill font-medium transition-colors',
              'disabled:opacity-40',
              size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-[15px]',
              fullWidth && 'flex-1',
              selected ? 'bg-primary text-on-primary' : 'text-muted hover:text-text',
            )}
          >
            {o.icon ? <Icon name={o.icon} size={size === 'sm' ? 14 : 16} /> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
