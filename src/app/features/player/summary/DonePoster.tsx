/**
 * «ГОТОВО!» — the head of the summary, drawn from the owner's prototype (`design/ui_kits/app-v2`,
 * «Готово!»).
 *
 * The screen that stood here opened with a kicker, the workout's name in the display face, a
 * subtitle «Форма с нуля · Неделя 2», a crosshair plate holding the clock, and two tiles under it.
 * The owner's note on the tab was «МИНИМУМ текста, максимум визуала и дофамина», and her prototype
 * answers the same moment with one word at the size of the screen. So: the workout and its course
 * shrink to the kicker above, «Готово!» is the line, and everything the session cost is three
 * numerals on a rule.
 *
 * The warm line under the word is computed, never written: it is the streak with today counted,
 * and when there is no streak to report — the store is not loaded, or this is an old session being
 * re-read — the caller passes nothing and the line is simply absent. A congratulation that invents
 * a number is the one thing this screen must not do.
 *
 * The stars stay, because they are the reason to come back to a day and do it better; they moved
 * off the plate to just under the word, where the eye already is.
 */
import { Stars } from '@/components/ui/Stars';
import { useT } from '@/app/hooks/useT';

export interface DoneFigure {
  /** Already formatted for the locale — this component never decides what a number looks like. */
  value: string;
  label: string;
}

export interface DonePosterProps {
  /** «Приседания · Форма с нуля» — the two names that used to be a title and a subtitle. */
  eyebrow: string;
  /** The one warm line, or null when nothing true can be said. */
  line?: string | null;
  /** Stars earned, 0..3; null or undefined on a day that earns none. */
  stars?: number | null;
  /** Exactly three, so the rule divides evenly. */
  figures: readonly DoneFigure[];
}

export function DonePoster({ eyebrow, line, stars, figures }: DonePosterProps) {
  const { t } = useT();
  return (
    <section className="flex flex-col items-center pt-6 text-center">
      <p className="eyebrow max-w-full truncate text-muted-2">{eyebrow}</p>
      {/*
       * The word. It lands on the spring — this is the one moment in the app where a thing
       * arriving *is* the content. `text-balance` is not wanted here: it is one word, and the
       * clamp keeps it on one line from 320px up to the desktop column.
       */}
      <h1 className="display pop-in mt-3 text-[clamp(56px,17vw,88px)] leading-[0.95]">
        {t('app.summaryDone')}
      </h1>
      {line ? (
        <p className="mt-4 max-w-[26ch] text-[15px] leading-snug text-muted">{line}</p>
      ) : null}
      {stars !== null && stars !== undefined ? (
        <Stars
          value={stars}
          size={18}
          className="mt-5"
          label={t('app.pathStars', { n: Math.round(stars * 10) / 10 })}
        />
      ) : null}

      {/* Three figures on a rule, set the way the prototype sets them: numeral over kicker. */}
      <div className="mt-8 grid w-full grid-cols-3 divide-x divide-border border-t border-border pt-5">
        {figures.map((f) => (
          <div key={f.label} className="px-2">
            <span className="display tabular block text-[28px] leading-none">{f.value}</span>
            <span className="eyebrow mt-2 block truncate text-[10px]">{f.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
