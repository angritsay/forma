import { useT } from '@/app/hooks/useT';
import type { AgeBand } from '@/lib/training/types';
import { ChipGroup } from './ChipGroup';
import { AGE_BANDS } from './draft';
import { AGE_BAND_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * The age band, on its own screen.
 *
 * It used to share «Немного о тебе» with the sex and an optional weight field — a heading that
 * named none of the three questions under it, which is the shape §10 keeps taking apart. Asked on
 * its own, the question needs no kicker: a row of «18–24 … 65+» under «СКОЛЬКО тебе лет?» says
 * what it is.
 */
export function StepAge({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <Question text={t('app.onbAgeTitle')} />
      <ChipGroup<AgeBand>
        variant="tile"
        label={t('app.onbAgeTitle')}
        values={draft.ageBand ? [draft.ageBand] : []}
        onToggle={(ageBand) => update({ ageBand })}
        options={AGE_BANDS.map((b) => ({ value: b, label: t(AGE_BAND_LABEL[b]) }))}
      />
    </div>
  );
}
