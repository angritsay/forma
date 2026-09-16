import { useT } from '@/app/hooks/useT';
import type { Goal } from '@/lib/training/types';
import { ChipGroup } from './ChipGroup';
import { GOALS } from './draft';
import { GOAL_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/** Five goals as plates; «Стать суше, не теряя силу» under «Сбросить жир» was the goal twice. */
export function StepGoal({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <Question text={t('app.onbGoalTitle')} />
      <ChipGroup<Goal>
        variant="tile"
        label={t('app.onbGoalTitle')}
        values={draft.goal ? [draft.goal] : []}
        onToggle={(goal) => update({ goal })}
        options={GOALS.map((g) => ({ value: g, label: t(GOAL_LABEL[g]) }))}
      />
    </div>
  );
}
