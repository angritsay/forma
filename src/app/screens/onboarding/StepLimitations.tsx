import { Chip } from '@/components/ui/Chip';
import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import type { Limitation } from '@/lib/training/types';
import { LIMITATIONS, toggleIn } from './draft';
import { LIMITATION_LABEL } from './labels';
import type { StepProps } from './types';

export function StepLimitations({ draft, update }: StepProps) {
  const { t } = useT();
  const toggle = (item: Limitation) =>
    update({ limitations: toggleIn(draft.limitations, item), limitationsNone: false });
  const chooseNone = () => update({ limitations: [], limitationsNone: true });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t('app.onbLimitationsTitle')} subtitle={t('app.onbLimitationsLead')} />
      <div role="group" aria-label={t('app.onbLimitationsTitle')} className="flex flex-wrap gap-2">
        <Chip
          role="checkbox"
          aria-checked={draft.limitationsNone}
          selected={draft.limitationsNone}
          icon="check"
          onClick={chooseNone}
        >
          {t('app.onbLimNone')}
        </Chip>
        {LIMITATIONS.map((item) => {
          const selected = draft.limitations.includes(item);
          return (
            <Chip
              key={item}
              role="checkbox"
              aria-checked={selected}
              selected={selected}
              onClick={() => toggle(item)}
            >
              {t(LIMITATION_LABEL[item])}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
