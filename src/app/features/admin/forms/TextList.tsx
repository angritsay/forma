/**
 * Small form controls the admin editors share.
 *
 * They live here rather than in src/components/ui because they are not part of the product's design
 * language — nothing a customer ever sees uses them. They are the coach's tools.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Textarea } from '@/components/ui/Textarea';
import { useT } from '@/app/hooks/useT';

/**
 * A list of paragraphs — how-to steps, cues, common mistakes. Russian only; en mirrors it.
 *
 * Rows are keyed by a generated id rather than by their index. With an index key, removing a line
 * makes React reuse the row's DOM node for its successor, which moves the caret to a different
 * textarea while the coach is typing. The ids live only here; the caller still sees a plain
 * string[].
 */
let lineSeq = 0;
const keyed = (values: string[]) => values.map((value) => ({ key: `ln_${(lineSeq += 1)}`, value }));

export function TextList({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const { t } = useT();
  const [rows, setRows] = useState(() => keyed(values));

  const write = (next: { key: string; value: string }[]) => {
    setRows(next);
    onChange(next.map((r) => r.value));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      {rows.map((row, i) => (
        <div key={row.key} className="flex items-start gap-2">
          <Textarea
            wrapperClassName="flex-1"
            rows={2}
            value={row.value}
            placeholder={placeholder}
            aria-label={`${label} ${i + 1}`}
            onChange={(e) =>
              write(rows.map((r) => (r.key === row.key ? { ...r, value: e.target.value } : r)))
            }
          />
          <IconButton
            size="sm"
            variant="ghost"
            label={t('app.exRemoveLine')}
            icon={<Icon name="close" size={16} />}
            onClick={() => write(rows.filter((r) => r.key !== row.key))}
          />
        </div>
      ))}
      <Button
        variant="ghost"
        icon={<Icon name="plus" size={16} />}
        onClick={() => write([...rows, ...keyed([''])])}
      >
        {t('app.exAddLine')}
      </Button>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

/** Multi-select as a row of toggles — shorter to scan than a multiple <select>. */
export function ChipToggles({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
            >
              <Chip tone={on ? 'accent' : 'default'} size="sm">
                {o}
              </Chip>
            </button>
          );
        })}
      </div>
    </div>
  );
}
