import { clsx } from 'clsx';
import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  /** Optional counter shown after the label. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label?: string;
  /**
   * `underline`: white text over a 2px white rule. `fill`: the selected tab is the white fill
   * with black text inside a hairline frame. `pills` is the previous name for `fill` and keeps
   * working — there are no pills any more, only the frame.
   */
  variant?: 'underline' | 'fill' | 'pills';
  className?: string;
}

/** Id of the panel a tab controls — use it as the panel element's `id` with `role="tabpanel"`. */
export function tabPanelId(tabId: string): string {
  return `tabpanel-${tabId}`;
}

/*
 * Tabs are typographic: capitals at 12px tracked like a control label, and the selected one is
 * told apart by the white it wears — as a rule under it or as the fill behind it — never by a
 * second colour or a rounded slab. The counter is a plain tabular figure after the label rather
 * than a badge, so a tab with a count is still one word and a number.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  variant = 'underline',
  className,
}: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const fill = variant !== 'underline';

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
        'flex',
        fill ? 'border border-border-strong' : 'gap-5 border-b border-border',
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
              'control-label inline-flex items-center gap-2 text-[12px] transition-colors duration-150 ease-(--ease-out) disabled:opacity-40',
              fill
                ? clsx(
                    // 40px tall by design; `tap-target-y` (global.css) reaches the 44px minimum.
                    // Cells are ruled off from each other by a hairline, not by a gap.
                    // `min-w-0` so three long labels shrink their cells instead of running over
                    // each other — a Russian «Противопоказания» is wider than a third of a phone.
                    'tap-target-y h-10 min-w-0 flex-1 justify-center border-l border-border-strong px-2 first:border-l-0',
                    selected ? 'bg-primary text-on-primary' : 'text-muted hover:text-text',
                  )
                : clsx(
                    '-mb-px border-b-2 py-3',
                    selected
                      ? 'border-primary text-text'
                      : 'border-transparent text-muted hover:text-text',
                  ),
            )}
          >
            <span className={clsx(fill && 'min-w-0 truncate')}>{tab.label}</span>
            {tab.count !== undefined ? (
              <span className="tabular text-[11px] font-medium opacity-70">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
