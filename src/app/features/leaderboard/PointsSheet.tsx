import { Sheet } from '@/components/ui/Sheet';
import { formatNumber } from '@/i18n/index';
import {
  CHOICE_POINTS,
  REPEAT_POINTS,
  STEPS_GOAL,
  STEPS_POINTS_AT_GOAL,
  STEPS_POINTS_MAX,
  STEPS_POINTS_PER_EXTRA_1000,
  STREAK_BONUS,
} from '@/lib/training/constants';
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
 * Five numbered rules — 01 to 05 in the display face — rather than five pictograms in blue
 * squares. A rule is a sentence; the number is how the brandbook marks a step in a list.
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
    t('app.leaderboardHowSteps', {
      atGoal: STEPS_POINTS_AT_GOAL,
      goal: formatNumber(locale, STEPS_GOAL),
      extra: STEPS_POINTS_PER_EXTRA_1000,
      max: STEPS_POINTS_MAX,
    }),
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
