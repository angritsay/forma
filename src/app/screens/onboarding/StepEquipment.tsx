import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import type { Equipment } from '@/content/schema';
import { ChipGroup } from './ChipGroup';
import { SELECTABLE_EQUIPMENT, WEIGHT_OPTIONS_KG, toggleIn } from './draft';
import { EQUIPMENT_LABEL } from './labels';
import type { StepProps } from './types';

export function StepEquipment({ draft, update }: StepProps) {
  const { t } = useT();
  const hasDumbbells = draft.equipment.includes('dumbbells');
  const hasKettlebell = draft.equipment.includes('kettlebell');
  const weightOptions = WEIGHT_OPTIONS_KG.map((kg) => ({ value: kg, label: String(kg) }));

  const toggleEquipment = (item: Equipment) => {
    const equipment = toggleIn(draft.equipment, item);
    update({
      equipment,
      dumbbellKg: equipment.includes('dumbbells') ? draft.dumbbellKg : [],
      kettlebellKg: equipment.includes('kettlebell') ? draft.kettlebellKg : [],
    });
  };

  return (
    <div className="flex flex-col gap-7">
      <PageTitle title={t('app.onbEquipmentTitle')} subtitle={t('app.onbEquipmentLead')} />
      <ChipGroup<Equipment>
        multiple
        label={t('app.onbEquipmentTitle')}
        values={draft.equipment}
        onToggle={toggleEquipment}
        options={SELECTABLE_EQUIPMENT.map((e) => ({ value: e, label: t(EQUIPMENT_LABEL[e]) }))}
      />
      {hasDumbbells ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">{t('app.onbDumbbellWeights')}</h2>
          <ChipGroup<number>
            multiple
            label={t('app.onbDumbbellWeights')}
            values={draft.dumbbellKg}
            onToggle={(kg) => update({ dumbbellKg: toggleIn(draft.dumbbellKg, kg) })}
            options={weightOptions}
          />
        </section>
      ) : null}
      {hasKettlebell ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">{t('app.onbKettlebellWeights')}</h2>
          <ChipGroup<number>
            multiple
            label={t('app.onbKettlebellWeights')}
            values={draft.kettlebellKg}
            onToggle={(kg) => update({ kettlebellKg: toggleIn(draft.kettlebellKg, kg) })}
            options={weightOptions}
          />
        </section>
      ) : null}
    </div>
  );
}
