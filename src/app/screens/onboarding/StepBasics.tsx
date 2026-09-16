import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { useT } from '@/app/hooks/useT';
import type { AgeBand, Sex } from '@/lib/training/types';
import { ChipGroup } from './ChipGroup';
import { AGE_BANDS, parseWeightField, SEXES, WEIGHT_MAX_KG, WEIGHT_MIN_KG } from './draft';
import { AGE_BAND_LABEL, SEX_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * Age, sex, weight — one line and three sets of answers.
 *
 * The kickers «ВОЗРАСТ» and «ПОЛ» over the two groups went with the lead: a row of «18–24 … 65+»
 * says it is the age, and «Мужской / Женский» says it is the sex, so the words repeated what the
 * plates already said (design/CHANGELOG.md §10). The groups keep their names for a screen reader
 * through `aria-label`. The weight field names itself in its placeholder, and «необязательно» is
 * its trailing word rather than a label and a hint above and below it.
 */
export function StepBasics({ draft, update }: StepProps) {
  const { t } = useT();
  // The field keeps its own text so half-typed weights ("7" before "70") survive; only a valid
  // weight reaches the draft.
  const [weightText, setWeightText] = useState(() =>
    draft.weightKg === undefined ? '' : String(draft.weightKg),
  );
  const weight = parseWeightField(weightText);

  return (
    <div className="flex flex-col gap-7">
      <Question text={t('app.onbBasicsTitle')} />
      <ChipGroup<AgeBand>
        variant="tile"
        label={t('app.onbAgeLabel')}
        values={draft.ageBand ? [draft.ageBand] : []}
        onToggle={(ageBand) => update({ ageBand })}
        options={AGE_BANDS.map((b) => ({ value: b, label: t(AGE_BAND_LABEL[b]) }))}
      />
      <ChipGroup<Sex>
        variant="tile"
        label={t('app.onbSexLabel')}
        values={draft.sex ? [draft.sex] : []}
        onToggle={(sex) => update({ sex })}
        options={SEXES.map((s) => ({ value: s, label: t(SEX_LABEL[s]) }))}
      />
      <Input
        type="number"
        inputMode="decimal"
        min={WEIGHT_MIN_KG}
        max={WEIGHT_MAX_KG}
        step={0.5}
        aria-label={t('app.onbWeightLabel')}
        placeholder={t('app.onbWeightLabel')}
        trailing={<span className="text-[13px]">{t('app.onbOptional')}</span>}
        value={weightText}
        onChange={(e) => {
          setWeightText(e.target.value);
          update({ weightKg: parseWeightField(e.target.value).weightKg });
        }}
        error={
          weight.invalid
            ? t('app.onbWeightRange', { min: WEIGHT_MIN_KG, max: WEIGHT_MAX_KG })
            : undefined
        }
      />
    </div>
  );
}
