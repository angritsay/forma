import { clsx } from 'clsx';
import { formatNumber } from '@/i18n/index';
import type { LeaderboardRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { podiumPlace } from './model';

export interface LeaderboardRowViewProps {
  row: LeaderboardRow;
  /** Rendered in the sticky footer (own row outside the top). */
  pinned?: boolean;
}

/**
 * One athlete: the rank in a circle, the name, the points as a bare numeral.
 *
 * Drawn the way the club's `BoardRow` draws its rows, because a product with two boards that
 * look different has two races. The leader's circle is filled in the neon on both — the third
 * palette's «лидер» tag, which belongs to no programme. Your own row is a white ring, the same «you are here» the tab bar's
 * highlight gives a tab; the podium keeps a stronger hairline, the rest fade to the second grey.
 *
 * The avatar is gone from the row. A rank is a circle and a person is a circle, and two circles
 * per row read as a pair of controls; the rank is the one that orders the table, so it stays.
 * The «оч.» after the points went with it: a column of numerals under a heading that says what
 * the table counts does not need the unit on every line.
 */
export function LeaderboardRowView({ row, pinned }: LeaderboardRowViewProps) {
  const { t, locale } = useT();
  const leader = row.rank === 1 && row.points > 0;
  return (
    <div
      className={clsx(
        'flex items-center gap-4 border-t border-border py-3.5',
        pinned && 'border-t-0 bg-bg',
      )}
      aria-current={row.isMe ? 'true' : undefined}
    >
      <span
        className={clsx(
          'numeral tabular flex size-11 shrink-0 items-center justify-center rounded-pill border text-[13px]',
          /* The leader is the neon — one of the tags the third palette gives it («лидер»). */
          leader
            ? 'border-transparent bg-action text-on-action'
            : row.isMe
              ? 'border-text text-text'
              : podiumPlace(row.rank)
                ? 'border-border-strong text-text'
                : 'border-border text-muted-2',
        )}
        aria-label={t('app.leaderboardRankLabel', { n: row.rank })}
      >
        {String(row.rank).padStart(2, '0')}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-[15px] leading-[1.24]">
          {row.displayName}
        </span>
        {row.isMe ? <span className="sr-only">{t('app.leaderboardYou')}</span> : null}
      </span>
      <span className="numeral tabular shrink-0 text-[17px]">
        {formatNumber(locale, row.points)}
      </span>
    </div>
  );
}

export function LeaderboardList({ rows }: { rows: readonly LeaderboardRow[] }) {
  return (
    <ol className="flex flex-col">
      {rows.map((row) => (
        <li key={row.userId}>
          <LeaderboardRowView row={row} />
        </li>
      ))}
    </ol>
  );
}
