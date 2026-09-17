/**
 * The head of «Курсы»: who you are on the left, the two entry points on the right.
 *
 * «Профиль и все ачивки убирай. Они должны быть на главном экране в виде маленьких энтри поинтов
 * где мы показываем только стрик и достижения. Достижения открывают каталог достижений.»
 *
 * The owner's mockup settles what that looks like, and it moved three things:
 *
 *   - **The greeting is two lines.** «Доброе утро» small and regular, the name under it large in
 *     the display face. It used to be one line — «Доброе утро, Настя» — truncated into a 14px
 *     slot beside an avatar, which is a label; two lines is a greeting. The name is set in the
 *     display face at 800 — through `.font-display` with the weight raised, since `.display`
 *     also carries its own tracking and line height and this lockup wants neither.
 *   - **The avatar is gone**, and an outline person glyph beside the name opens the account in its
 *     place. Nobody in this product uploads a picture, so the circle was a generated monogram
 *     standing in for a photograph that does not exist.
 *   - **The streak and the achievements moved to the top right**, onto a dark grey fill, and they
 *     took their proper shapes: the streak is a **pill**, the achievements a **circle**
 *     (`design/CHANGELOG.md` §10 — a fact is a pill, a rank is a circle).
 *
 * The achievements circle holds only the rosette. It used to carry «5/13» and the mockup does not,
 * which is a real loss of a figure — so the count stays in the accessible name, where a screen
 * reader still gets it, and the catalogue one tap away is where it is read properly.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import { formatNumber } from '@/i18n/index';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { dayPart } from '@/app/features/home/greeting';
import { StreakSheet } from '@/app/features/stats/StreakSheet';

/**
 * The greeting without the name in it — the mockup sets the name on its own line, so there is
 * nothing to interpolate into. `app.homeGreeting*` keeps the one-line form for anywhere that still
 * wants it; this is the same four times of day, from the same `dayPart()`.
 */
const GREET_KEY: Record<ReturnType<typeof dayPart>, TKey> = {
  morning: 'app.homeGreetMorning',
  afternoon: 'app.homeGreetAfternoon',
  evening: 'app.homeGreetEvening',
  night: 'app.homeGreetNight',
};

export interface CoursesHeadProps {
  /** First name, from the profile or the address — `greetingName()` decides it. */
  name: string;
  streak: number;
  /** Achievements taken and achievements there are — the catalogue's own figure. */
  unlocked: number;
  total: number;
  /** Opens the account sheet, which the screen owns. */
  onAccount: () => void;
}

export function CoursesHead({ name, streak, unlocked, total, onAccount }: CoursesHeadProps) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState(false);

  return (
    <div className="flex items-start gap-3 px-6 pt-1 pb-4 md:px-10">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-tight text-text">
          {t(GREET_KEY[dayPart(new Date().getHours())])}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {/* `.font-display` is sentence case now, so the `normal-case` that used to undo its
              capitals is gone. The weight override stays: `.font-display` is the 600 heading
              treatment and the mockup sets the name in the big line's 800. */}
          <h1 className="font-display min-w-0 truncate text-[26px] leading-tight font-extrabold tracking-[-0.02em]">
            {name}
          </h1>
          <button
            type="button"
            aria-label={t('app.profileTitle')}
            onClick={onAccount}
            className="tap-target shrink-0 text-text transition-opacity duration-150 ease-(--ease-out) hover:opacity-70"
          >
            <Icon name="person" size={17} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      {/* Both sit on `--surface-2`, the mockup's dark grey plate, so they read as two controls of
          one kind rather than as two loose marks on the ground. */}
      <div className="flex shrink-0 items-center gap-2 pt-1.5">
        <button
          type="button"
          aria-label={`${t('app.homeStreakTitle')}: ${formatNumber(locale, streak)}`}
          onClick={() => setCalendar(true)}
          className="flex h-9 items-center gap-1.5 rounded-pill bg-surface-2 px-3 text-text transition-colors duration-150 ease-(--ease-out) hover:bg-surface-3"
        >
          {/*
           * The one emoji in the product, and it is the owner's: her mockup sets a colour 🔥 in
           * this pill and a monochrome mark in the circle beside it. That asymmetry is deliberate
           * — the streak is the number you come back for and it is allowed to be warm — so the
           * outline `flame` this pill used to carry is gone and the rosette next door stays ours.
           * `aria-hidden`, because the button already has a name and a screen reader announcing
           * «огонь» before the figure says nothing the label has not said.
           */}
          <span aria-hidden="true" className="text-[15px] leading-none">
            🔥
          </span>
          <span className="tabular text-[13px] leading-none font-medium">
            {formatNumber(locale, streak)}
          </span>
        </button>
        <button
          type="button"
          aria-label={`${t('app.achievementsTitle')}: ${t('app.statsAchievementsCount', {
            done: formatNumber(locale, unlocked),
            total: formatNumber(locale, total),
          })}`}
          onClick={() => navigate('/achievements')}
          className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-text transition-colors duration-150 ease-(--ease-out) hover:bg-surface-3"
        >
          <Icon name="rosette" size={17} strokeWidth={1.7} />
        </button>
      </div>
      <StreakSheet open={calendar} onClose={() => setCalendar(false)} />
    </div>
  );
}
