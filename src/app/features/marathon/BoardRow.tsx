/**
 * One entry of the challenge's weekly board, shared by the board screen and the challenge's own day screen —
 * the short table under today's tasks is the same rows as the full one, and a race with two
 * different-looking tables is two races.
 *
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
  return (
    <div
      className={clsx(
        'flex items-center gap-3 border-t py-4',
        // Your own row is the one marked row: a 2px rule down its left edge, the same device the
        // course leaderboard uses. The rule is the challenge's colour rather than white, because
        // these screens set `--course-tile` to the challenge's orange and «you are here» is one of
        // the three things the brandbook lets that colour mark. The course board keeps its white:
        // different screen, different programme, and neither borrows the other's colour.
        row.isMine ? 'border-t-border border-l-2 border-l-course pl-3' : 'border-t-border',
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
        {/*
         * The prize belongs to the top row, and saying so on the row is what makes it a race — so
         * it is the one label here worth the colour. Orange on the near-black ground measures
         * 7.34:1, which carries this 10px label with room.
         *
         * It sits under the name rather than beside it. Beside, it was `shrink-0` next to a name
         * that truncates, so it took its 110px whole and the name gave up whatever was left: in
         * the challenge's side column «Аня и Дима» came out as «А…», and even on a phone the name
         * had 134px to live in and cleared that one by eight. A label about the row should never
         * be the reason the row cannot say whose it is.
         */}
        {row.rank === 1 ? (
          <span className="control-label text-course mt-0.5 block text-[10px]">
            {t('app.marathonBoardWinner')}
          </span>
        ) : null}
        {showMembers ? (
          <span className="block truncate text-[13px] text-muted-2">{row.members.join(', ')}</span>
        ) : null}
        {row.isMine ? <span className="sr-only">{t('app.marathonBoardYou')}</span> : null}
      </span>
      <span className="numeral tabular shrink-0 text-[15px]">
        {formatNumber(locale, row.points)}
      </span>
    </div>
  );
}
