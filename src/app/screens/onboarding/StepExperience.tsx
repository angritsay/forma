import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import type { Experience } from '@/lib/training/types';
import { EXPERIENCES } from './draft';
import { EXPERIENCE_DESC, EXPERIENCE_LABEL } from './labels';
import { OptionList } from './OptionList';
import type { StepProps } from './types';

export function StepExperience({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t('app.onbExperienceTitle')} subtitle={t('app.onbExperienceLead')} />
      <OptionList<Experience>
        label={t('app.onbExperienceTitle')}
        value={draft.experience}
        onChange={(experience) => update({ experience })}
        options={EXPERIENCES.map((x) => ({
          value: x,
          label: t(EXPERIENCE_LABEL[x]),
          description: t(EXPERIENCE_DESC[x]),
        }))}
      />
    </div>
  );
}
