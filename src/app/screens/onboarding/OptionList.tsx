import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';

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

/**
 * Single-select list (radio semantics), set as ruled rows.
 *
 * Each option is a hairline row, not a card: the box only grouped a label with its description,
 * and a rule does that with less ink. The chosen row says so with a ✓ glyph in the trailing
 * column — the brand's tick, in type — where the previous design put a filled circle. The rows
 * are 56px and taller, so the whole line is the hit area.
 */
export function OptionList<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: OptionListProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col border-b border-border">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={clsx(
              'flex w-full items-center gap-4 border-t py-4 text-left',
              'transition-[border-color,transform] duration-150 ease-(--ease-out) active:scale-[0.99]',
              selected ? 'border-border-strong' : 'border-border',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{o.label}</span>
              {o.description ? (
                <span className="mt-0.5 block text-[13px] text-muted">{o.description}</span>
              ) : null}
            </span>
            <span className="flex w-5 shrink-0 justify-end" aria-hidden="true">
              {selected ? <Glyph size={16}>✓</Glyph> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
