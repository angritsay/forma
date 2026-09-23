/**
 * Marathon — the weekly board.
 *
 * Two weeks and no more: this one and the last. That is the format, not a limitation — the week is
 * the race, it resets, and everyone starts Monday with a chance to win. An all-time column would
 * quietly undo that by making an early leader unbeatable and telling anyone who joined late that
 * they are already out of it.
 *
 * It is a screen of the club, so it wears the club's style (style B, global.css header): the glow
 * behind it. The prize's pill and the leader's filled circle are the neon — the two things the
 * day screen's own table marks too. Your own row is a white ring. The week switch is a control and
 * chooses in electric blue like every other.
 *
 * It is the tab's overflow and nothing more. The standings are on the tab itself now — the top
 * three and the member's own row — because «только задание и лидерборд» means the leaderboard is
 * *on* the screen rather than a tap away from it; this is where the whole week and the week before
 * it live, for the one person in ten who wants to read the full table. Nothing else hangs off it —
 * «Мои баллы» used to, and the screen it led to is gone.
 *
 * The places come from `standings.ts`, the same function the tab's short table uses, so the two
 * tables cannot disagree about who is second. They could before: `marathon_scores()` breaks ties
 * inside its window function and hands back 2 and 3 where the demo's scorer shares a place.
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { TopBar } from '@/app/components/TopBar';
import { ScreenLoader } from '@/app/components/ScreenLoader';
import { useT } from '@/app/hooks/useT';
import { BoardRow } from '@/app/features/marathon/BoardRow';
import { clubPrize } from '@/app/features/marathon/prize';
import { rankWeek } from '@/app/features/marathon/standings';
import { useMarathonScores, useMyMarathons } from '@/app/features/marathon/useMarathon';
import { getMarathonWinner, setMarathonWinner } from '@/lib/api/marathonAdmin';
import type { MarathonWinner } from '@/lib/api/types';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';

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

  /*
   * Объявление победителя живёт здесь, а не отдельным экраном в админке.
   *
   * Выбор победителя — это выбор строки таблицы, и таблица уже здесь: на телефоне нажать на того,
   * кто выиграл, короче любого списка имён, который пришлось бы строить сбоку. Плюс переключатель
   * недель уже есть, а объявляют почти всегда за прошлую — в понедельник, глядя на воскресенье.
   *
   * Кнопка видна только тренеру; кубок в строке — всем.
   */
  const admin = useIsAdmin();
  const [winner, setWinner] = useState<MarathonWinner | null>(null);

  useEffect(() => {
    if (!marathon) return;
    let alive = true;
    getMarathonWinner(marathon.id, week)
      .then((w) => {
        if (alive) setWinner(w);
      })
      .catch(() => {
        /* Не тренер или сеть отказала — доска остаётся доской. */
        if (alive) setWinner(null);
      });
    return () => {
      alive = false;
    };
  }, [marathon, week]);

  const announce = useCallback(
    (memberId: string) => {
      if (!marathon) return;
      // Нажатие по уже объявленной строке снимает объявление: одна и та же кнопка туда и обратно.
      const next = winner?.memberId === memberId ? null : memberId;
      void setMarathonWinner(marathon.id, week, next)
        .then(() => getMarathonWinner(marathon.id, week))
        .then(setWinner)
        .catch(() => {
          /* Ничего не меняем на экране: следующий заход покажет, что на самом деле в базе. */
        });
    },
    [marathon, week, winner],
  );

  const header = <TopBar back title={t('app.marathonTitle')} />;

  if (marathonStatus === 'loading' || !marathon) {
    return (
      <Screen header={header}>
        <ScreenLoader />
      </Screen>
    );
  }

  const scored = rows.some((r) => r.points > 0);

  return (
    <div className="club-aurora-host" style={courseTileVars(GAME_TILE)}>
      {/* The club's glow (style B, global.css): this is a screen of the club. */}
      <div className="club-aurora" aria-hidden="true" />
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
            <Pill tone="neon">
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
                {rankWeek(rows).map(({ row, rank }) => {
                  /*
                   * `entryId` — это member id, пока клуб играется соло (`team_size = 1`), а он
                   * такой и есть. Для командного марафона объявлять победителя пока нечем, и
                   * кнопка там просто не появляется.
                   */
                  const solo = row.entryKind === 'solo';
                  const isWinner = solo && winner?.memberId === row.entryId;
                  return (
                    <li key={row.entryId}>
                      <BoardRow
                        row={row}
                        rank={rank}
                        winner={isWinner}
                        {...(admin === true && solo
                          ? {
                              onAnnounce: () => announce(row.entryId),
                              announceLabel: isWinner
                                ? t('app.boardWithdrawWinner')
                                : t('app.boardAnnounceWinner'),
                            }
                          : {})}
                      />
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </Screen>
    </div>
  );
}
