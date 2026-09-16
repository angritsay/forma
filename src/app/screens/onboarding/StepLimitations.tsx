import { useT } from '@/app/hooks/useT';
import type { Limitation } from '@/lib/training/types';
import { LIMITATIONS, toggleIn } from './draft';
import { LIMITATION_LABEL } from './labels';
import { OptionTile } from './OptionTile';
import { Question } from './Question';
import type { StepProps } from './types';

/** «Что беречь?» and the plates; «Заменим упражнения, которые нагружают эти зоны» went with the leads. */
export function StepLimitations({ draft, update }: StepProps) {
  const { t } = useT();
  const toggle = (item: Limitation) =>
    update({ limitations: toggleIn(draft.limitations, item), limitationsNone: false });
  const chooseNone = () => update({ limitations: [], limitationsNone: true });

  return (
    <div className="flex flex-col gap-6">
      <Question text={t('app.onbLimitationsTitle')} />
      <div className="flex flex-col gap-4">
        {/*
         * «Ничего, всё в порядке» is not one of the answers, it is the absence of all of them — so
         * it stands on its own above the group, outside it, separated by a gap twice the one
         * between the plates. Picking it clears the rest, and picking anything else clears it; the
         * two cannot both be true, and the gap says they are not in the same set.
         *
         * The width says nothing here: plates share out their row, so the last one on a row is
         * full-width too. Only the gap and the order carry it.
         */}
        <OptionTile wide role="checkbox" selected={draft.limitationsNone} onClick={chooseNone}>
          {t('app.onbLimNone')}
        </OptionTile>
        <div
          role="group"
          aria-label={t('app.onbLimitationsTitle')}
          className="flex flex-wrap items-stretch gap-2"
        >
          {LIMITATIONS.map((item) => (
            <OptionTile
              key={item}
              role="checkbox"
              selected={draft.limitations.includes(item)}
              onClick={() => toggle(item)}
            >
              {t(LIMITATION_LABEL[item])}
            </OptionTile>
          ))}
        </div>
      </div>
    </div>
  );
}
