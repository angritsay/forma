import { describe, expect, it } from 'vitest';
import type { MarathonScoreRow } from '@/lib/api/types';
import { podiumOf, shortPrize } from './podium';
import { boardGap, weekStandings } from './standings';

const ME = 'demo_mmember_me';

function row(entryId: string, points: number, isMine = false): MarathonScoreRow {
  return { entryKind: 'solo', entryId, title: entryId, members: [], points, rank: 999, isMine };
}

describe('podiumOf', () => {
  it('lays the top three out as second · first · third', () => {
    const rows = [row('b', 40), row('a', 50), row('c', 30), row('d', 20, true)];
    const p = podiumOf(weekStandings(rows, ME));
    expect(p.columns.map((c) => c && [c.step, c.row.entryId, c.rank])).toEqual([
      [2, 'b', 2],
      [1, 'a', 1],
      [3, 'c', 3],
    ]);
  });

  it('draws my own line under it when I am not on the podium, with the move and the gap', () => {
    const rows = [row('a', 50), row('b', 40), row('c', 30), row('d', 20), row('e', 10, true)];
    const s = weekStandings(rows, ME);
    const p = podiumOf(s, { delta: 2, gap: boardGap(rows) });
    expect(p.me).toEqual({
      rank: 5,
      points: 10,
      delta: 2,
      gap: { kind: 'chase', name: 'd', points: 10 },
    });
  });

  it('draws no line of mine when I am one of the three', () => {
    const rows = [row('a', 50), row('b', 40, true), row('c', 30)];
    expect(podiumOf(weekStandings(rows, ME)).me).toBeNull();
  });

  it('keeps the shared place on the step', () => {
    // 30, 20, 20 → steps 1, 2, 3 but places 1, 2, 2.
    const rows = [row('a', 30), row('b', 20), row('c', 20)];
    const p = podiumOf(weekStandings(rows, ME));
    expect(p.columns.map((c) => c?.rank)).toEqual([2, 1, 2]);
  });

  it('leaves the empty steps empty on a week nobody has scored in', () => {
    const p = podiumOf(weekStandings([row('a', 0), row('me', 0, true)], ME));
    expect(p.columns).toEqual([null, null, null]);
    expect(p.me).toBeNull();
  });

  it('draws me without a place when I am on nothing under a scored top', () => {
    const rows = [row('a', 10), row('me', 0, true)];
    const p = podiumOf(weekStandings(rows, ME), { gap: boardGap(rows) });
    expect(p.columns[1]?.row.entryId).toBe('a');
    expect(p.me).toEqual({ rank: null, points: 0, delta: null, gap: null });
  });
});

describe('shortPrize', () => {
  it('keeps a short prize as it is', () => {
    expect(shortPrize('Час с тренером')).toBe('Час с тренером');
  });

  it('cuts at the dash the coach wrote', () => {
    expect(shortPrize('Час с тренером — для каждого из пары')).toBe('Час с тренером');
  });

  it('cuts a long prize at a word, never leaving «и» hanging', () => {
    expect(shortPrize('Час с тренером и создателем Forma')).toBe('Час с тренером…');
    expect(shortPrize('An hour with the coach and the founder of Forma')).toBe(
      'An hour with the coach…',
    );
  });

  it('never returns more than the budget', () => {
    for (const s of [
      'Абонемент на месяц в зал рядом с домом',
      'Ужин',
      'Оченьдлинноесловобезпробеловвообщеникаких',
    ]) {
      expect(shortPrize(s).length).toBeLessThanOrEqual(24);
    }
  });
});
