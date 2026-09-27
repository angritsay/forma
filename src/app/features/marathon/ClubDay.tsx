/**
 * The day's header row: «День 10 · неделя 2 из 2 · до 22:00» on the left, the streak pill on the
 * right.
 *
 * The head with the ring was taken off this screen at the owner's word («шапку с кольцом убери»,
 * `MarathonScreen`), and this is not it coming back: no ring, no display type, no title. It is
 * one quiet 13px line, and it is here because the game the owner asked for is played against a
 * clock — «желание зайти и узнать новое задание» is a daily thing, and a daily thing needs the
 * day named and the hour it closes at. Both come from the API: the day and the week from
 * `my_marathons()`, the deadline from the task's own `due_time`. `my_marathons()` does not return
 * the round's default deadline, so a task without one shows no hour rather than a guessed one.
 *
 * The streak pill (`ClubStreak`) moves into this row from the top of the page. It was the one
 * thing up there; now it has a line to sit on, and the two say the same kind of fact — where you
 * are in time — from the two ends of one row. On a phone the row is one line; the pill gives
 * way first (`min-w-0` on the text, `shrink-0` on the pill).
 */
import type { ReactNode } from 'react';
import type { MyMarathon } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface ClubDayProps {
  /** The round on screen; null on the error state, where only the pill is drawn. */
  marathon: MyMarathon | null;
  /** Today's task's `due_time` (HH:MM:SS), or null to leave the hour out. */
  dueTime: string | null;
  /** The streak pill, or nothing. */
  streak: ReactNode;
}

/** «22:00:00» → «22:00». Anything that is not HH:MM(:SS) is left out rather than mangled. */
export function shortTime(due: string | null): string | null {
  if (!due) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(due.trim());
  return m ? `${m[1]!.padStart(2, '0')}:${m[2]}` : null;
}

export function ClubDay({ marathon, dueTime, streak }: ClubDayProps) {
  const { t } = useT();
  const running = marathon !== null && marathon.dayIndex >= 1;
  const due = shortTime(dueTime);
  return (
    <div className="flex items-start justify-between gap-3 pt-1">
      {running ? (
        <p className="min-w-0 truncate pt-2 text-[13px] text-muted">
          <span className="text-text">{t('app.marathonDayN', { n: marathon.dayIndex })}</span>
          {' · '}
          {t('app.clubWeekOf', { w: marathon.week, total: marathon.totalWeeks })}
          {due ? ` · ${t('app.clubDueAt', { time: due })}` : null}
        </p>
      ) : (
        <span />
      )}
      <div className="shrink-0">{streak}</div>
    </div>
  );
}
