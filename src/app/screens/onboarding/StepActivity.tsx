import { useT } from '@/app/hooks/useT';
import type { ActivityLevel } from '@/lib/training/types';
import { ChipGroup } from './ChipGroup';
import { ACTIVITY_LEVELS } from './draft';
import { ACTIVITY_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * Plates, not rows with a description each. «Прогулки и дела по дому, 3–5 тыс. шагов в день»
 * under «Немного двигаюсь» was a subtitle under a row, which is the first thing §10 removes; the
 * four answers read on their own, and «не считая тренировок» is now in the question — «будни»
 * is the week outside training.
 */
export function StepActivity({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <Question text={t('app.onbActivityTitle')} />
      <ChipGroup<ActivityLevel>
        variant="tile"
        label={t('app.onbActivityTitle')}
        values={draft.activityLevel ? [draft.activityLevel] : []}
        onToggle={(activityLevel) => update({ activityLevel })}
        options={ACTIVITY_LEVELS.map((a) => ({ value: a, label: t(ACTIVITY_LABEL[a]) }))}
      />
    </div>
  );
}
