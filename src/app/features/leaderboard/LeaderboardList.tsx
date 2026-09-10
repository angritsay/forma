import { clsx } from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { formatNumber } from '@/i18n/index';
import type { LeaderboardRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { podiumPlace, type Podium } from './model';

/*
 * The top three are marked by ink, not by three differently-coloured filled badges. A leaderboard
 * with a gold, a silver and a lilac chip in the same column reads as three unrelated states;
 * ranking is one scale, so it is one treatment getting quieter as it descends.
 */
const PODIUM_CLASS: Record<Podium, string> = {
  1: 'text-warning',
  2: 'text-text',
  3: 'text-muted',
};

export interface LeaderboardRowViewProps {
  row: LeaderboardRow;
  /** Rendered in the sticky footer (own row outside the top). */
  pinned?: boolean;
}

/** One athlete: rank (podium badge for the top three), avatar, name and points. */
export function LeaderboardRowView({ row, pinned }: LeaderboardRowViewProps) {
  const { t, locale } = useT();
  const place = podiumPlace(row.rank);
  return (
    <div
      className={clsx(
        'flex items-center gap-3 border-t py-3',
        // Your own row is the one place the accent appears: a marked left edge, not a tinted fill.
        row.isMe ? 'border-l-2 border-l-accent border-t-border pl-3' : 'border-t-border',
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
        {place === 1 ? <Icon name="trophy" size={16} /> : String(row.rank).padStart(2, '0')}
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
