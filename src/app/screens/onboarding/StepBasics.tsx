import { Input } from '@/components/ui/Input';
import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import type { AgeBand, Sex } from '@/lib/training/types';
import { ChipGroup } from './ChipGroup';
import { AGE_BANDS, SEXES, WEIGHT_MAX_KG, WEIGHT_MIN_KG } from './draft';
import { AGE_BAND_LABEL, SEX_LABEL } from './labels';
import type { StepProps } from './types';

function parseWeight(value: string): number | undefined {
  const n = Number(value.replace(',', '.'));
  if (value.trim() === '' || !Number.isFinite(n)) return undefined;
  if (n < WEIGHT_MIN_KG || n > WEIGHT_MAX_KG) return undefined;
  return Math.round(n * 10) / 10;
}

export function StepBasics({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-7">
      <PageTitle title={t('app.onbBasicsTitle')} subtitle={t('app.onbBasicsLead')} />
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">{t('app.onbAgeLabel')}</h2>
        <ChipGroup<AgeBand>
          label={t('app.onbAgeLabel')}
          values={draft.ageBand ? [draft.ageBand] : []}
          onToggle={(ageBand) => update({ ageBand })}
          options={AGE_BANDS.map((b) => ({ value: b, label: t(AGE_BAND_LABEL[b]) }))}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">{t('app.onbSexLabel')}</h2>
        <ChipGroup<Sex>
          label={t('app.onbSexLabel')}
          values={draft.sex ? [draft.sex] : []}
          onToggle={(sex) => update({ sex })}
          options={SEXES.map((s) => ({ value: s, label: t(SEX_LABEL[s]) }))}
        />
      </section>
      <Input
        type="number"
        inputMode="decimal"
        min={WEIGHT_MIN_KG}
        max={WEIGHT_MAX_KG}
        step={0.5}
        label={`${t('app.onbWeightLabel')} · ${t('app.onbOptional')}`}
        placeholder="70"
        value={draft.weightKg ?? ''}
        onChange={(e) => update({ weightKg: parseWeight(e.target.value) })}
        hint={t('app.onbWeightHint')}
      />
    </div>
  );
}
