/**
 * The numerals a finished session is told in — the poster under «Готово!» and the story image
 * share them, so the picture someone posts says exactly what the screen said.
 *
 * Pure: no React, so the story's tests and the screen read the same rule.
 */
import { formatNumber, type Locale } from '@/i18n/index';
import type { Translate } from '@/app/features/player/model';

export interface SessionFigure {
  /** Already formatted for the locale. */
  value: string;
  label: string;
}

export interface FigureInput {
  durationSec: number;
  calories: number;
  /** 0..1 share of the plan done. */
  completion: number;
  /** Repetitions counted on the device; null on a day with none, or a session re-read. */
  reps: number | null;
  points?: number;
}

/**
 * The three numerals under «Готово!» — minutes, repetitions, calories, as the prototype sets them.
 *
 * A session with no rep-counted work at all (a plank test, a mobility day) has no repetitions to
 * report, and «0 ПОВТОРОВ» for having held a plank is worse than saying nothing; that slot carries
 * how much of the plan was done instead. A stored session read back from the server has no step
 * results on this device at all, and takes the same substitution.
 */
export function doneFigures(t: Translate, locale: Locale, s: FigureInput): SessionFigure[] {
  return [
    {
      value: formatNumber(locale, Math.round(s.durationSec / 60)),
      label: t('app.summaryMinutes'),
    },
    s.reps !== null
      ? { value: formatNumber(locale, s.reps), label: t('app.summaryReps') }
      : { value: `${Math.round(s.completion * 100)}%`, label: t('app.summaryCompletion') },
    { value: formatNumber(locale, s.calories), label: t('app.summaryKcal') },
  ];
}

/**
 * The story's figures: the poster's three, then the points when there are any. A coach's own
 * workout earns none (`customWorkoutPoints`), and «0 очков» on a picture someone posts reads as a
 * failure, so the figure is dropped rather than printed.
 */
export function storyFigures(t: Translate, locale: Locale, s: FigureInput): SessionFigure[] {
  const out = doneFigures(t, locale, s);
  if (s.points !== undefined && s.points > 0) {
    out.push({ value: formatNumber(locale, s.points), label: t('app.storyPoints') });
  }
  return out;
}
