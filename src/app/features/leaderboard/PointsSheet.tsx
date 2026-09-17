import { Sheet } from '@/components/ui/Sheet';
import { formatNumber } from '@/i18n/index';
import { CHOICE_POINTS, REPEAT_POINTS, STREAK_BONUS } from '@/lib/training/constants';
import { useT } from '@/app/hooks/useT';

export interface PointsSheetProps {
  open: boolean;
  onClose: () => void;
}

function bonusPct(days: number): number {
  return Math.round((STREAK_BONUS.find((b) => b.days === days)?.bonus ?? 0) * 100);
}

/**
 * "How points work": the engine's scoring rules, interpolated from the real constants.
 *
 * Four numbered rules — 01 to 04 in the display face — rather than four pictograms in blue
 * squares. A rule is a sentence; the number is how the brandbook marks a step in a list.
 *
 * There were five. The one that went was «шаги идут в зачёт»: steps are no longer counted because
 * they are no longer collected — a Mini App cannot read a phone's step counter, so the figure was
 * typed in by hand, and a scoreboard fed by hand-typed numbers is not a scoreboard.
 */
export function PointsSheet({ open, onClose }: PointsSheetProps) {
  const { t, locale } = useT();
  const items: string[] = [
    t('app.leaderboardHowWorkout', {
      easier: formatNumber(locale, CHOICE_POINTS.easier, 2),
      normal: formatNumber(locale, CHOICE_POINTS.normal, 2),
      harder: formatNumber(locale, CHOICE_POINTS.harder, 2),
    }),
    t('app.leaderboardHowRepeat', { pct: REPEAT_POINTS * 100 }),
    t('app.leaderboardHowStreak', { pct7: bonusPct(7), pct30: bonusPct(30) }),
    t('app.leaderboardHowWeek'),
  ];
  return (
    <Sheet open={open} onClose={onClose} title={t('app.leaderboardHowTitle')}>
      <ol className="flex flex-col py-2">
        {items.map((text, i) => (
          <li
            key={i}
            className="flex gap-4 border-t border-border py-4 first:border-t-0 first:pt-2"
          >
            <span className="numeral w-7 shrink-0 pt-0.5 text-sm text-muted-2" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="text-[15px] leading-relaxed">{text}</p>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}
