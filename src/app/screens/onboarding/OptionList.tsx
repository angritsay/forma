import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

export interface OptionItem<T extends string | number> {
  value: T;
  label: string;
  description?: string;
}

export interface OptionListProps<T extends string | number> {
  options: readonly OptionItem<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** Accessible group name. */
  label: string;
}

/** Single-select list of tappable cards (radio semantics). */
export function OptionList<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: OptionListProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-3">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Card
            key={String(o.value)}
            level={selected ? 3 : 2}
            padding="sm"
            role="radio"
            aria-checked={selected}
            selected={selected}
            onClick={() => onChange(o.value)}
            className="flex items-center gap-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{o.label}</span>
              {o.description ? (
                <span className="mt-0.5 block text-sm text-muted">{o.description}</span>
              ) : null}
            </span>
            <span
              aria-hidden="true"
              className={
                selected
                  ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-primary text-on-primary'
                  : 'h-6 w-6 shrink-0 rounded-pill border border-border-strong'
              }
            >
              {selected ? <Icon name="check" size={14} strokeWidth={3} /> : null}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
