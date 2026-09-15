/**
 * Marathon — the weekly board.
 *
 * Two weeks and no more: this one and the last. That is the format, not a limitation — the week is
 * the race, it resets, and everyone starts Monday with a chance to win. An all-time column would
 * quietly undo that by making an early leader unbeatable and telling anyone who joined late that
 * they are already out of it.
 *
 * It is a screen of the challenge, so it carries the challenge's colour: `--course-tile` is set at
 * the root and lands on the prize — the kicker over it, and the label on whoever is holding it —
 * and on the rule down your own row. The week switch stays black and white; it is a control.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { BoardRow } from '@/app/features/marathon/BoardRow';
import { useMarathonScores, useMyMarathons } from '@/app/features/marathon/useMarathon';

type WeekChoice = 'this' | 'last';

export default function MarathonBoardScreen() {
  const { t } = useT();
  const navigate = useNavigate();
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

          {/* The prize is what the table is for, so its kicker is where the colour lands here. */}
          {marathon.prize ? (
            <p className="border-t border-border pt-4 text-[13px] text-muted">
              <span className="control-label text-course text-[10px]">
                {t('app.marathonPrize')}
              </span>{' '}
              {marathon.prize}
            </p>
          ) : null}

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

          {/*
           * The breakdown of your own week lives one level below the board rather than beside the
           * day: the day screen answers «what do I do now», the board «who is winning», and only
           * then does «where did my points come from» become a question worth a screen.
           */}
          <div className="border-t border-border pt-5">
            <Button variant="ghost" size="md" onClick={() => navigate('/marathon/points')}>
              {t('app.marathonTabPoints')}
            </Button>
          </div>
        </div>
      </Screen>
    </div>
  );
}
