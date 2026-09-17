/**
 * Marathon — the weekly board.
 *
 * Two weeks and no more: this one and the last. That is the format, not a limitation — the week is
 * the race, it resets, and everyone starts Monday with a chance to win. An all-time column would
 * quietly undo that by making an early leader unbeatable and telling anyone who joined late that
 * they are already out of it.
 *
 * It is a screen of the club, so it carries the club's colour: `--course-tile` is set at
 * the root and lands on the prize's pill and on the leader's filled circle — the two things the
 * colour marks on the day screen's own table. Your own row is a white ring, not the colour. The
 * week switch stays black and white; it is a control.
 *
 * It is the tab's overflow and nothing more. The standings are on the tab itself now, five rows of
 * them, because «только задание и лидерборд» means the leaderboard is *on* the screen rather than
 * a tap away from it; this is where the whole week and the week before it live, for the one person
 * in ten who wants to read the full table. Nothing else hangs off it — «Мои баллы» used to, and
 * the screen it led to is gone.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { BoardRow } from '@/app/features/marathon/BoardRow';
import { clubPrize } from '@/app/features/marathon/prize';
import { useMarathonScores, useMyMarathons } from '@/app/features/marathon/useMarathon';

type WeekChoice = 'this' | 'last';

export default function MarathonBoardScreen() {
  const tr = useT();
  const { t } = tr;
  const { marathon, status: marathonStatus } = useMyMarathons();
  const [choice, setChoice] = useState<WeekChoice>('this');

  const thisWeek = marathon?.week ?? 1;
  const week = choice === 'this' ? thisWeek : Math.max(thisWeek - 1, 1);
  const {
    data: rows,
    status,
    reload,
  } = useMarathonScores(marathon?.id ?? null, marathon ? week : null);

  const header = <TopBar back title={t('app.marathonTitle')} />;

  if (marathonStatus === 'loading' || !marathon) {
    return (
      <Screen header={header}>
        <div className="flex flex-col gap-px py-4" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} rounded="control" className="h-16" />
          ))}
        </div>
      </Screen>
    );
  }

  const scored = rows.some((r) => r.points > 0);

  return (
    <div style={courseTileVars(GAME_TILE)}>
      <Screen header={header}>
        <div className="flex flex-col gap-5 py-2">
          <Tabs<WeekChoice>
            variant="fill"
            label={t('app.marathonTabBoard')}
            value={choice}
            onChange={setChoice}
            tabs={[
              { id: 'this', label: t('app.marathonWeekThis') },
              // Week 1 has no previous week; the tab stays, disabled, so the board does not change
              // shape halfway through the marathon.
              { id: 'last', label: t('app.marathonWeekLast'), disabled: thisWeek <= 1 },
            ]}
          />

          {/* The prize is what the table is for: the one filled pill, the same one the day screen
              draws above its five rows, so the two tables read as one race. `flex` rather than a
              bare child so the pill hugs its words instead of being stretched by the column. */}
          <div className="flex">
            <Pill tone="course-fill">
              {t('app.marathonPrizeShort')} · {clubPrize(tr, marathon.prize)}
            </Pill>
          </div>

          <div role="tabpanel" id={tabPanelId(choice)} aria-labelledby={`tab-${choice}`}>
            {status === 'loading' ? (
              <div className="flex flex-col gap-px" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} rounded="control" className="h-16" />
                ))}
              </div>
            ) : status === 'error' ? (
              <EmptyState
                title={t('app.marathonErrorTitle')}
                action={
                  <Button size="lg" onClick={reload}>
                    {t('common.retry')}
                  </Button>
                }
              />
            ) : !scored ? (
              <EmptyState title={t('app.marathonBoardEmpty')} />
            ) : (
              <ol className="flex flex-col">
                {rows.map((row) => (
                  <li key={row.entryId}>
                    <BoardRow row={row} />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </Screen>
    </div>
  );
}
