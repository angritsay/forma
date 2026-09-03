import { Icon, type IconName } from '@/components/ui/Icon';
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

/** "How points work": the engine's scoring rules, interpolated from the real constants. */
export function PointsSheet({ open, onClose }: PointsSheetProps) {
  const { t, locale } = useT();
  const items: { icon: IconName; text: string }[] = [
    {
      icon: 'bolt',
      text: t('app.leaderboardHowWorkout', {
        easier: formatNumber(locale, CHOICE_POINTS.easier, 2),
        normal: formatNumber(locale, CHOICE_POINTS.normal, 2),
        harder: formatNumber(locale, CHOICE_POINTS.harder, 2),
      }),
    },
    { icon: 'refresh', text: t('app.leaderboardHowRepeat', { pct: REPEAT_POINTS * 100 }) },
    {
      icon: 'flame',
      text: t('app.leaderboardHowStreak', { pct7: bonusPct(7), pct30: bonusPct(30) }),
    },
    {
      icon: 'steps',
      text: t('app.leaderboardHowSteps', {
        atGoal: STEPS_POINTS_AT_GOAL,
        goal: formatNumber(locale, STEPS_GOAL),
        extra: STEPS_POINTS_PER_EXTRA_1000,
        max: STEPS_POINTS_MAX,
      }),
    },
    { icon: 'calendar', text: t('app.leaderboardHowWeek') },
  ];
  return (
    <Sheet open={open} onClose={onClose} title={t('app.leaderboardHowTitle')}>
      <ul className="flex flex-col gap-4 py-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-accent/15 text-accent">
              <Icon name={item.icon} size={20} />
            </span>
            <p className="text-[15px] leading-relaxed">{item.text}</p>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
