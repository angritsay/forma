import { useT } from '@/app/hooks/useT';
import type { Limitation } from '@/lib/training/types';
import { LIMITATIONS, toggleIn } from './draft';
import { LIMITATION_LABEL } from './labels';
import { OptionTile } from './OptionTile';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * «Что беречь?» and the plates; «Заменим упражнения, которые нагружают эти зоны» went with the
 * leads.
 *
 * **And, under them, the one consent this product genuinely needs.** Two of the six plates —
 * гипертония and беременность — are statements about a person's health, which 152-ФЗ ст. 10 treats
 * as a special category and allows to be processed only on a consent given for that purpose. It is
 * asked here rather than at sign-in because this is where the data is collected and because a
 * consent that arrives attached to the question it is about is one the reader can actually judge.
 *
 * It appears only after something has been picked. Somebody who answers «ничего, всё в порядке» has
 * told us nothing about their health, and putting a health-data checkbox in front of them would be
 * asking permission for a thing that is not happening.
 *
 * Declining is a real option: leave it unticked and go back to «ничего» — the workouts are then
 * prescribed without the substitutions, which is the honest trade and is what the note says.
 */
export function StepLimitations({ draft, update }: StepProps) {
  const { t } = useT();
  const toggle = (item: Limitation) =>
    update({ limitations: toggleIn(draft.limitations, item), limitationsNone: false });
  // Clearing the answer clears the permission with it: a consent that outlives the data it was
  // given for is the exact thing a consent log is supposed to make impossible.
  const chooseNone = () => update({ limitations: [], limitationsNone: true, healthConsent: false });
  const asked = draft.limitations.length > 0;

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
      {asked ? (
        <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-5 text-[13px] leading-snug text-muted">
          <input
            type="checkbox"
            checked={draft.healthConsent}
            onChange={(e) => update({ healthConsent: e.target.checked })}
            className="mt-0.5 size-5 shrink-0 accent-primary"
          />
          <span>{t('app.onbHealthConsent')}</span>
        </label>
      ) : null}
    </div>
  );
}
