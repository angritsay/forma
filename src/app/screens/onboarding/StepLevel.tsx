import { clsx } from 'clsx';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { LEVEL_MAX, LEVEL_MIN } from './draft';
import { LEVEL_SLIDER_LABEL } from './labels';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * How much you train, on one scale from 1 to 10.
 *
 * This is one screen where there were two — «Насколько активны твои будни?» and «Сколько уже
 * тренируешься?» — each a set of four plates. The two questions were always asking around the same
 * thing from opposite sides, and the four-by-four grid made the athlete place themselves twice in
 * words they had not chosen. One scale asks it once, in the only unit everybody already has for
 * this: more or less than before.
 *
 * **The sentence is the answer; the number is the index of it.** It used to be the other way
 * round — «7» at 72px with «/10» beside it, and the words as a line under the track. The owner
 * turned it over: «нужно изменить акценты больше не на цифре, а на том, в каком состоянии». So
 * the state is set large at the top, and the figure survives only as the lit tick on the ruler,
 * which is the one thing a number is genuinely good for here — saying how far along the range this
 * answer sits. Nobody chooses «7»; they recognise «две-три тренировки в неделю».
 *
 * **The ruler, inverted.** The owner's reference is a black ruler on paper: small numerals above
 * short ticks, the chosen one taller and in ink. Ours is the same drawing on the app's ground, so
 * ink becomes white and the unchosen ticks fall back to `--muted-2`.
 *
 * **Why a native `range` under it.** The ruler is drawn by us, but the control is the browser's:
 * an invisible `input[type=range]` lies over it, so dragging, tapping anywhere along it, arrow
 * keys, Home/End and every assistive technology work without being re-implemented. `aria-valuetext`
 * carries the sentence, so what a screen reader announces is what the screen says, not «7».
 *
 * The default is the middle notch rather than an empty ruler: a control has to show a position
 * somewhere, and one parked at the far left is an answer nobody gave. The draft only records a
 * level once the athlete touches it, so the footer button stays disabled until they do — and
 * `shown` is what the screen draws meanwhile.
 *
 * "Touches it" has to include the athlete whose answer *is* the default: tapping is not the only
 * way to agree with a scale, and a handle already sitting on 6 cannot be dragged to 6. So the
 * wrapper commits `shown` on `pointerdown` — the tap that would have moved it is the answer,
 * whether or not it lands somewhere else — and a drag or an arrow key then overwrites it through
 * `onChange`. Nothing is recorded for someone who never touches it.
 */
const DEFAULT_SHOWN = Math.round((LEVEL_MIN + LEVEL_MAX) / 2);

const NOTCHES = Array.from({ length: LEVEL_MAX - LEVEL_MIN + 1 }, (_, i) => LEVEL_MIN + i);

export function StepLevel({ draft, update }: StepProps) {
  const { t, locale } = useT();
  const shown = draft.level ?? DEFAULT_SHOWN;
  const label = t(LEVEL_SLIDER_LABEL[shown - 1] ?? LEVEL_SLIDER_LABEL[0]!);

  return (
    <div className="flex flex-col gap-8">
      <Question text={t('app.onbLevelTitle')} />

      {/*
       * The state, at 800 — the one heavy line on the screen now that the question above it is a
       * single light weight. `min-h` holds three lines of it open whether or not this answer needs
       * them: the longest sentence on the scale is «Две тренировки в день, готовлюсь к
       * соревнованиям», and without the reserve the ruler would climb and drop under the finger
       * as the answer changes. `aria-hidden` because the control below announces the same words
       * through `aria-valuetext`, and hearing the answer twice is worse than hearing it once.
       */}
      <p
        aria-hidden="true"
        className="display flex min-h-[3.6em] items-start text-[30px] leading-[1.2] text-balance"
      >
        {label}
      </p>

      <div className="relative" onPointerDown={() => update({ level: shown })}>
        {/*
         * Ten numerals over ten ticks. The chosen one is white and a third taller; the rest are
         * `--muted-2`, present enough to show the range and quiet enough not to compete with the
         * sentence. `items-end` hangs every tick from the same baseline, so the tall one grows
         * downward from the row of numbers rather than pushing them about.
         */}
        <div aria-hidden="true" className="flex items-end justify-between">
          {NOTCHES.map((n) => {
            const on = n === shown;
            return (
              <span key={n} className="flex flex-col items-center gap-2">
                <span
                  className={clsx(
                    'numeral tabular text-[11px] leading-none transition-colors duration-150',
                    on ? 'text-text' : 'text-muted-2',
                  )}
                >
                  {formatNumber(locale, n)}
                </span>
                <span
                  className={clsx(
                    'w-px transition-all duration-150 ease-(--ease-out)',
                    on ? 'h-9 bg-text' : 'h-6 bg-muted-2',
                  )}
                />
              </span>
            );
          })}
        </div>

        {/*
         * The real control, invisible over the drawing. `h-full` rather than a thin strip so the
         * whole ruler is the hit area — 44px of it, which is the tap target the ticks themselves
         * are too thin to offer. Focus lands on the ruler as a whole (`focus-visible` on the
         * wrapper), because the handle it would otherwise ring is not drawn.
         */}
        <input
          type="range"
          min={LEVEL_MIN}
          max={LEVEL_MAX}
          step={1}
          value={shown}
          onChange={(e) => update({ level: Number(e.target.value) })}
          aria-label={t('app.onbLevelTitle')}
          aria-valuetext={label}
          className="absolute inset-0 size-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
      </div>
    </div>
  );
}
