import { describe, expect, it } from 'vitest';
import type { MarathonScoreRow } from '@/lib/api/types';
import { boardDelta, boardGap, rankWeek, TOP_ROWS, weekStandings } from './standings';

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
    /*
     * 'd' used to be counted as hidden and this expected `skipped: 1`. It is now drawn, as the
     * neighbour one place above — so nothing is left out between the third row and the tail, and a
     * gap here would be claiming otherwise.
     */
    expect(s.above?.row.entryId).toBe('d');
    expect(s.below).toBeNull();
    expect(s.skipped).toBe(0);
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

    /*
     * Five scored and mine fifth: fourth is drawn as the neighbour above, so nothing is hidden.
     * Six scored and mine sixth is the first arrangement with a real gap — fifth is the neighbour,
     * and fourth is the one place nobody sees.
     */
    const five = [row('a', 50), row('b', 40), row('c', 30), row('d', 20), row('mine', 10, true)];
    expect(weekStandings(five, ME).skipped).toBe(0);

    const six = [
      row('a', 50),
      row('b', 40),
      row('c', 30),
      row('d', 20),
      row('e', 10),
      row('mine', 5, true),
    ];
    const deep = weekStandings(six, ME);
    expect(deep.above?.row.entryId).toBe('e');
    expect(deep.skipped).toBe(1);
  });

  /*
   * The owner's mockup ends the table on `… · 168 Маша · **169 Ты** · 170 Никита`, and the reason
   * is what those two extra rows are for: at 169th the leader is a stranger, and the person one
   * row up is the only opponent that week who is in reach.
   */
  describe('the neighbours around your row', () => {
    it('draws the row above and the row below', () => {
      const rows = [
        row('a', 60),
        row('b', 50),
        row('c', 40),
        row('d', 30),
        row('above', 20),
        row('mine', 15, true),
        row('below', 10),
        row('far', 5),
      ];
      const s = weekStandings(rows, ME);
      expect(s.above?.row.entryId).toBe('above');
      expect(s.below?.row.entryId).toBe('below');
      // 'd' is the only ranked entry nobody sees.
      expect(s.skipped).toBe(1);
    });

    it('never repeats a neighbour that is already in the top three', () => {
      // Fourth place: the row above is the third, which is on screen already. The same name twice
      // inside five rows reads as a broken table, so it is dropped rather than printed.
      const rows = [row('a', 50), row('b', 40), row('c', 30), row('mine', 20, true), row('e', 10)];
      const s = weekStandings(rows, ME);
      expect(s.above).toBeNull();
      expect(s.below?.row.entryId).toBe('e');
      expect(s.skipped).toBe(0);
    });

    it('gives the last row of the week no neighbour below it', () => {
      const rows = [row('a', 50), row('b', 40), row('c', 30), row('d', 20), row('mine', 10, true)];
      const s = weekStandings(rows, ME);
      expect(s.above?.row.entryId).toBe('d');
      expect(s.below).toBeNull();
    });

    it('has none to offer when you are leading, because your row is not drawn twice', () => {
      const rows = [row('mine', 50, true), row('b', 40), row('c', 30), row('d', 20)];
      const s = weekStandings(rows, ME);
      expect(s.mine).toBeNull();
      expect(s.above).toBeNull();
      expect(s.below).toBeNull();
    });

    it('steps by row and not by place, so a tie above you is still the row above you', () => {
      /*
       * `rank ± 1` would be wrong here and this is the case that shows it: four entries tied on 20
       * are all rank 4, so the place above 4th is 1 — three rows further up than the row that is
       * actually above. An index step gives the line the mockup draws.
       */
      const rows = [
        row('a', 50),
        row('b', 45),
        row('c', 40),
        row('t1', 20),
        row('t2', 20),
        row('mine', 20, true),
        row('t4', 20),
      ];
      const s = weekStandings(rows, ME);
      expect(s.mine?.rank).toBe(4);
      expect(s.above?.row.entryId).toBe('t2');
      expect(s.above?.rank).toBe(4);
      expect(s.below?.row.entryId).toBe('t4');
    });

    it('gives an unscored member neighbours from the bottom of the list, not from the ranking', () => {
      // Below the ranking nobody has a place, so the rows are the backend's own order. They are
      // still the rows on either side of yours, which is what the tail is for.
      const rows = [row('a', 50), row('b', 40), row('c', 30), row('z1', 0), row('mine', 0, true)];
      const s = weekStandings(rows, ME);
      expect(s.place).toEqual({ kind: 'unscored' });
      expect(s.above?.row.entryId).toBe('z1');
      expect(s.above?.rank).toBeNull();
      expect(s.below).toBeNull();
    });
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
      above: null,
      below: null,
      skipped: 0,
      place: { kind: 'missing' },
    });

    const allZero = weekStandings([row('a', 0), row('mine', 0, true)], ME);
    expect(allZero.top).toEqual([]);
    expect(allZero.mine).toBeNull();
    expect(allZero.place).toEqual({ kind: 'unscored' });
  });
});

describe('boardDelta', () => {
  it('has nothing to compare on a first visit', () => {
    expect(boardDelta(null, { rank: 3, points: 20, week: 2 })).toEqual({
      rankDelta: null,
      pointsDelta: 0,
    });
  });

  it('measures places gained and points earned since the last visit', () => {
    const prev = { rank: 5, points: 12, week: 2 };
    expect(boardDelta(prev, { rank: 3, points: 27, week: 2 })).toEqual({
      rankDelta: 2,
      pointsDelta: 15,
    });
    expect(boardDelta(prev, { rank: 6, points: 12, week: 2 })).toEqual({
      rankDelta: -1,
      pointsDelta: 0,
    });
  });

  it('never compares across weeks', () => {
    expect(boardDelta({ rank: 1, points: 60, week: 1 }, { rank: 4, points: 0, week: 2 })).toEqual({
      rankDelta: null,
      pointsDelta: 0,
    });
  });

  it('does not count a first score as a move up from nowhere', () => {
    expect(
      boardDelta({ rank: null, points: 0, week: 2 }, { rank: 4, points: 10, week: 2 }),
    ).toEqual({ rankDelta: null, pointsDelta: 10 });
    expect(
      boardDelta({ rank: 4, points: 10, week: 2 }, { rank: null, points: 0, week: 2 }),
    ).toEqual({ rankDelta: null, pointsDelta: -10 });
  });
});

describe('boardGap', () => {
  it('names the nearest entry with more points and the distance to it', () => {
    // Аня 42 · Марек 37 · Дима 27 · Ты 22 — the seed's own week.
    const gap = boardGap([row('Аня', 42), row('Марек', 37), row('Дима', 27), row('Ты', 22, true)]);
    expect(gap).toEqual({ kind: 'chase', name: 'Дима', points: 5 });
  });

  it('chases past a tie to the first entry actually above', () => {
    const gap = boardGap([row('a', 30), row('b', 20), row('me', 20, true), row('c', 10)]);
    expect(gap).toEqual({ kind: 'chase', name: 'a', points: 10 });
  });

  it('reports the lead when the member is alone at the top', () => {
    expect(boardGap([row('me', 30, true), row('b', 24)])).toEqual({ kind: 'leader', lead: 6 });
    expect(boardGap([row('me', 30, true)])).toEqual({ kind: 'leader', lead: 30 });
  });

  it('says nothing for a shared lead, an unscored member or no row at all', () => {
    expect(boardGap([row('me', 30, true), row('b', 30)])).toBeNull();
    expect(boardGap([row('a', 30), row('me', 0, true)])).toBeNull();
    expect(boardGap([row('a', 30)])).toBeNull();
  });
});
