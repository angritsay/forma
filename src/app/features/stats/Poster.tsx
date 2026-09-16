/**
 * The top of «Прогресс»: the paper poster from the owner's prototype (`design/ui_kits/app-v2`,
 * «Ты»). The wordmark and the level in one row, the streak as one numeral the size of the
 * screen with what it counts under it, and the three totals on a ruled line.
 *
 * It replaces `AccountRow` — a 44px avatar, «3 дня подряд» in 16px and the level under it — which
 * had itself replaced an earlier poster «at the owner's request». Her verdict on the tab that
 * followed was «старый стиль … МИНИМУМ текста, максимум визуала и дофамина», and her prototype
 * puts the poster back, bigger: the streak is the one number an athlete opens this tab to see, and
 * a number that is the point of a screen is set at the size of the point. The two controls the row
 * carried survive in the head, beside the level: the avatar still opens the profile and the
 * arrow still reloads — a control names itself, and says so to a screen reader with `aria-label`.
 *
 * The at-risk sentence («Чтобы не потерять серию, сделай сегодня тренировку или пройди 7 000
 * шагов») became a pill beside «дней подряд», where the prototype puts its «✳ 2 заморозки»: one
 * fact, said in three words, in the place a fact about the streak belongs. The steps ring lower
 * on the screen already says how to fix it.
 *
 * Paper because the brandbook gives white to the profile and its backings, and this block is the
 * profile; `data-theme="paper"` flips the tokens so nothing here names a literal colour.
 */
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Logo } from '@/components/ui/Logo';
import { Pill } from '@/components/ui/Pill';
import { Spinner } from '@/components/ui/Spinner';
import { formatNumber, plural } from '@/i18n/index';
import type { LevelInfo, StreakInfo } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

export interface PosterProps {
  streak: StreakInfo;
  level: LevelInfo;
  workouts: number;
  minutes: number;
  calories: number;
  /** Avatar identity — the seed draws the pattern, the name draws the initial. */
  avatarSeed: string;
  displayName?: string | undefined;
  loading: boolean;
  onOpenProfile: () => void;
  onRefresh: () => void;
}

export function Poster({
  streak,
  level,
  workouts,
  minutes,
  calories,
  avatarSeed,
  displayName,
  loading,
  onOpenProfile,
  onRefresh,
}: PosterProps) {
  const { t, l, locale } = useT();
  const days = plural(locale, streak.current, {
    one: t('app.homeStreakDayOne'),
    few: t('app.homeStreakDayFew'),
    many: t('app.homeStreakDayMany'),
  });
  const totals = [
    [workouts, t('app.statsTotalWorkouts')],
    [minutes, t('app.statsTotalMinutes')],
    [calories, t('app.statsTotalKcal')],
  ] as const;

  return (
    <section
      data-theme="paper"
      className="-mx-6 flex flex-col bg-bg px-6 pt-4 pb-6 text-text md:-mx-10 md:px-10"
      aria-label={t('app.statsPosterLabel')}
    >
      {/*
       * The head: the mark, the level, the two controls. The level gives way first (it truncates)
       * — «УРОВЕНЬ 2 · ВЕТЕРАН» is 19 tracked capitals, and the avatar and the arrow are fixed
       * figures that must not shrink to make room for it.
       */}
      <div className="flex h-9 items-center gap-3">
        <Logo className="shrink-0 text-[14px]" />
        <span className="eyebrow min-w-0 flex-1 truncate text-right text-muted-2">
          {t('app.statsLevelEyebrow', { n: level.level })} · {l(level.title)}
        </span>
        <IconButton
          label={t('app.statsRefresh')}
          icon={loading ? <Spinner size={16} /> : 'refresh'}
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={onRefresh}
        />
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={t('app.homeProfile')}
          className="tap-target shrink-0 rounded-pill transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-85 active:scale-[0.96]"
        >
          <Avatar seed={avatarSeed} name={displayName} size={36} />
        </button>
      </div>

      {/*
       * The number. Display weight rather than the numeral's 600, because at this size 600 reads
       * as a large label and 800 as a figure; tabular so «11» and «12» stand where «1» stood.
       * It lands on the spring — the one place on the tab a thing arriving is the point.
       */}
      <p className="display pop-in mt-4 text-[112px] leading-[0.92] tabular-nums">
        {formatNumber(locale, streak.current)}
      </p>
      {/*
       * The pill sits beside «дней подряд» where the prototype puts «✳ 2 заморозки», and wraps
       * under it on a narrow phone: «ДНЕЙ ПОДРЯД» plus «СЕГОДНЯ НЕ ЗАСЧИТАНО» is wider than 342px
       * of gutter-to-gutter, and shrinking either to fit would cost more than the second line does.
       */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="display text-[26px] leading-none">{t('app.statsStreakDays', { days })}</p>
        {/* The day is open and nothing is logged yet: the one fact that can still change today. */}
        {streak.atRisk ? <Pill>{t('app.statsTodayNotCounted')}</Pill> : null}
      </div>

      {/* Three totals on a rule, the way the prototype sets them: figure over kicker, hairlines between. */}
      <div className="mt-6 grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
        {totals.map(([value, label], i) => (
          <div key={label} className={i === 0 ? 'pr-4' : 'px-4'}>
            <span className="numeral tabular block text-[17px] leading-none">
              {formatNumber(locale, value)}
            </span>
            <span className="eyebrow mt-2 block truncate text-[10px]">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
