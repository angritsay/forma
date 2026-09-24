/**
 * One entry of the club's weekly board, shared by the board screen and the club's own
 * day screen — the short table under today's tasks is the same rows as the full one, and a race
 * with two different-looking tables is two races.
 *
 * The rank is a circle, the way the owner's prototype draws it: the leader's filled in the club's
 * warm gradient under ink (design/CHANGELOG.md §17 — it was the third palette's neon «лидер» tag,
 * and the club has no neon), the rest outlined, so the top of the table is found before a single
 * number is read. It used to be a bare numeral with «ЧАС С ТРЕНЕРОМ» printed under the leader's name; the
 * prize is one pill above the table now, said once for the whole race rather than on one row.
 *
 * The place in the circle comes from `standings.ts` rather than from the row: the two backends
 * rank ties differently, and «где ты» has to be the same number in both. A row that has not scored
 * gets a dash — zero points is not a place, and «00» in the circle would claim it is.
 */
import { clsx } from 'clsx';
import { formatNumber, plural } from '@/i18n/index';
import type { MarathonScoreRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface BoardRowProps {
  row: MarathonScoreRow;
  /** The place to draw, from `weekStandings`. `null` for an entry on nothing. */
  rank: number | null;
  /**
   * Тренер объявил эту строку победителем недели (0028). Видно всем: в этом и смысл.
   *
   * Не то же самое, что первое место. Первое место считает арифметика и оно может измениться,
   * когда зачёркнут пруф; победителя называет Сергей, и с этого момента приз обещан именно этому
   * человеку. Обычно это одна и та же строка, но когда нет — правдой должно быть объявление.
   */
  winner?: boolean;
  /**
   * Нажатие «объявить победителем» — только у тренера и только на доске.
   *
   * Живёт в строке, а не рядом с таблицей, потому что выбор здесь — это выбор строки: на телефоне
   * «нажать на того, кто победил» короче любого списка имён, который пришлось бы строить сбоку.
   */
  onAnnounce?: () => void;
  /** Подпись действия: «Победитель» или «Снять» — решает вызывающий, он же знает состояние. */
  announceLabel?: string;
}

/**
 * The pair is the unit, so the team's name is the line and the two people are the
 * quiet line under it — on a board where a pair wins together, "Ваня и Витя" is the racer and
 * «Ваня, Витя» is the detail.
 */
export function BoardRow({ row, rank, winner, onAnnounce, announceLabel }: BoardRowProps) {
  const { t, locale } = useT();
  /*
   * The members go under the name — unless the name already contains them. A pair is very often
   * called «Ты и Марек», and printing «Ты, Марек» under it is the same information twice.
   */
  const showMembers =
    row.entryKind === 'team' &&
    row.members.length > 1 &&
    !row.members.every((name) => row.title.includes(name));
  const leader = rank === 1;
  /*
   * The «Ты» tag, by the same rule and for the same reason as the members line: a pair named «Ты и
   * Марек» has already said it, and «Ты и Марек · Ты» is the row stuttering. Matched as a whole
   * word, so a team called «Тыквы» keeps its tag.
   *
   * Except on the week you are leading. Then the circle is filled in the gradient and the
   * white ring that marks your row everywhere else is gone — and that is the one row the tag has
   * to survive on, because a leader's row is never drawn a second time lower down.
   */
  const you = t('app.marathonBoardYou');
  const showYou =
    row.isMine &&
    (leader ||
      !row.title
        .toLocaleLowerCase(locale)
        .split(/[^\p{L}\p{N}]+/u)
        .includes(you.toLocaleLowerCase(locale)));
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
          /* The leader wears the club's warm gradient with ink on it (≥ 6.04 on every stop) —
             this is the club's table, and the club paints with its gradient, not the neon the
             general leaderboard gives its leader (§17). */
          leader
            ? 'border-transparent bg-warm text-ink'
            : row.isMine
              ? 'border-text text-text'
              : rank !== null && rank <= 3
                ? 'border-border-strong text-text'
                : 'border-border text-muted-2',
        )}
      >
        {rank === null ? '—' : String(rank).padStart(2, '0')}
      </span>
      <span className="min-w-0 flex-1">
        {/*
         * «Ты» is a visible tag now, not an `sr-only` one. The white ring told you which row was
         * yours as long as the row was somewhere in the middle of the table; on the week you are
         * leading, the club's fill wins the circle and the ring is gone — and that is exactly the
         * week the screen must not stop saying so, because the leader's row is the one place the
         * member's own row is not drawn a second time underneath.
         */}
        <span className="flex min-w-0 items-baseline gap-2">
          {/* Кубок перед именем, а не после очков: он про человека, а не про число. */}
          {winner ? (
            <span className="emoji shrink-0 text-[15px]" aria-hidden="true">
              🏆
            </span>
          ) : null}
          <span className="font-display truncate text-[15px] leading-[1.24]">{row.title}</span>
          {showYou ? <span className="shrink-0 text-[13px] text-muted-2">{you}</span> : null}
        </span>
        {showMembers ? (
          <span className="block truncate text-[13px] text-muted-2">{row.members.join(', ')}</span>
        ) : null}
      </span>
      <span className="numeral tabular shrink-0 text-[17px]">
        {formatNumber(locale, row.points)}
      </span>
      {onAnnounce ? (
        <button
          type="button"
          onClick={onAnnounce}
          className={clsx(
            'control-label shrink-0 rounded-pill border px-3 py-1.5 text-[11px] transition-colors duration-150 ease-(--ease-out)',
            winner
              ? 'border-text text-text hover:bg-surface-2'
              : 'border-border text-muted-2 hover:border-border-strong hover:text-text',
          )}
        >
          {announceLabel}
        </button>
      ) : null}
    </div>
  );
}

/**
 * The break between the top of the table and your own row.
 *
 * It has to read as *a table with places missing from it*, and the obvious candidate — a row of
 * dots — reads as a spinner instead, which is the one thing it must not do on a screen that also
 * has a loading state. So the dots are stacked vertically where the rank circle would be, the way a
 * printed table of results elides its middle, and the words beside them count what was left out.
 * The geometry is the row's own (`size-11` column, `gap-4`, the hairline on top) so the dots land
 * dead centre under the circles above them.
 */
export function BoardGap({ hidden }: { hidden: number }) {
  const { t, locale } = useT();
  return (
    <div className="flex items-center gap-4 border-t border-border py-2">
      <span
        className="flex size-11 shrink-0 flex-col items-center justify-center gap-[3px]"
        aria-hidden="true"
      >
        <span className="size-[3px] rounded-pill bg-border-strong" />
        <span className="size-[3px] rounded-pill bg-border-strong" />
        <span className="size-[3px] rounded-pill bg-border-strong" />
      </span>
      <span className="text-[13px] text-muted-2">
        {plural(locale, hidden, {
          one: t('app.marathonBoardGapOne', { n: formatNumber(locale, hidden) }),
          few: t('app.marathonBoardGapFew', { n: formatNumber(locale, hidden) }),
          many: t('app.marathonBoardGapMany', { n: formatNumber(locale, hidden) }),
        })}
      </span>
    </div>
  );
}
