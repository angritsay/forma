/**
 * «Доска» in the club admin: the weekly table, and the one decision that belongs to the coach —
 * who won the week.
 *
 * The same rows and places as the member's board (`rankWeek`, `BoardRow`), so the table the coach
 * announces from is the table the club reads. It opens on the running week and offers every week
 * so far, because the winner is usually announced on Monday for the week that just ended.
 *
 * Announcing and withdrawing both ask first: the cup is seen by the whole club the moment it is
 * set, and a tap meant for the row above should not be public.
 */
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/i18n/index';
import type { MarathonRow, MarathonScoreRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { BoardRow } from '@/app/features/marathon/BoardRow';
import { rankWeek } from '@/app/features/marathon/standings';
import { useMarathonScores } from '@/app/features/marathon/useMarathon';
import { boardWeek, boardWeeks } from './dates';
import { useWeekWinner } from './useWeekWinner';

export interface BoardTabProps {
  marathon: MarathonRow;
  /** Today's club day (0 before the start). */
  today: number;
}

export function BoardTab({ marathon, today }: BoardTabProps) {
  const { t, locale } = useT();
  const toast = useToast();
  const weeks = useMemo(() => boardWeeks(today, marathon.days), [today, marathon.days]);
  const [week, setWeek] = useState(() => boardWeek(today, marathon.days));
  const { data: rows, status, reload } = useMarathonScores(marathon.id, week);
  const { winner, toggle } = useWeekWinner(marathon.id, week);
  const [asking, setAsking] = useState<MarathonScoreRow | null>(null);
  const [busy, setBusy] = useState(false);

  const scored = rows.some((r) => r.points > 0);
  const withdrawing = asking !== null && winner?.memberId === asking.entryId;
  const weekText = formatNumber(locale, week);

  const confirm = async () => {
    if (!asking) return;
    setBusy(true);
    try {
      const now = await toggle(asking.entryId);
      toast.show({
        kind: 'success',
        title: t(now ? 'app.mAdminWinnerAnnounced' : 'app.mAdminWinnerWithdrawn'),
        description: now?.displayName,
      });
      setAsking(null);
    } catch {
      toast.show({ kind: 'error', title: t('app.mAdminWinnerError') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {weeks.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('app.mAdminTabBoard')}>
          {weeks.map((w) => (
            <Chip key={w} className="tap-target-y" selected={w === week} onClick={() => setWeek(w)}>
              {t('app.mAdminBoardWeek', { n: formatNumber(locale, w) })}
            </Chip>
          ))}
        </div>
      ) : null}

      <p className="text-[13px] text-muted-2">
        {marathon.teamSize <= 1 ? t('app.mAdminBoardHint') : t('app.mAdminBoardPairsNote')}
      </p>

      {status === 'loading' ? (
        <div className="flex flex-col gap-px" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} rounded="control" className="h-16" />
          ))}
        </div>
      ) : status === 'error' ? (
        <EmptyState
          title={t('app.mAdminLoadError')}
          action={
            <Button variant="primary" onClick={reload}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : !scored ? (
        <p className="border-t border-border py-6 text-[15px] text-muted-2">
          {t('app.marathonBoardEmpty')}
        </p>
      ) : (
        <ol className="flex flex-col">
          {rankWeek(rows).map(({ row, rank }) => {
            // Only a solo entry is a member id; a pair has nothing the winner table can hold yet.
            const solo = row.entryKind === 'solo';
            const isWinner = solo && winner?.memberId === row.entryId;
            return (
              <li key={row.entryId}>
                <BoardRow
                  row={row}
                  rank={rank}
                  winner={isWinner}
                  {...(solo
                    ? {
                        onAnnounce: () => setAsking(row),
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

      <Modal
        open={asking !== null}
        onClose={() => setAsking(null)}
        title={
          withdrawing
            ? t('app.mAdminWithdrawTitle')
            : t('app.mAdminAnnounceTitle', { name: asking?.title ?? '', week: weekText })
        }
        description={
          withdrawing
            ? t('app.mAdminWithdrawBody', { name: asking?.title ?? '', week: weekText })
            : t('app.mAdminAnnounceBody')
        }
        confirmLabel={withdrawing ? t('app.mAdminWithdrawConfirm') : t('app.mAdminAnnounceConfirm')}
        cancelLabel={t('common.cancel')}
        danger={withdrawing}
        loading={busy}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}
