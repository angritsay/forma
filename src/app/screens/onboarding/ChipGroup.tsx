import { Chip } from '@/components/ui/Chip';

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
}

export interface ChipGroupProps<T extends string | number> {
  options: readonly ChipOption<T>[];
  /** Selected values (one entry for single-select). */
  values: readonly T[];
  onToggle: (value: T) => void;
  label: string;
  multiple?: boolean;
}

/** Wrapping row of toggle chips; `multiple` switches from radio to checkbox semantics. */
export function ChipGroup<T extends string | number>({
  options,
  values,
  onToggle,
  label,
  multiple = false,
}: ChipGroupProps<T>) {
  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={label}
      className="flex flex-wrap gap-2"
    >
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <Chip
            key={String(o.value)}
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={selected}
            selected={selected}
            onClick={() => onToggle(o.value)}
          >
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}
