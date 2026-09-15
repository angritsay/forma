/**
 * The account, at the top of «Прогресс»: how long the run is, what level it adds up to, and the two
 * controls that belong to the person rather than to the screen.
 *
 * It came off Home. Home answers «что у меня сегодня», and a streak, a level and an avatar are all
 * answers to «как у меня дела» — they were sitting in the corner of the wrong tab, and moving them
 * here is what let Home stop scrolling.
 *
 * It replaces `ProgressPoster`, the full-bleed paper poster with the 104px streak numeral, at the
 * owner's request: «верхнюю часть вкладки „Прогресс“ нужно полностью убрать». Worth knowing what
 * that costs, because the poster was not decoration — it was the one surface in the product built
 * to be photographed and sent to somebody. Nothing is lost from the tab itself: its three totals
 * (workouts, minutes, calories) are the same `TotalsRow` that already sits under «Подробности».
 *
 * It keeps the paper ground the poster had. The brandbook gives white to the profile and its
 * backings, and this block is the profile — `data-theme="paper"` flips the tokens so `bg-bg` is the
 * paper and `text-text` the ink, and nothing here has to name a literal colour.
 */
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Spinner } from '@/components/ui/Spinner';
import { formatNumber, plural } from '@/i18n/index';
import type { LevelInfo, StreakInfo } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

export interface AccountRowProps {
  streak: StreakInfo;
  level: LevelInfo;
  /** Avatar identity — the seed draws the pattern, the name draws the initial. */
  avatarSeed: string;
  displayName?: string | undefined;
  loading: boolean;
  onOpenProfile: () => void;
  onRefresh: () => void;
}

export function AccountRow({
  streak,
  level,
  avatarSeed,
  displayName,
  loading,
  onOpenProfile,
  onRefresh,
}: AccountRowProps) {
  const { t, l, locale } = useT();
  const days = plural(locale, streak.current, {
    one: t('app.homeStreakDayOne'),
    few: t('app.homeStreakDayFew'),
    many: t('app.homeStreakDayMany'),
  });

  return (
    <section
      data-theme="paper"
      className="-mx-6 flex items-center gap-4 bg-bg px-6 py-5 text-text md:-mx-10 md:px-10"
      aria-label={t('app.statsPosterLabel')}
    >
      <button
        type="button"
        onClick={onOpenProfile}
        aria-label={t('app.homeProfile')}
        className="tap-target shrink-0 rounded-control"
      >
        <Avatar seed={avatarSeed} name={displayName} size={44} />
      </button>

      <div className="min-w-0 flex-1">
        {/*
         * The streak reads as one line — «0 дней подряд» — rather than as a figure with a caption
         * under it. At this size a stacked numeral is just a small number pretending to be a big
         * one; the sentence is what carries at a glance.
         */}
        <p className="font-display truncate text-base leading-tight">
          {t('app.statsStreakDays', { days: `${formatNumber(locale, streak.current)} ${days}` })}
        </p>
        <p className="eyebrow mt-1 truncate text-muted">
          {t('app.statsLevelEyebrow', { n: level.level })} · {l(level.title)}
        </p>
      </div>

      {/*
       * An icon, not the word «Обновить» — which is what was asked for, and what the row needs:
       * as a label it took 110px of a 342px line and both texts beside it ellipsised into
       * «3 ДНЯ ПОДР…» and «УРОВЕНЬ 2 · СТАЖ…». The spinner takes its place while a reload is in
       * flight, the same way it did on Home.
       */}
      <IconButton
        label={t('app.statsRefresh')}
        icon={loading ? <Spinner size={16} /> : 'refresh'}
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={onRefresh}
      />
    </section>
  );
}
