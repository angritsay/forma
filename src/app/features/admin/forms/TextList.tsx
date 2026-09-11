/**
 * Small form controls the admin editors share.
 *
 * They live here rather than in src/components/ui because they are not part of the product's design
 * language — nothing a customer ever sees uses them. They are the coach's tools, drawn with the
 * kit's own parts: the 13px field label, the sharp 48px field, the chip, the glyph.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Textarea } from '@/components/ui/Textarea';
import { useT } from '@/app/hooks/useT';

/**
 * The label over a compound control (a list of lines, a row of chips, a swatch row) — the same
 * 13px semibold the kit's Input puts over a field, with the hint directly under it so it
 * captions the right thing.
 */
export function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      {hint ? <p className="text-[13px] text-muted-2">{hint}</p> : null}
    </div>
  );
}

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
      {/*
       * The hint belongs under the label, not under the "add a line" button at the bottom. It read
       * as the caption of whatever field came next — "Минимум два пункта" sitting directly above
       * "Что будет в результате" says the wrong thing about the wrong field.
       */}
      <FieldLabel label={label} {...(hint ? { hint } : {})} />
      {rows.map((row, i) => (
        <div key={row.key} className="flex items-start gap-2">
          {/* Lines are numbered the way the brand numbers everything — 01, 02 — not bulleted. */}
          <span className="numeral tabular w-6 shrink-0 pt-3.5 text-[13px] text-muted-2">
            {String(i + 1).padStart(2, '0')}
          </span>
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
            icon="close"
            className="mt-1.5"
            onClick={() => write(rows.filter((r) => r.key !== row.key))}
          />
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        icon={<Glyph size={14}>+</Glyph>}
        onClick={() => write([...rows, ...keyed([''])])}
      >
        {t('app.exAddLine')}
      </Button>
    </div>
  );
}

/**
 * Multi-select as a row of toggles — shorter to scan than a multiple <select>. The chosen ones are
 * the white fill, the rest sit on --surface-3 behind a hairline, exactly as filter chips do.
 */
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
      <FieldLabel label={label} />
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <Chip
              key={o}
              size="sm"
              selected={on}
              onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
            >
              {o}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
