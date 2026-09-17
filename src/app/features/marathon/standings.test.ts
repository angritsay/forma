import { describe, expect, it } from 'vitest';
import type { MarathonScoreRow } from '@/lib/api/types';
import { rankWeek, TOP_ROWS, weekStandings } from './standings';

const ME = 'demo_mmember_me';

/**
 * A row as `marathon_scores()` hands it over — including its `rank`, which is deliberately set to
 * nonsense in these fixtures. Nothing here may read it: the whole point of the module is that the
 * place is computed from the points.
 */
function row(entryId: string, points: number, isMine = false): MarathonScoreRow {
  return {
    entryKind: 'team',
    entryId,
    title: entryId,
    members: [],
    points,
    rank: 999,
    isMine,
  };
}

const places = (rows: readonly MarathonScoreRow[]) =>
  rankWeek(rows).map((r) => [r.row.entryId, r.rank]);

describe('rankWeek', () => {
  it('orders by points and shares a place on equal points', () => {
    // 30, 20, 20, 10 → 1, 2, 2, 4. The place after a tie is skipped, not reused.
    expect(places([row('c', 20), row('a', 30), row('d', 10), row('b', 20)])).toEqual([
      ['a', 1],
      ['c', 2],
      ['b', 2],
      ['d', 4],
    ]);
  });

  it('keeps the backend order between equals', () => {
    // The server already tie-broke by team sort order and title; a stable sort must not undo it.
    expect(places([row('first', 10), row('second', 10), row('third', 10)])).toEqual([
      ['first', 1],
      ['second', 1],
      ['third', 1],
    ]);
  });

  it('gives an entry on nothing no place at all, and puts it last', () => {
    expect(places([row('zero', 0), row('leader', 5)])).toEqual([
      ['leader', 1],
      ['zero', null],
    ]);
  });
});

describe('weekStandings', () => {
  it('shows the top three and pulls the member down with their real place', () => {
    const rows = [
      row('a', 50),
      row('b', 40),
      row('c', 30),
      row('d', 20),
      row('e', 10, true), // fifth
    ];
    const s = weekStandings(rows, ME);
    expect(s.top.map((r) => r.row.entryId)).toEqual(['a', 'b', 'c']);
    expect(s.mine?.row.entryId).toBe('e');
    expect(s.mine?.rank).toBe(5);
    // One entry ('d') sits between the third row and mine, so the table shows a gap.
    expect(s.skipped).toBe(1);
    expect(s.place).toEqual({ kind: 'ranked', rank: 5, points: 10, inTop: false });
  });

  it('pulls fourth down without a gap — the first place that has to be pulled', () => {
    const rows = [row('a', 50), row('b', 40), row('c', 30), row('d', 20, true)];
    const s = weekStandings(rows, ME);
    expect(s.mine?.rank).toBe(4);
    // Nothing was left out: the row follows the third directly and a break would be a lie.
    expect(s.skipped).toBe(0);
  });

  it('never draws the member twice when they are leading', () => {
    const rows = [row('a', 50, true), row('b', 40), row('c', 30), row('d', 20)];
    const s = weekStandings(rows, ME);
    expect(s.place).toEqual({ kind: 'ranked', rank: 1, points: 50, inTop: true });
    expect(s.mine).toBeNull();
    expect(s.top[0]?.row.isMine).toBe(true);
  });

  it('counts the member in the top three by the rows on screen, not by the number', () => {
    // Four entries tied on first. Everybody is rank 1; only three of them are drawn, and the
    // fourth still has to be pulled down or the screen tells them nothing.
    const rows = [row('a', 10), row('b', 10), row('c', 10), row('d', 10, true)];
    const s = weekStandings(rows, ME);
    expect(s.top).toHaveLength(TOP_ROWS);
    expect(s.place).toEqual({ kind: 'ranked', rank: 1, points: 10, inTop: false });
    expect(s.mine?.row.entryId).toBe('d');
    expect(s.mine?.rank).toBe(1);
    expect(s.skipped).toBe(0);
  });

  it('gives the last place its number', () => {
    const rows = [row('a', 50), row('b', 40), row('c', 30), row('d', 20), row('e', 1, true)];
    const s = weekStandings(rows, ME);
    expect(s.mine?.rank).toBe(5);
    expect(s.place.kind).toBe('ranked');
  });

  it('says "no points yet" rather than a place for a member on zero', () => {
    const rows = [row('a', 50), row('b', 40), row('c', 30), row('mine', 0, true)];
    const s = weekStandings(rows, ME);
    expect(s.place).toEqual({ kind: 'unscored' });
    // The row is still pulled down — the member sees their own name and their own nothing — but it
    // carries no place, so the screen can never print «0 место».
    expect(s.mine?.row.entryId).toBe('mine');
    expect(s.mine?.rank).toBeNull();
    expect(s.skipped).toBe(0);
  });

  it('counts the gap in places, never in rows that have none', () => {
    // One entry has scored and is the whole top; three more are on nothing, mine among them. The
    // ranking skips nobody, so there is no gap to draw even though rows were left out.
    const rows = [row('a', 50), row('b', 0), row('c', 0), row('mine', 0, true)];
    expect(weekStandings(rows, ME).skipped).toBe(0);

    // With five scored and mine fifth, one *place* is missing between the third row and mine.
    const deep = [row('a', 50), row('b', 40), row('c', 30), row('d', 20), row('mine', 10, true)];
    expect(weekStandings(deep, ME).skipped).toBe(1);
  });

  it('says "not in the table" for a member with no row of their own', () => {
    const s = weekStandings([row('a', 50), row('b', 40)], ME);
    expect(s.place).toEqual({ kind: 'missing' });
    expect(s.mine).toBeNull();
    expect(s.top).toHaveLength(2);
  });

  it('has nothing to say about a caller it cannot identify', () => {
    const s = weekStandings([row('a', 50, true)], null);
    expect(s.place).toEqual({ kind: 'missing' });
    expect(s.mine).toBeNull();
  });

  it('is empty when nobody has scored, and adds no lonely zero row', () => {
    expect(weekStandings([], ME)).toEqual({
      top: [],
      mine: null,
      skipped: 0,
      place: { kind: 'missing' },
    });

    const allZero = weekStandings([row('a', 0), row('mine', 0, true)], ME);
    expect(allZero.top).toEqual([]);
    expect(allZero.mine).toBeNull();
    expect(allZero.place).toEqual({ kind: 'unscored' });
  });
});
