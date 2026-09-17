/**
 * The streak, behind the 🔥 in the header of «Курсы».
 *
 * The entry point says one number; this says what the number is made of — five weeks of days, the
 * same calendar «Прогресс» carried at the bottom of its details (`StreakCalendar`), unchanged and
 * reused rather than redrawn. That calendar is the only part of that tab that answered a question
 * an athlete actually arrives with: is the streak real, and did yesterday count.
 *
 * It also carries the one button that keeps a streak alive on a day with no workout in it —
 * «Записать шаги» — because the streak's own rule is a workout *or* the steps goal, and `/steps`
 * lost its other way in when the tab did.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
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
  const navigate = useNavigate();
  const sessions = useProgress((s) => s.recentSessions);
  const logs = useProgress((s) => s.dailyLogs);
  const today = useTodayIso();
  const streak = useStreak();
  const weeks = useMemo(() => streakCalendar(sessions, logs, today), [sessions, logs, today]);

  return (
    <Sheet open={open} onClose={onClose} title={t('app.homeStreakTitle')}>
      <StreakCalendar weeks={weeks} streak={streak} />
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        className="mt-5"
        onClick={() => {
          onClose();
          navigate('/steps');
        }}
      >
        {t('app.homeStreakLogSteps')}
      </Button>
    </Sheet>
  );
}
