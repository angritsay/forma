/**
 * The club's HUD — one row, numbers only: `[avatar] 58 · [соло|дуо] · 🔥 4`.
 *
 * Owner, on the shipped week screen (#230): «Визуально мусорно и не структурировано и много
 * текстов, нет элемента игры». The row this replaces read «День 7 · неделя 1 из 522» over a
 * centred Solo/Duo control on a row of its own. A game has a HUD: who is playing, the score, the
 * mode, the streak — and none of those is a sentence.
 *
 *   - **Left:** the member's own avatar (the profile's seed and name, as everywhere) and the
 *     week's points in the numeral face — my row of `marathon_scores`, «0» when unscored. A real
 *     zero, not a dash: the HUD counts what the week has, and this week has nothing yet. In duo
 *     mode the row is the pair's (the duo board scores the team), so a small «пара» follows the
 *     numeral: a 0 next to my own face must not read as my own count.
 *   - **Middle:** the mode switch as two small chips, drawn only when a duo round exists. The
 *     selected one is the club's warm gradient under ink (`Chip` `warm`), the other a hairline.
 *     The owner's choice: «переключатель маленький, в строке».
 *   - **Right:** the streak pill (`ClubStreak`, compact) — 🔥 and the number, with the at-risk
 *     pulse and the milestones sheet it always had. The slot keeps its width when the streak is
 *     zero, so the row does not jump the morning it comes back.
 *
 * **On the course's trial week** (`gameAccess` → `reason: 'trial'`) a quiet pill sits under the
 * row: «Пробная неделя · осталось 3 дн.». The trial was invisible (audit item 5): no countdown,
 * and on day eight the club locked without a word. It is a fact to read, not a control, so it is
 * the neutral hairline pill rather than the warm material the club keeps for its actions.
 *
 * Under the row the screen draws the week track (`WeekTrack`); the two together are what the
 * «День 7 · неделя 1 из 522» line was trying to say.
 */
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Pill } from '@/components/ui/Pill';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import type { ClubMode } from './clubMode';

/** The signed-in member as an avatar: the profile's seed and display name, the email failing that. */
export function useMeAvatar(): { seed: string; name: string } {
  const profile = useSession((s) => s.profile);
  const email = useSession((s) => s.user?.email ?? '');
  const name = profile?.displayName?.trim() || profile?.email || email;
  return { seed: profile?.avatarSeed || name, name };
}

export interface ClubHudProps {
  /** My points this week, from `weekStandings(...).mine` — 0 when unscored. */
  points: number;
  mode: ClubMode;
  onMode: (mode: ClubMode) => void;
  /** A duo round exists, so the switch is drawn. */
  hasDuo: boolean;
  /** The streak pill, or nothing. */
  streak: ReactNode;
  /** Whole days left of the course's trial week (`gameAccess`); null or absent off the trial. */
  trialDaysLeft?: number | null;
}

export function ClubHud({ points, mode, onMode, hasDuo, streak, trialDaysLeft }: ClubHudProps) {
  const { t, locale } = useT();
  const me = useMeAvatar();
  const pair = hasDuo && mode === 'duo';
  const pairWord = t('app.clubPairPoints');
  const row = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar seed={me.seed} name={me.name} size={32} />
        <span
          className="flex items-baseline gap-1.5"
          aria-label={`${t('app.clubMyPoints')}: ${formatNumber(locale, points)}${pair ? ` · ${pairWord}` : ''}`}
        >
          <span className="numeral text-[24px] leading-none text-text">
            {formatNumber(locale, points)}
          </span>
          {pair ? <span className="text-[12px] leading-none text-muted">{pairWord}</span> : null}
        </span>
      </div>

      {hasDuo ? (
        <div role="group" aria-label={t('app.clubMode')} className="flex items-center gap-1.5">
          {(['solo', 'duo'] as const).map((m) => {
            const selected = m === mode;
            return (
              <Chip
                key={m}
                size="sm"
                tone={selected ? 'warm' : 'default'}
                className={selected ? undefined : 'border-border-strong'}
                onClick={() => onMode(m)}
                aria-pressed={selected}
              >
                {t(m === 'solo' ? 'app.clubTabSolo' : 'app.clubTabDuo')}
              </Chip>
            );
          })}
        </div>
      ) : null}

      {/* A fixed slot: an empty streak must not let the chips slide to the edge. */}
      <div className="flex min-w-16 shrink-0 justify-end">{streak}</div>
    </div>
  );
  if (trialDaysLeft == null) return row;
  return (
    <div className="flex flex-col items-start gap-2.5">
      <div className="w-full">{row}</div>
      <Pill>{t('app.clubTrialPill', { n: formatNumber(locale, trialDaysLeft) })}</Pill>
    </div>
  );
}
