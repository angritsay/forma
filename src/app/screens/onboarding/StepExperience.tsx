import { useT } from '@/app/hooks/useT';
import type { Experience } from '@/lib/training/types';
import { ChipGroup } from './ChipGroup';
import { EXPERIENCES } from './draft';
import { EXPERIENCE_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/** «Сколько уже тренируешься?» — and the answers are the years, not level names (see labels.ts). */
export function StepExperience({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <Question text={t('app.onbExperienceTitle')} />
      <ChipGroup<Experience>
        variant="tile"
        label={t('app.onbExperienceTitle')}
        values={draft.experience ? [draft.experience] : []}
        onToggle={(experience) => update({ experience })}
        options={EXPERIENCES.map((x) => ({ value: x, label: t(EXPERIENCE_LABEL[x]) }))}
      />
    </div>
  );
}
