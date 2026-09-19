import { useT } from '@/app/hooks/useT';
import type { Limitation } from '@/lib/training/types';
import { LIMITATION_NOTE_MAX, LIMITATIONS, toggleIn } from './draft';
import {
  LIMITATION_EMOJI,
  LIMITATION_LABEL,
  LIMITATION_NONE_EMOJI,
  LIMITATION_OTHER_EMOJI,
} from './labels';
import { OptionTile } from './OptionTile';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * «Что беречь?» and the plates; «Заменим упражнения, которые нагружают эти зоны» went with the
 * leads.
 *
 * **«Другое», and why a closed list needed one.** The six plates are the limitations the engine
 * can act on — each maps to a substitution rule — so the list cannot simply grow. But a neck, an
 * ankle, or an operation last spring fits none of them, and a question with no room for the answer
 * somebody actually has tells them the product is not for them. So the seventh plate opens a
 * field, and the hint under it says plainly what happens next: the coach reads it, the workouts do
 * not change by themselves. Promising a substitution we cannot make would be the worse answer.
 *
 * **And, under all of it, the one consent this product genuinely needs.** Two of the six plates —
 * гипертония and беременность — are statements about a person's health, which 152-ФЗ ст. 10 treats
 * as a special category and allows to be processed only on a consent given for that purpose; the
 * written note is the same kind of data and is covered by the same tick. It is asked here rather
 * than at sign-in because this is where the data is collected, and because a consent that arrives
 * attached to the question it is about is one the reader can actually judge.
 *
 * It appears only after something has been said. Somebody who answers «ничего, всё в порядке» has
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
  // given for is the exact thing a consent log is supposed to make impossible. The written note
  // goes with it — «ничего, всё в порядке» and a sentence about a shoulder cannot both be true.
  const chooseNone = () =>
    update({
      limitations: [],
      limitationsNone: true,
      healthConsent: false,
      limitationsOtherOn: false,
      limitationsOther: '',
    });
  const toggleOther = () =>
    update({ limitationsOtherOn: !draft.limitationsOtherOn, limitationsNone: false });
  const asked =
    draft.limitations.length > 0 ||
    (draft.limitationsOtherOn && draft.limitationsOther.trim().length > 0);

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
          <TileLabel emoji={LIMITATION_NONE_EMOJI} text={t('app.onbLimNone')} />
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
              <TileLabel emoji={LIMITATION_EMOJI[item]} text={t(LIMITATION_LABEL[item])} />
            </OptionTile>
          ))}
          {/* Last in the row, after every plate that names a part of the body: «Другое» is what
              is left over, and it only means anything once the named answers have been read. */}
          <OptionTile role="checkbox" selected={draft.limitationsOtherOn} onClick={toggleOther}>
            <TileLabel emoji={LIMITATION_OTHER_EMOJI} text={t('app.onbLimOther')} />
          </OptionTile>
        </div>
        {draft.limitationsOtherOn ? (
          <div className="flex flex-col gap-2">
            <textarea
              rows={3}
              maxLength={LIMITATION_NOTE_MAX}
              value={draft.limitationsOther}
              onChange={(e) => update({ limitationsOther: e.target.value })}
              placeholder={t('app.onbLimOtherPlaceholder')}
              aria-label={t('app.onbLimOther')}
              className="w-full resize-none rounded-control border border-border bg-surface-2 px-3.5 py-3 text-[15px] text-text placeholder:text-muted-2 focus:border-primary focus:outline-none"
            />
            <p className="text-[13px] leading-snug text-muted">{t('app.onbLimOtherHint')}</p>
          </div>
        ) : null}
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

/**
 * The picture and the word, with the picture in a slot of its own.
 *
 * `aria-hidden` on the emoji: a screen reader announcing «нога Колени» is worse than «Колени», and
 * the word already carries the whole answer — the picture is here to be scanned, not read.
 */
function TileLabel({ emoji, text }: { emoji: string; text: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className="text-base leading-none">
        {emoji}
      </span>
      <span className="min-w-0">{text}</span>
    </span>
  );
}
