/**
 * Where the week stands, and — the part the club tab was missing — **where you are in it**.
 *
 * The owner asked for «рейтинг этой недели (топ 3 и где ты)». The tab used to print the first five
 * rows and stop, which answers the first half and silently drops the second: a member in sixth
 * place opened the club and learned nothing at all about their own week. Three rows, then their own
 * row pulled down to meet them, is the shape every standings table settles on for that reason.
 *
 * ## Why the rank is recomputed here rather than read off the row
 *
 * `MarathonScoreRow.rank` is whatever the backend handed over, and the two backends disagree.
 * `marathon_scores()` ranks with `rank() over (order by pts desc, sort_order, title)`, so the
 * tie-break columns are inside the window and two entries on 20 points come back as 2 and 3. The
 * demo's own `board()` (src/lib/marathon/score.ts) shares the rank, as the comment there says it
 * should. A race where the same two pairs are "joint second" in one build and "second and third" in
 * another is not a race, so the arithmetic that decides what the member reads lives in one pure
 * function, on this side, over the whole week's rows.
 *
 * **Equal points share a place.** Two pairs on 20 are both second and the next is fourth — standard
 * competition ranking, the thing everyone already expects from a leaderboard.
 *
 * ## Zero is not a place
 *
 * An entry with no points has not entered the ranking; it is below everybody, and «0 место» is not
 * a sentence in any language. So a scoreless entry gets `rank: null`, the row draws a dash, and the
 * member is told they have not scored yet. That is a different fact from **no row at all** — a
 * member the coach has just added, before the board has been built around them — and the two get
 * different answers here (`unscored` against `missing`) because they need different sentences.
 */
import type { MarathonScoreRow } from '@/lib/api/types';

/** How much of the week the club tab shows before it jumps to the member's own row. */
export const TOP_ROWS = 3;

export interface RankedRow {
  row: MarathonScoreRow;
  /** The place in the week, ties shared. `null` for an entry that has not scored at all. */
  rank: number | null;
}

/**
 * The answer to «где ты», in the three shapes it actually has.
 *
 * `inTop` is membership of the three rows on screen rather than `rank <= TOP_ROWS`: with four
 * entries tied on first place, everybody is rank 1 and only three of them are drawn.
 */
export type MyPlace =
  | { kind: 'ranked'; rank: number; points: number; inTop: boolean }
  /** In the week's table, on nothing. Below everybody, and without a place. */
  | { kind: 'unscored' }
  /** Not in the week's table at all — nothing to pull down and nothing to number. */
  | { kind: 'missing' };

export interface Standings {
  /** The head of the week: at most {@link TOP_ROWS} rows, only entries that have scored. */
  top: RankedRow[];
  /** The member's own row, when it is not already one of `top`. Null when there is nothing to add. */
  mine: RankedRow | null;
  /**
   * The rows immediately above and below `mine` — the half of «где ты» that a number cannot answer.
   *
   * The owner's mockup draws the tail as `… · 168 Маша · **169 Ты** · 170 Никита`, and it is right
   * about which fact is useful: at 169th the leader's score is news about a stranger, while the
   * person one row up is the only opponent that week who is actually in reach. A lone «169 Ты»
   * under the top three states a position and gives nothing to do about it.
   *
   * Either is null when there is no such row: the member is first or last of the week, or the
   * neighbour is already one of `top` and printing it twice inside five rows would read as a fault
   * in the table rather than as a neighbour.
   */
  above: RankedRow | null;
  below: RankedRow | null;
  /**
   * Ranked entries hidden between the last row of `top` and the first row drawn after the gap.
   *
   * That first row is `above` when there is one, so the count drops by one as the neighbour moves
   * out of the gap and into the table. The two always have to add up to the same week.
   */
  skipped: number;
  place: MyPlace;
}

/**
 * Every row of the week in reading order, with the place it actually holds.
 *
 * Scored entries first, best first, ties sharing a place; then the entries on nothing, in the order
 * the backend sent them — the sort is stable, so the server's own tie-break (team sort order, then
 * title) still decides who is printed above whom among equals.
 */
export function rankWeek(rows: readonly MarathonScoreRow[]): RankedRow[] {
  const scored = rows.filter((r) => r.points > 0).sort((a, b) => b.points - a.points);
  const ranked: RankedRow[] = scored.map((row) => ({
    row,
    // The first index at these points is the place they share: [30, 20, 20, 10] → 1, 2, 2, 4.
    rank: 1 + scored.findIndex((o) => o.points === row.points),
  }));
  return [...ranked, ...rows.filter((r) => r.points <= 0).map((row) => ({ row, rank: null }))];
}

/**
 * The club tab's board: the top three, and the member's own row when they are not in it.
 *
 * `memberId` is the person, and it is what made `isMine` true on the way here — the score rows carry
 * display names rather than member ids, so the flag is the only link back to them. Passing it keeps
 * the "we do not know who is asking" case distinct from "we know, and they are not on the board".
 */
export function weekStandings(
  rows: readonly MarathonScoreRow[],
  memberId: string | null,
): Standings {
  const ranked = rankWeek(rows);
  const scored = ranked.filter((r) => r.rank !== null);
  const top = scored.slice(0, TOP_ROWS);
  const mineRow = memberId === null ? undefined : ranked.find((r) => r.row.isMine);

  const place: MyPlace =
    mineRow === undefined
      ? { kind: 'missing' }
      : mineRow.rank === null
        ? { kind: 'unscored' }
        : {
            kind: 'ranked',
            rank: mineRow.rank,
            points: mineRow.row.points,
            inTop: top.includes(mineRow),
          };

  /*
   * A week nobody has scored in shows as empty rather than as a column of zeros, and that includes
   * the member's own zero: «Пока никто не набрал баллов» with one lonely row under it would be the
   * screen contradicting itself.
   */
  const mine =
    top.length > 0 && mineRow !== undefined && !(place.kind === 'ranked' && place.inTop)
      ? mineRow
      : null;

  /*
   * The neighbours, taken off the ranking in reading order rather than by arithmetic on the place.
   *
   * Indexes and not `rank ± 1`, because a place is not a position: with three entries tied on
   * second, the row above 169th may also be 169th, and the row above an unscored member has no
   * place at all. What the mockup shows is the line above and the line below on the same table, and
   * that is exactly what an index step gives.
   *
   * A neighbour already printed in `top` is dropped rather than repeated — the top three and the
   * tail are one table, and the same name twice inside five rows reads as a bug.
   */
  const shown = new Set(top);
  const at = mine === null ? -1 : ranked.indexOf(mine);
  const neighbour = (i: number): RankedRow | null => {
    const row = i < 0 ? undefined : ranked[i];
    return row === undefined || shown.has(row) ? null : row;
  };
  const above = mine === null ? null : neighbour(at - 1);
  const below = mine === null ? null : neighbour(at + 1);

  /*
   * The gap stands for places skipped in the ranking, so it counts ranked entries and only those.
   * Below the ranking everybody is equally without a place and the order down there is the
   * backend's tie-break rather than a standing — «ещё 1 место» over a row that has no place would
   * be inventing one.
   *
   * It is measured to the first row actually drawn after it, which is the neighbour above when
   * there is one. Measuring to `mine` while drawing `above` between them would count that
   * neighbour as both hidden and visible.
   */
  const first = above ?? mine;
  const cut = first === null ? 0 : first.rank === null ? scored.length : scored.indexOf(first);

  return { top, mine, above, below, skipped: Math.max(cut - top.length, 0), place };
}
