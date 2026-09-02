import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import type { Goal } from '@/lib/training/types';
import { GOALS } from './draft';
import { GOAL_DESC, GOAL_LABEL } from './labels';
import { OptionList } from './OptionList';
import type { StepProps } from './types';

export function StepGoal({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t('app.onbGoalTitle')} subtitle={t('app.onbGoalLead')} />
      <OptionList<Goal>
        label={t('app.onbGoalTitle')}
        value={draft.goal}
        onChange={(goal) => update({ goal })}
        options={GOALS.map((g) => ({
          value: g,
          label: t(GOAL_LABEL[g]),
          description: t(GOAL_DESC[g]),
        }))}
      />
    </div>
  );
}
