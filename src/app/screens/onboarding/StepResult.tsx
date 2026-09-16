import { clsx } from 'clsx';
import { useMemo } from 'react';
import { Pill } from '@/components/ui/Pill';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { computeFitnessIndex } from '@/lib/training/assessment';
import { draftToTrainingProfile } from './draft';
import { LEVEL_LABEL } from './labels';
import type { StepProps } from './types';

/**
 * The result: the index as the one huge numeral, the level as a pill, and the footer's button.
 *
 * It used to be a kicker, a heading («Уровень 2: Средний»), the index inside a ring, a paragraph
 * on what the level means, and a numbered list of five components with a bar each — a report. The
 * owner's prototype (`design/ui_kits/app-v2`, «Прогресс») shows the same kind of fact as «12 /
 * ДНЕЙ ПОДРЯД»: a figure the height of four lines, one line under it, nothing else. So the index is
 * set that way — «54» at 800 with «из 100» at 200 on the same baseline, the brand's device — and
 * the level is the one pill under it. The paragraph and the components are gone: the number is
 * what the person came for, and the programme it produces is the explanation of it.
 *
 * Centred in the screen's height, like the prototype's «ГОТОВО!»: a short screen sitting at the
 * top of a tall one reads as unfinished.
 */
export function StepResult({ draft }: StepProps) {
  const { t, locale } = useT();
  const profile = useMemo(() => draftToTrainingProfile(draft), [draft]);
  const assessment = useMemo(() => (profile ? computeFitnessIndex(profile) : null), [profile]);

  if (!assessment) return null;

  const index = formatNumber(locale, assessment.index);
  const level = t('app.onbResultLevel', {
    n: formatNumber(locale, assessment.level),
    name: t(LEVEL_LABEL[assessment.level]),
  });

  return (
    <div className="flex min-h-[60dvh] flex-col justify-center gap-5">
      <p
        className="display flex items-baseline gap-3 leading-none"
        aria-label={`${t('app.onbResultEyebrow')}: ${index} ${t('app.onbIndexOutOf')}`}
      >
        {/*
         * 128px for the ninety-nine indices that are two digits, 84px for the hundredth.
         *
         * The first draft set every index at 128px on the reasoning that three digits are 250px
         * of the 342px column; the screenshot of an index of 100 showed that was wrong by the
         * width of «из 100» — the pair wrapped, «100» breaking after «10» and the light half
         * after «из». Measured at 390px, three digits and the unit only clear the right margin
         * from 84px down; 88 and 96 still push the unit into the gutter. The index is clamped to
         * 0..100 (`computeFitnessIndex`), so this is the one value that needs it.
         *
         * By digit count, not by container width: the count is the only thing that varies, and a
         * `clamp()` on a figure this size would move it on every phone for the sake of one value.
         * `whitespace-nowrap` on both halves so a narrower phone breaks the line rather than a
         * number.
         */}
        <span
          className={clsx(
            'tabular whitespace-nowrap',
            index.length > 2 ? 'text-[84px]' : 'text-[128px]',
          )}
          aria-hidden="true"
        >
          {index}
        </span>
        <span className="t-thin whitespace-nowrap text-[32px]" aria-hidden="true">
          {t('app.onbIndexOutOf')}
        </span>
      </p>
      <Pill tone="paper" className="self-start">
        {level}
      </Pill>
    </div>
  );
}
