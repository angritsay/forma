import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import type { ActivityLevel } from '@/lib/training/types';
import { ACTIVITY_LEVELS } from './draft';
import { ACTIVITY_DESC, ACTIVITY_LABEL } from './labels';
import { OptionList } from './OptionList';
import type { StepProps } from './types';

export function StepActivity({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t('app.onbActivityTitle')} subtitle={t('app.onbActivityLead')} />
      <OptionList<ActivityLevel>
        label={t('app.onbActivityTitle')}
        value={draft.activityLevel}
        onChange={(activityLevel) => update({ activityLevel })}
        options={ACTIVITY_LEVELS.map((a) => ({
          value: a,
          label: t(ACTIVITY_LABEL[a]),
          description: t(ACTIVITY_DESC[a]),
        }))}
      />
    </div>
  );
}
