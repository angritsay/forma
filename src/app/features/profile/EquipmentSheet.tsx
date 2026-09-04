import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { Equipment } from '@/content/schema';
import type { UserTrainingProfile } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';
import { ChipGroup } from '@/app/screens/onboarding/ChipGroup';
import { SELECTABLE_EQUIPMENT, toggleIn, WEIGHT_OPTIONS_KG } from '@/app/screens/onboarding/draft';
import { EQUIPMENT_LABEL } from '@/app/screens/onboarding/labels';

export interface EquipmentSheetProps {
  open: boolean;
  profile: UserTrainingProfile;
  busy: boolean;
  onClose: () => void;
  onSave: (equipment: Equipment[], dumbbellKg: number[], kettlebellKg: number[]) => void;
}

/** Same chips as onboarding: equipment plus dumbbell / kettlebell weights. */
export function EquipmentSheet({ open, profile, busy, onClose, onSave }: EquipmentSheetProps) {
  const { t } = useT();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [dumbbellKg, setDumbbellKg] = useState<number[]>([]);
  const [kettlebellKg, setKettlebellKg] = useState<number[]>([]);
  const wasOpen = useRef(false);

  // Seed only when the sheet opens: a profile update elsewhere must not wipe an edit in progress.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setEquipment(profile.equipment.filter((e) => e !== 'none'));
      setDumbbellKg(profile.dumbbellKg ?? []);
      setKettlebellKg(profile.kettlebellKg ?? []);
    }
    wasOpen.current = open;
  }, [open, profile]);

  const weightOptions = WEIGHT_OPTIONS_KG.map((kg) => ({ value: kg, label: String(kg) }));
  const hasDumbbells = equipment.includes('dumbbells');
  const hasKettlebell = equipment.includes('kettlebell');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('app.profileEquipmentTitle')}
      footer={
        <Button
          size="lg"
          fullWidth
          loading={busy}
          onClick={() => onSave(equipment, dumbbellKg, kettlebellKg)}
        >
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 py-2">
        <p className="text-[15px] text-muted">{t('app.profileEquipmentLead')}</p>
        <ChipGroup<Equipment>
          multiple
          label={t('app.profileEquipmentTitle')}
          values={equipment}
          onToggle={(item) => setEquipment((list) => toggleIn(list, item))}
          options={SELECTABLE_EQUIPMENT.map((e) => ({ value: e, label: t(EQUIPMENT_LABEL[e]) }))}
        />
        {hasDumbbells ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted">{t('app.onbDumbbellWeights')}</h3>
            <ChipGroup<number>
              multiple
              label={t('app.onbDumbbellWeights')}
              values={dumbbellKg}
              onToggle={(kg) => setDumbbellKg((list) => toggleIn(list, kg))}
              options={weightOptions}
            />
          </section>
        ) : null}
        {hasKettlebell ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted">{t('app.onbKettlebellWeights')}</h3>
            <ChipGroup<number>
              multiple
              label={t('app.onbKettlebellWeights')}
              values={kettlebellKg}
              onToggle={(kg) => setKettlebellKg((list) => toggleIn(list, kg))}
              options={weightOptions}
            />
          </section>
        ) : null}
      </div>
    </Sheet>
  );
}
