/**
 * Marathon — the weekly board.
 *
 * Two weeks and no more: this one and the last. That is the format, not a limitation — the week is
 * the race, it resets, and everyone starts Monday with a chance to win. An all-time column would
 * quietly undo that by making an early leader unbeatable and telling anyone who joined late that
 * they are already out of it.
 */
import { clsx } from 'clsx';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
import { formatNumber } from '@/i18n/index';
import type { MarathonScoreRow } from '@/lib/api/types';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { useMarathonScores, useMyMarathons } from '@/app/features/marathon/useMarathon';

type WeekChoice = 'this' | 'last';

export default function MarathonBoardScreen() {
  const { t, locale } = useT();
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

        {marathon.prize ? (
          <p className="border-t border-border pt-4 text-[13px] text-muted">
            <span className="control-label text-[10px] text-muted-2">{t('app.marathonPrize')}</span>{' '}
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
                  <BoardRow row={row} locale={locale} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Screen>
  );
}

/**
 * One entry. The pair is the unit, so the team's name is the line and the two people are the
 * quiet line under it — on a board where a pair wins together, "Ваня и Витя" is the racer and
 * «Ваня, Витя» is the detail.
 */
function BoardRow({
  row,
  locale,
}: {
  row: MarathonScoreRow;
  locale: Parameters<typeof formatNumber>[0];
}) {
  const { t } = useT();
  /*
   * The members go under the name — unless the name already contains them. A pair is very often
   * called «Ты и Марек», and printing «Ты, Марек» under it is the same information twice.
   */
  const showMembers =
    row.entryKind === 'team' &&
    row.members.length > 1 &&
    !row.members.every((name) => row.title.includes(name));
  return (
    <div
      className={clsx(
        'flex items-center gap-3 border-t py-4',
        // Your own row is the one marked row: a 2px rule down its left edge, same device as the
        // course leaderboard, so the two boards read as one family.
        row.isMine ? 'border-t-border border-l-2 border-l-primary pl-3' : 'border-t-border',
      )}
      aria-current={row.isMine ? 'true' : undefined}
    >
      <span
        className={clsx(
          'numeral tabular flex w-8 shrink-0 items-center justify-center text-base',
          row.rank <= 3 ? 'text-text' : 'text-muted-2',
        )}
      >
        {String(row.rank).padStart(2, '0')}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-[15px] leading-[1.24]">{row.title}</span>
        {showMembers ? (
          <span className="block truncate text-[13px] text-muted-2">{row.members.join(', ')}</span>
        ) : null}
        {row.isMine ? <span className="sr-only">{t('app.marathonBoardYou')}</span> : null}
      </span>
      {/* The prize belongs to the top row, and saying so on the row is what makes it a race. */}
      {row.rank === 1 ? (
        <span className="control-label shrink-0 text-[10px] text-muted-2">
          {t('app.marathonBoardWinner')}
        </span>
      ) : null}
      <span className="numeral tabular shrink-0 text-[15px]">
        {formatNumber(locale, row.points)}
      </span>
    </div>
  );
}
