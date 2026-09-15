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
 * Single-select list (radio semantics), set as plates.
 *
 * These were hairline rows: a rule above each option and a ✓ in the trailing column. As a way to
 * group a label with its description that was right, and as a way to say "press one of these" it
 * was not — a rule is a divider, and dividers are not controls. The rest of the onboarding now
 * answers its questions with plates (`OptionTile`), so these become plates too; four steps
 * reading one way and three another is worse than either.
 *
 * They stay one per row rather than sharing a row the way the short answers do, because each
 * carries a second line of description — two of those side by side would be a paragraph split
 * down the middle.
 */
export function OptionList<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: OptionListProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
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
              'flex w-full items-center gap-4 rounded-control border px-4 py-3.5 text-left',
              'transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-out)',
              'active:scale-[0.99]',
              selected
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface-2 text-text hover:bg-surface-3',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{o.label}</span>
              {o.description ? (
                <span
                  className={clsx(
                    'mt-0.5 block text-[13px]',
                    // On the white fill the muted grey would fall under AA, so the description
                    // takes the plate's own ink at reduced opacity instead of a fixed colour.
                    selected ? 'text-on-primary/70' : 'text-muted',
                  )}
                >
                  {o.description}
                </span>
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
