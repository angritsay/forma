/**
 * The streak, behind the 🔥 in the header of «Курсы».
 *
 * The entry point says one number; this says what the number is made of — five weeks of days, the
 * same calendar «Прогресс» carried at the bottom of its details (`StreakCalendar`), unchanged and
 * reused rather than redrawn. That calendar is the only part of that tab that answered a question
 * an athlete actually arrives with: is the streak real, and did yesterday count.
 *
 * It used to carry a button as well — «Записать шаги», the other way to keep a streak alive on a
 * day with no workout in it. There is no other way now: steps are gone, because nothing in a Mini
 * App can read a phone's step counter and a hand-typed tally is a tally nobody keeps twice. The
 * sheet is the calendar and nothing else, which is what it was for.
 */
import { useMemo } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { useT } from '@/app/hooks/useT';
import { useProgress, useStreak, useTodayIso } from '@/app/store/progress';
import { streakCalendar } from './model';
import { StreakCalendar } from './StreakCalendar';

export interface StreakSheetProps {
  open: boolean;
  onClose: () => void;
}

export function StreakSheet({ open, onClose }: StreakSheetProps) {
  const { t } = useT();
  const sessions = useProgress((s) => s.recentSessions);
  const today = useTodayIso();
  const streak = useStreak();
  const weeks = useMemo(() => streakCalendar(sessions, today), [sessions, today]);

  return (
    <Sheet open={open} onClose={onClose} title={t('app.homeStreakTitle')}>
      <StreakCalendar weeks={weeks} streak={streak} />
    </Sheet>
  );
}
