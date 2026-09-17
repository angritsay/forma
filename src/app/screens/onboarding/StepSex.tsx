import { useT } from '@/app/hooks/useT';
import type { Sex } from '@/lib/training/types';
import { ChipGroup } from './ChipGroup';
import { SEXES } from './draft';
import { SEX_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * The sex, on its own screen.
 *
 * It is asked because the push-up norms the fitness index borrows are published per sex
 * (docs/TRAINING_SCIENCE.md §2) and for no other reason — which is why «Не хочу указывать» is one
 * of the three answers rather than a way out of the question: the index averages the two tables
 * for it, and nothing else in the product reads the field.
 */
export function StepSex({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <Question text={t('app.onbSexTitle')} />
      <ChipGroup<Sex>
        variant="tile"
        label={t('app.onbSexTitle')}
        values={draft.sex ? [draft.sex] : []}
        onToggle={(sex) => update({ sex })}
        options={SEXES.map((s) => ({ value: s, label: t(SEX_LABEL[s]) }))}
      />
    </div>
  );
}
