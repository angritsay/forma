/**
 * The week, closed: place, points, tasks done, streak — and a «Поделиться».
 *
 * The Sunday moment of the owner's loop is closure and a reason to come back on Monday. The
 * board already shows where the week ended, but a table is not a summary of *your* week: it does
 * not say how many of the seven tasks you did, and it has no button on it. This card does both,
 * with every number from the API — the place from `marathon_scores` of that week, the tasks
 * from `marathon_my_points`, the streak from `my_club_days` — and nothing invented.
 *
 * When it is on screen is a pure rule (`clubRecap.ts`): Sunday once today's task is done, and
 * Monday–Tuesday until the first proof of the new week. The week it shows is the club's own
 * count from `my_marathons`.
 *
 * The figures are set the way `StatTile` sets them — the number large in the display face, the
 * name under it — on the glass card the rest of the tab uses. No gradient here: the card is a
 * fact, and the club's gradient is for the things that ask to be pressed.
 */
import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { formatNumber } from '@/i18n/index';
import type { MyMarathon } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { ClubShare } from './ClubShare';
import { recapWeek } from './clubRecap';
import { weekStandings } from './standings';
import { useMarathonMyPoints, useMarathonScores } from './useMarathon';

export interface ClubWeekRecapProps {
  marathon: MyMarathon;
  /** Today's task is delivered and not struck out. */
  todayDone: boolean;
  /** The current streak (`clubStreak`). */
  streak: number;
  /** `Date#getDay()` of the member's today. */
  weekday: number;
  /** Bumped after a proof so the tasks-done count and the rule re-read. */
  version: number;
}

export function ClubWeekRecap({
  marathon,
  todayDone,
  streak,
  weekday,
  version,
}: ClubWeekRecapProps) {
  const { t, locale } = useT();
  const { data: myDays, status } = useMarathonMyPoints(marathon.id, version);

  const proofThisWeek = myDays.some((d) => d.week === marathon.week && d.tasksDone > 0);
  const week =
    status === 'ready'
      ? recapWeek({ weekday, week: marathon.week, todayDone, proofThisWeek })
      : null;

  const { data: scores } = useMarathonScores(week === null ? null : marathon.id, week);
  const place = useMemo(() => weekStandings(scores, marathon.memberId).place, [scores, marathon]);

  if (week === null) return null;

  const rows = myDays.filter((d) => d.week === week);
  const tasksDone = rows.reduce((s, d) => s + d.tasksDone, 0);
  const tasksTotal = rows.reduce((s, d) => s + d.tasksTotal, 0);
  const points = place.kind === 'ranked' ? place.points : rows.reduce((s, d) => s + d.points, 0);
  const rank = place.kind === 'ranked' ? place.rank : null;

  const figure = (value: string, label: string) => (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="display truncate text-4xl">{value}</span>
      <span className="truncate text-[12px] text-muted-2">{label}</span>
    </div>
  );

  return (
    <Card level={2} padding="md" className="flex flex-col gap-4">
      <span className="eyebrow">{t('app.clubRecapTitle', { w: week })}</span>
      <div className="grid grid-cols-4 gap-3">
        {figure(rank === null ? '—' : `#${formatNumber(locale, rank)}`, t('app.clubStoryPlace'))}
        {figure(formatNumber(locale, points), t('app.clubStoryPoints'))}
        {figure(
          t('app.clubRecapTasksOf', {
            done: formatNumber(locale, tasksDone),
            total: formatNumber(locale, tasksTotal),
          }),
          t('app.clubRecapTasks'),
        )}
        {figure(formatNumber(locale, streak), t('app.clubStoryStreak'))}
      </div>
      <ClubShare
        className="-ml-4.5 self-start"
        seed={`${marathon.id}:${week}`}
        headline={t('app.clubRecapTitle', { w: week })}
        points={place.kind === 'ranked' ? place.points : null}
        pointsMode="total"
        day={null}
        streak={streak}
        place={rank}
      />
    </Card>
  );
}
