/**
 * Seven tiles under the club's HUD — the week without a sentence (`weekTrack.ts` decides the
 * states; this only paints them).
 *
 *   done        the warm gradient, filled — the club's colour on a day that counted
 *   today       an orange hairline, breathing (`streak-pulse`) — the hot end of the same gradient,
 *               the day that is still open
 *   today-done  filled like any done day; the pulse stops the moment the proof is in
 *   missed      `--surface-2`, a tile that went by
 *   future      a hairline
 *
 * The two-letter weekday under each tile is the only type here, 11px in the quiet grey. Each
 * tile carries its date and state for a screen reader; the row is one list.
 */
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { formatDate } from '@/i18n/index';
import { prefersReducedMotion } from '@/lib/ui/motion';
import { useT } from '@/app/hooks/useT';
import { weekTrack, type TrackState } from './weekTrack';

export interface WeekTrackProps {
  days: readonly string[] | null;
  today: string;
  className?: string;
}

const TILE: Record<TrackState, string> = {
  done: 'bg-warm',
  'today-done': 'bg-warm',
  today: 'border border-orange',
  missed: 'bg-surface-2',
  future: 'border border-border',
};

export function WeekTrack({ days, today, className }: WeekTrackProps) {
  const { t, locale } = useT();
  const labels = useMemo(() => t('app.clubWeekdays').split(','), [t]);
  const tiles = useMemo(() => weekTrack({ days, today, labels }), [days, today, labels]);
  const still = useMemo(() => prefersReducedMotion(), []);

  const word = (state: TrackState) =>
    state === 'done' || state === 'today-done'
      ? t('app.clubTileDone')
      : state === 'missed'
        ? t('app.clubTileMissed')
        : state === 'today'
          ? t('app.clubTileToday')
          : t('app.clubTileFuture');

  return (
    <ol
      className={clsx('flex items-start justify-between', className)}
      aria-label={t('app.clubWeekTrack')}
    >
      {tiles.map((tile) => (
        <li
          key={tile.iso}
          className="flex w-9 flex-col items-center gap-1.5"
          aria-label={`${formatDate(locale, tile.iso)} · ${word(tile.state)}`}
          aria-current={tile.state === 'today' || tile.state === 'today-done' ? 'date' : undefined}
        >
          <span
            aria-hidden="true"
            className={clsx(
              'size-8 rounded-tile',
              TILE[tile.state],
              tile.state === 'today' && !still && 'streak-pulse',
            )}
          />
          <span aria-hidden="true" className="text-[11px] leading-none text-muted-2">
            {tile.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
