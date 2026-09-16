/**
 * One entry of the challenge's weekly board, shared by the board screen and the challenge's own
 * day screen — the short table under today's tasks is the same rows as the full one, and a race
 * with two different-looking tables is two races.
 *
 * The rank is a circle, the way the owner's prototype draws it: the leader's filled in the
 * challenge's colour, the rest outlined, so the top of the table is found before a single number
 * is read. It used to be a bare numeral with «ЧАС С ТРЕНЕРОМ» printed under the leader's name; the
 * prize is one pill above the table now, said once for the whole race rather than on one row.
 */
import { clsx } from 'clsx';
import { formatNumber } from '@/i18n/index';
import type { MarathonScoreRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

/**
 * The pair is the unit, so the team's name is the line and the two people are the
 * quiet line under it — on a board where a pair wins together, "Ваня и Витя" is the racer and
 * «Ваня, Витя» is the detail.
 */
export function BoardRow({ row }: { row: MarathonScoreRow }) {
  const { t, locale } = useT();
  /*
   * The members go under the name — unless the name already contains them. A pair is very often
   * called «Ты и Марек», and printing «Ты, Марек» under it is the same information twice.
   */
  const showMembers =
    row.entryKind === 'team' &&
    row.members.length > 1 &&
    !row.members.every((name) => row.title.includes(name));
  const leader = row.rank === 1;
  return (
    <div
      className="flex items-center gap-4 border-t border-border py-3.5"
      aria-current={row.isMine ? 'true' : undefined}
    >
      {/*
       * Your own row is told apart by its circle: a white ring instead of the hairline, the same
       * «you are here» the tab bar's highlight gives a tab. Never the colour — that is the leader's,
       * and on the one week both are you the fill wins.
       */}
      <span
        className={clsx(
          'numeral tabular flex size-11 shrink-0 items-center justify-center rounded-pill border text-[13px]',
          leader
            ? 'border-transparent bg-course text-on-course'
            : row.isMine
              ? 'border-text text-text'
              : row.rank <= 3
                ? 'border-border-strong text-text'
                : 'border-border text-muted-2',
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
      <span className="numeral tabular shrink-0 text-[17px]">
        {formatNumber(locale, row.points)}
      </span>
    </div>
  );
}
