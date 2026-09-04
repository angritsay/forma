import { clsx } from 'clsx';
import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  /** Optional counter badge. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label?: string;
  variant?: 'underline' | 'pills';
  className?: string;
}

/** Id of the panel a tab controls — use it as the panel element's `id` with `role="tabpanel"`. */
export function tabPanelId(tabId: string): string {
  return `tabpanel-${tabId}`;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  variant = 'underline',
  className,
}: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, dir: 1 | -1) => {
    const enabled = tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(from);
    const next = enabled[(pos + dir + enabled.length) % enabled.length] ?? enabled[0]!;
    const tab = tabs[next];
    if (!tab) return;
    onChange(tab.id);
    refs.current[next]?.focus();
  };

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      move(i, -1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={clsx(
        'flex gap-1',
        variant === 'underline' ? 'border-b border-border' : 'rounded-pill bg-surface-2 p-1',
        className,
      )}
    >
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={tabPanelId(tab.id)}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={onKeyDown(i)}
            className={clsx(
              'inline-flex items-center gap-2 font-medium transition-colors disabled:opacity-40',
              variant === 'underline'
                ? clsx(
                    '-mb-px border-b-2 px-3 py-3 text-[15px]',
                    selected
                      ? 'border-primary text-text'
                      : 'border-transparent text-muted hover:text-text',
                  )
                : clsx(
                    // 40px tall by design; `tap-target-y` (global.css) reaches the 44px minimum.
                    'tap-target-y h-10 flex-1 justify-center rounded-pill px-4 text-[15px]',
                    selected ? 'bg-primary text-on-primary' : 'text-muted hover:text-text',
                  ),
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={clsx(
                  'tabular rounded-pill px-1.5 text-xs',
                  selected && variant === 'pills' ? 'bg-black/10' : 'bg-white/10',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
