import { clsx } from 'clsx';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name. */
  label: string;
  disabled?: boolean;
}

/**
 * Toggle (role="switch") drawn as two rectangles: a hairline track and a square thumb that slides
 * to the far end. On, the track fills with `--primary` and the thumb inverts — that is ink on the
 * paper profile and white on the dark ground, so the same class reads on both. There is no
 * capsule and no shadow; the pill this replaced was the last rounded thing on the profile.
 */
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
        // 28px tall by design; `tap-target-y` (global.css) grows the hit area to 44px.
        'tap-target-y relative h-7 w-12 shrink-0 rounded-control border',
        'transition-colors duration-150 ease-(--ease-out) disabled:opacity-40',
        checked ? 'border-primary bg-primary' : 'border-border-strong bg-surface-3',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'absolute top-0.5 left-0.5 size-5 rounded-control transition-transform duration-150 ease-(--ease-out)',
          checked ? 'translate-x-5 bg-on-primary' : 'bg-text',
        )}
      />
    </button>
  );
}
