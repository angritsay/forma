import { clsx } from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { formatNumber } from '@/i18n/index';
import type { LeaderboardRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { podiumPlace, type Podium } from './model';

/*
 * The top three are marked by ink, not by a trophy and two coloured badges. Ranking is one scale,
 * so it is one treatment — the numeral, 01/02/03 — getting quieter as it descends: the podium in
 * full white, the rest in the second grey. No gold: the brandbook keeps colour for programmes.
 */
const PODIUM_CLASS: Record<Podium, string> = {
  1: 'text-text',
  2: 'text-text',
  3: 'text-muted',
};

export interface LeaderboardRowViewProps {
  row: LeaderboardRow;
  /** Rendered in the sticky footer (own row outside the top). */
  pinned?: boolean;
}

/** One athlete: rank as a numeral, square avatar, name and points. */
export function LeaderboardRowView({ row, pinned }: LeaderboardRowViewProps) {
  const { t, locale } = useT();
  const place = podiumPlace(row.rank);
  return (
    <div
      className={clsx(
        'flex items-center gap-3 border-t py-3',
        // Your own row is the one marked row: a 2px white rule down its left edge, not a tinted fill.
        row.isMe ? 'border-l-2 border-l-primary border-t-border pl-3' : 'border-t-border',
        pinned && 'border-t-0 bg-bg',
      )}
      aria-current={row.isMe ? 'true' : undefined}
    >
      <span
        className={clsx(
          'numeral tabular flex w-8 shrink-0 items-center justify-center text-base',
          place ? PODIUM_CLASS[place] : 'text-muted-2',
        )}
        aria-label={t('app.leaderboardRankLabel', { n: row.rank })}
      >
        {String(row.rank).padStart(2, '0')}
      </span>
      <Avatar seed={row.avatarSeed} name={row.displayName} size={36} />
      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-[15px] leading-[1.24]">
          {row.displayName}
        </span>
        {row.isMe ? <span className="sr-only">{t('app.leaderboardYou')}</span> : null}
      </span>
      <span className="numeral tabular shrink-0 text-[15px]">
        {t('app.leaderboardPoints', { n: formatNumber(locale, row.points) })}
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
