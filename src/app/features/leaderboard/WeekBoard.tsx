/**
 * This week's table, short: the top few and — when the athlete is not among them — their own row
 * pinned under it.
 *
 * «Прогресс» is where somebody asks how the week went, and "who is winning it" is part of that
 * answer, so it is on the screen rather than one tap away behind a link nobody presses. Five rows,
 * because the point here is the shape of the week and not the standings; the full hundred, the
 * all-time table and the per-course filter stay on the leaderboard screen, which this links to.
 *
 * The kicker is inside the component rather than around it, so that a week nobody has scored in
 * yet leaves no heading over an empty space.
 */
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useT } from '@/app/hooks/useT';
import { LeaderboardRowView } from './LeaderboardList';
import { splitLeaderboard } from './model';
import { useLeaderboard } from './useLeaderboard';

export interface WeekBoardProps {
  /** How many ranked athletes to show. */
  limit?: number;
  onOpenFull: () => void;
}

export function WeekBoard({ limit = 5, onOpenFull }: WeekBoardProps) {
  const { t } = useT();
  const { rows, status } = useLeaderboard('week', null);
  const view = splitLeaderboard(rows, limit);

  if (status === 'loading') {
    return <Skeleton rounded="control" className="h-40" aria-hidden="true" />;
  }
  /* A week nobody has scored in yet, or a table that failed to load: the section says nothing. */
  if (status === 'error' || view.empty) return null;

  return (
    <section className="flex flex-col">
      <h2 className="eyebrow mb-3">{t('app.statsWeekBoardTitle')}</h2>
      <div className="border-b border-border">
        {view.top.map((row) => (
          <LeaderboardRowView key={row.userId} row={row} />
        ))}
        {view.pinned && view.me ? <LeaderboardRowView row={view.me} /> : null}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 -ml-4.5 self-start"
        onClick={onOpenFull}
        iconRight={<Glyph size={12}>→</Glyph>}
      >
        {t('app.statsLeaderboard')}
      </Button>
    </section>
  );
}
