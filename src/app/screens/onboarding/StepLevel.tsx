import { Slider } from '@/components/ui/Slider';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { LEVEL_MAX, LEVEL_MIN } from './draft';
import { LEVEL_SLIDER_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * How much you train, on one slider from 1 to 10.
 *
 * This is one screen where there were two — «Насколько активны твои будни?» and «Сколько уже
 * тренируешься?» — each a set of four plates. The two questions were always asking around the
 * same thing from opposite sides, and the four-by-four grid made the athlete place themselves
 * twice in words they had not chosen. A slider asks it once, in the only unit everybody already
 * has for this: more or less than before.
 *
 * **The number is never alone.** The figure is the big thing on the screen — the prototype's 800 +
 * 200 device, «7» against «/10» — but what it means is spelled out in a sentence under the track
 * and that sentence changes with the handle: «Давно не тренировался» at 1, «Тренируюсь много лет»
 * at 10. A bare 1–10 would be the athlete guessing at the app's private scale.
 *
 * The default is the middle notch rather than an empty track: a slider has to show a handle
 * somewhere, and a handle at the far left is an answer nobody gave. The draft only records a
 * level once the athlete touches the control, so the footer button stays disabled until they do —
 * and `shown` is what the screen draws meanwhile.
 *
 * "Touches the control" has to include the athlete whose answer *is* the default: dragging is not
 * the only way to agree with a slider, and a handle already sitting on 6 cannot be dragged to 6.
 * So the wrapper commits `shown` on `pointerdown` — the tap that would have moved it is the
 * answer, whether or not it lands somewhere else — and a drag or an arrow key then overwrites it
 * through `onChange`. Nothing is recorded for someone who never touches it.
 */
const DEFAULT_SHOWN = Math.round((LEVEL_MIN + LEVEL_MAX) / 2);

export function StepLevel({ draft, update }: StepProps) {
  const { t, locale } = useT();
  const shown = draft.level ?? DEFAULT_SHOWN;
  const label = t(LEVEL_SLIDER_LABEL[shown - 1] ?? LEVEL_SLIDER_LABEL[0]!);

  return (
    <div className="flex flex-col gap-7">
      <Question text={t('app.onbLevelTitle')} />

      {/*
       * The figure, set the way every other number in the product is: the value at 800 and its
       * scale at 200 on the same baseline. `aria-hidden` on the two halves — the slider below
       * carries the real value and its text through `aria-valuetext`, and a screen reader that
       * read this too would hear the answer twice.
       */}
      <p className="display flex items-baseline gap-2 leading-none" aria-hidden="true">
        <span className="tabular text-[72px]">{formatNumber(locale, shown)}</span>
        <span className="t-thin text-[28px]">/{formatNumber(locale, LEVEL_MAX)}</span>
      </p>

      <div onPointerDown={() => update({ level: shown })}>
        <Slider
          min={LEVEL_MIN}
          max={LEVEL_MAX}
          step={1}
          value={shown}
          onChange={(level) => update({ level })}
          ariaLabel={t('app.onbLevelTitle')}
          valueText={label}
          /* The words under the track, at reading size rather than as a caption: this is the
             answer, and the number above it is the shorthand for it. */
          descriptor={<span className="text-[15px] text-text">{label}</span>}
        />
      </div>
    </div>
  );
}
