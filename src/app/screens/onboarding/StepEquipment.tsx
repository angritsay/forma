import { useT } from '@/app/hooks/useT';
import type { Equipment } from '@/content/schema';
import { ChipGroup } from './ChipGroup';
import { SELECTABLE_EQUIPMENT, WEIGHT_OPTIONS_KG, toggleIn } from './draft';
import { EQUIPMENT_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * «Что есть дома?» and the plates. The lead («Отметь всё… если ничего нет — тоже отлично») went;
 * an unticked screen is already the answer «ничего».
 *
 * The two kickers that stay — «Гантели, кг» / «Гири, кг» — are the exception §10 allows: a row
 * of «2 4 6 8» does not say which of the two weights it is, and both rows can be on screen at once.
 */
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
      <Question text={t('app.onbEquipmentTitle')} />
      <ChipGroup<Equipment>
        multiple
        variant="tile"
        label={t('app.onbEquipmentTitle')}
        values={draft.equipment}
        onToggle={toggleEquipment}
        options={SELECTABLE_EQUIPMENT.map((e) => ({ value: e, label: t(EQUIPMENT_LABEL[e]) }))}
      />
      {hasDumbbells ? (
        <section className="flex flex-col gap-3">
          <h2 className="eyebrow">{t('app.onbDumbbellWeights')}</h2>
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
          <h2 className="eyebrow">{t('app.onbKettlebellWeights')}</h2>
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
