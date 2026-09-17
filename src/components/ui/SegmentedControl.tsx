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

/**
 * Radio-group styled as a switch; arrow keys move the selection.
 *
 * A hairline frame divided into cells by hairlines, with the chosen cell inverted — white fill,
 * black text — and the rest set in muted sentence case. No inner padding and no sliding thumb:
 * the switch is drawn with lines and one inversion, the same way the chips and the tabs are.
 *
 * **This is not the tab bar.** `BottomNav` builds its own segmented control — a pill container
 * with a sliding capsule and one seat per tab — and the two are different objects that happen to
 * share a name. Do not merge them: this one divides a box of options with rules, that one moves a
 * highlight between seats, and a change that suits one breaks the other. This control is used by
 * `BookScreen` (30 / 60 минут), `MarathonBoardScreen` (the week picker) and three admin screens.
 *
 * Contrast: the active cell is `--primary` with `--on-primary` on it — white and near-black,
 * either way round — so the inversion clears AA by a distance. The 3.65:1 hazard the audit found
 * belongs to the *tab bar's* lighter capsule, not here, and that bar already sets `--text` on it.
 */
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
        /*
         * `overflow-hidden` is load-bearing now that the radius is not 0: the selected segment is a
         * filled rectangle drawn inside this box, and the first and last one would otherwise paint
         * square corners over the rounded border and undo it.
         */
        'inline-flex overflow-hidden rounded-control border border-border-strong',
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
              'control-label inline-flex items-center justify-center gap-1.5 border-l border-border-strong first:border-l-0',
              'transition-colors duration-150 ease-(--ease-out)',
              // 32/40px tall by design; `tap-target-y` (global.css) reaches the 44px minimum.
              'tap-target-y disabled:opacity-40',
              // 14 / 15px, up from 11 / 12: sentence case set the labels free of their tracking.
              size === 'sm' ? 'h-8 px-3 text-[14px]' : 'h-10 px-4 text-[15px]',
              fullWidth && 'flex-1',
              selected ? 'bg-primary text-on-primary' : 'bg-transparent text-muted hover:text-text',
            )}
          >
            {o.icon ? <Icon name={o.icon} size={12} /> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
