/**
 * The training count, behind the pill in the header of «Курсы».
 *
 * The entry point says one number; this says what the number is made of — five weeks of days, the
 * same calendar «Прогресс» carries at the bottom of its details, reused rather than redrawn.
 *
 * It was the streak sheet, and the question it answered was «is my streak still alive». That
 * question is gone with the streak: Sergey's course trains five days a week, so a person following
 * it exactly could never hold a streak past Friday, and a number that resets every weekend for
 * obedience is a punishment dressed as a score. The calendar itself was always the good part —
 * it shows what you did, which is true whether or not the days touch — so it stays, with the count
 * over it instead of the chain.
 */
import { useMemo } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { useT } from '@/app/hooks/useT';
import { useProgress, useTodayIso, useTrainingCount } from '@/app/store/progress';
import { trainingCalendar } from './model';
import { TrainingCalendar } from './TrainingCalendar';

export interface TrainingSheetProps {
  open: boolean;
  onClose: () => void;
}

export function TrainingSheet({ open, onClose }: TrainingSheetProps) {
  const { t } = useT();
  const sessions = useProgress((s) => s.recentSessions);
  const today = useTodayIso();
  const count = useTrainingCount();
  const weeks = useMemo(() => trainingCalendar(sessions, today), [sessions, today]);

  return (
    <Sheet open={open} onClose={onClose} title={t('app.homeWorkoutsTitle')}>
      <TrainingCalendar weeks={weeks} count={count} />
    </Sheet>
  );
}
