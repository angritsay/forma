import { clsx } from 'clsx';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name. */
  label: string;
  disabled?: boolean;
}

/** Pill toggle (role="switch"). */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-7 w-12 shrink-0 rounded-pill transition-colors disabled:opacity-50',
        checked ? 'bg-accent' : 'bg-white/15',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'absolute top-0.5 left-0.5 size-6 rounded-pill bg-primary shadow-card transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}
