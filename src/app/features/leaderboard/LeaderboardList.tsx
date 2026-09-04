import { clsx } from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { formatNumber } from '@/i18n/index';
import type { LeaderboardRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { podiumPlace, type Podium } from './model';

const PODIUM_CLASS: Record<Podium, string> = {
  1: 'bg-warning text-on-primary',
  2: 'bg-text/80 text-on-primary',
  3: 'bg-accent-2 text-on-primary',
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
        'flex items-center gap-3 rounded-inner border px-3 py-2.5',
        row.isMe ? 'border-accent/40 bg-accent/10' : 'border-border bg-surface',
        pinned && 'shadow-card',
      )}
      aria-current={row.isMe ? 'true' : undefined}
    >
      <span
        className={clsx(
          'tabular flex size-9 shrink-0 items-center justify-center rounded-pill text-sm font-bold',
          place ? PODIUM_CLASS[place] : 'bg-surface-2 text-muted',
        )}
        aria-label={t('app.leaderboardRankLabel', { n: row.rank })}
      >
        {place === 1 ? <Icon name="trophy" size={18} /> : row.rank}
      </span>
      <Avatar seed={row.avatarSeed} name={row.displayName} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{row.displayName}</span>
        {row.isMe ? <span className="sr-only">{t('app.leaderboardYou')}</span> : null}
      </span>
      <span className="tabular shrink-0 text-[15px] font-semibold">
        {t('app.leaderboardPoints', { n: formatNumber(locale, row.points) })}
      </span>
    </div>
  );
}

export function LeaderboardList({ rows }: { rows: readonly LeaderboardRow[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.userId}>
          <LeaderboardRowView row={row} />
        </li>
      ))}
    </ol>
  );
}
