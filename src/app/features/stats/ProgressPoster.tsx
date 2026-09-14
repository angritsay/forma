/**
 * The top of the progress tab, built to be photographed.
 *
 * Every app that people actually keep opening has one screen whose whole job is to be shown to
 * somebody else — Duolingo's streak, Headspace's minutes. The mechanism is the same everywhere and
 * it is not the chart: it is one number, large enough to read at arm's length, with the thing it
 * counts named under it, and a few figures beside it that say how far this has gone.
 *
 * So this is a poster, not a card. It is the paper surface the profile uses — black on white, the
 * one place in a near-black app where the ground flips — it runs past both gutters, and it holds
 * exactly five numbers: the streak, and three totals under a rule, with the level as the line that
 * says what the numbers add up to. Cropped out of a screenshot it is already a story: the wordmark
 * is in the corner, so a picture of it says where it came from without anybody adding a caption.
 *
 * Everything the old screen opened with — the progress bar to the next level, the points-per-week
 * chart, the streak calendar — is still on the tab, further down and behind one tap. None of it is
 * the thing anybody screenshots.
 */
import { Logo } from '@/components/ui/Logo';
import { formatNumber, plural } from '@/i18n/index';
import type { LevelInfo, StreakInfo } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

export interface ProgressPosterProps {
  streak: StreakInfo;
  level: LevelInfo;
  workouts: number;
  minutes: number;
  calories: number;
}

/** One of the three totals under the rule: the figure, and its name under it. */
function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 first:pl-0 last:pr-0">
      <span className="numeral tabular text-2xl leading-none">{value}</span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

export function ProgressPoster({
  streak,
  level,
  workouts,
  minutes,
  calories,
}: ProgressPosterProps) {
  const { t, l, locale } = useT();
  const days = plural(locale, streak.current, {
    one: t('app.homeStreakDayOne'),
    few: t('app.homeStreakDayFew'),
    many: t('app.homeStreakDayMany'),
  });

  return (
    /*
     * `data-theme="paper"` is the app's own way of flipping the ground (see ProfileScreen), so the
     * tokens inside keep their names: `bg-bg` is the paper and `text-text` the ink, and nothing
     * here has to know a literal colour.
     */
    <section
      data-theme="paper"
      className="-mx-6 flex flex-col bg-bg px-6 pt-7 pb-8 text-text lg:-mx-10 lg:px-10"
      aria-label={t('app.statsPosterLabel')}
    >
      <div className="flex items-center justify-between gap-3">
        <Logo className="text-[13px]" />
        <span className="eyebrow truncate">
          {t('app.statsLevelEyebrow', { n: level.level })} · {l(level.title)}
        </span>
      </div>

      {/*
       * The one number. It is set at a size nothing else in the product uses, on purpose: this is
       * the figure the screen exists for, and anything that competes with it makes the screenshot
       * worse.
       */}
      <p className="numeral tabular mt-7 text-[104px] leading-[0.86]">{streak.current}</p>
      <p className="display mt-2 text-2xl">{t('app.statsStreakDays', { days })}</p>
      {/*
       * The best run, but only once it is behind you — a personal record shown next to the run
       * that beat it is the app telling somebody their best day has passed.
       */}
      {streak.longest > streak.current ? (
        <p className="mt-1.5 text-[13px] text-muted">
          {t('app.statsStreakBest', { n: formatNumber(locale, streak.longest) })}
        </p>
      ) : null}

      <div className="mt-8 flex divide-x divide-border border-t border-border pt-5">
        <Figure value={formatNumber(locale, workouts)} label={t('app.statsTotalWorkouts')} />
        <Figure value={formatNumber(locale, minutes)} label={t('app.statsTotalMinutes')} />
        <Figure value={formatNumber(locale, calories)} label={t('app.statsTotalKcal')} />
      </div>
    </section>
  );
}
