import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { prefersReducedMotion } from '@/lib/ui/motion';
import { useT } from '@/app/hooks/useT';
import { SlideFrame } from './SlideFrame';

/** How long the bar sits at its starting value before it grows — a beat to see where it was. */
const GROW_AFTER_MS = 900;

/**
 * After «Как сейчас с тренировками?»: what the slider feeds, and what happens after every workout.
 *
 * Line one is `startingScale` → `computeFitnessIndex`: with no self-test the index is built from
 * activity and experience alone, both read off the slider (`LEVEL_ACTIVITY`, `LEVEL_EXPERIENCE`),
 * and capped at `NO_TEST_INDEX_CAP`. Age is *not* in it until the assessment exists, which is why
 * the line says «по твоему уровню» and not «и возрасту». Line two is the difficulty sheet and
 * `recommendDifficulty`. Line three is `adaptScale`: +5 % when it was easy and complete, +2 % when
 * it was right, −5 % when it was hard, −10 % on pain — 2–10 %, either way.
 *
 * The picture is the two moments as one diagram: the three chips of the sheet with «нормально»
 * selected, and under them the scale as a rule that grows from 0.5 to 0.55 while «+5 %» lands
 * beside it. Under `prefers-reduced-motion` it is drawn already grown.
 */
export function AdaptSlide() {
  const { t } = useT();
  const [still] = useState(() => prefersReducedMotion());
  const [grown, setGrown] = useState(still);

  useEffect(() => {
    if (still) return;
    const id = window.setTimeout(() => setGrown(true), GROW_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [still]);

  return (
    <SlideFrame
      ground="bg-bg"
      chrome="light"
      aurora
      eyebrow={t('app.onbStoryAdaptEyebrow')}
      title={t('app.onbStoryAdaptTitle')}
      lines={[
        t('app.onbStoryAdaptLine1'),
        t('app.onbStoryAdaptLine2'),
        t('app.onbStoryAdaptLine3'),
      ]}
      visual={
        <div className="flex w-[300px] max-w-full flex-col gap-6">
          <div className="flex justify-center gap-2">
            <Chip>{t('app.onbStoryAdaptEasier')}</Chip>
            <Chip selected>{t('app.onbStoryAdaptNormal')}</Chip>
            <Chip>{t('app.onbStoryAdaptHarder')}</Chip>
          </div>
          {/* The kit's bar moves in 280ms; here the move *is* the picture, so it takes 700. */}
          <div className="flex items-center gap-3 [&_[role=progressbar]>div]:duration-700">
            <ProgressBar
              value={grown ? 0.55 : 0.5}
              tone="accent"
              label={t('app.onbStoryAdaptEyebrow')}
              className="flex-1"
            />
            <span
              className={clsx(
                'numeral tabular w-14 shrink-0 text-right text-[17px] text-accent',
                grown ? (still ? undefined : 'pop-in') : 'invisible',
              )}
            >
              {t('app.onbStoryAdaptDelta')}
            </span>
          </div>
        </div>
      }
    />
  );
}
