import { describe, expect, it } from 'vitest';
import {
  EMPTY_CLUB_MEMORY,
  hasMilestone,
  hasWinner,
  isOpened,
  lastBoard,
  markOpened,
  memoryKey,
  parseMemory,
  readClubMemory,
  rememberBoard,
  rememberMilestone,
  rememberWinner,
  updateClubMemory,
  winnerKey,
  writeClubMemory,
} from './clubMemory';

describe('clubMemory — the key', () => {
  it('is one per account, whatever the case the address was typed in', () => {
    expect(memoryKey('Anna@Example.com')).toBe(memoryKey('anna@example.com'));
    expect(memoryKey('anna@example.com')).not.toBe(memoryKey('boris@example.com'));
  });

  it('has somewhere to go before sign-in', () => {
    expect(memoryKey('')).toBe('forma.club.anonymous');
  });
});

describe('clubMemory — parsing', () => {
  it('reads nothing as an empty memory', () => {
    expect(parseMemory(null)).toEqual(EMPTY_CLUB_MEMORY);
  });

  it('survives garbage and unknown fields', () => {
    expect(parseMemory('{not json')).toEqual(EMPTY_CLUB_MEMORY);
    expect(parseMemory('"a string"')).toEqual(EMPTY_CLUB_MEMORY);
    const m = parseMemory(
      JSON.stringify({
        opened: { t1: '2026-09-27', t2: 'yesterday', t3: 7 },
        board: { solo: { rank: 3, points: 22, week: 2 }, duo: { points: 'x' }, other: {} },
        milestones: [3, 'seven', 7],
        winnerWeeks: ['m:1', 4],
        future: true,
      }),
    );
    expect(m.opened).toEqual({ t1: '2026-09-27' });
    expect(m.board).toEqual({ solo: { rank: 3, points: 22, week: 2 } });
    expect(m.milestones).toEqual([3, 7]);
    expect(m.winnerWeeks).toEqual(['m:1']);
  });

  it('keeps an unranked board (rank null) as unranked', () => {
    const m = parseMemory(JSON.stringify({ board: { solo: { rank: null, points: 0, week: 1 } } }));
    expect(lastBoard(m, 'solo')).toEqual({ rank: null, points: 0, week: 1 });
  });
});

describe('clubMemory — opened tasks', () => {
  it('remembers the day a task was opened and forgets opens older than two weeks', () => {
    let m = markOpened(EMPTY_CLUB_MEMORY, 'old', '2026-09-01');
    m = markOpened(m, 'recent', '2026-09-20');
    m = markOpened(m, 'today', '2026-09-27');
    expect(isOpened(m, 'today')).toBe(true);
    expect(isOpened(m, 'recent')).toBe(true);
    // 2026-09-01 is 26 days before the last write: pruned on that write.
    expect(isOpened(m, 'old')).toBe(false);
    expect(isOpened(m, 'never')).toBe(false);
  });

  it('does not mutate what it was given', () => {
    const before = { ...EMPTY_CLUB_MEMORY, opened: {} };
    markOpened(before, 'x', '2026-09-27');
    expect(before.opened).toEqual({});
  });
});

describe('clubMemory — board, milestones, winners', () => {
  it('keeps one baseline per mode', () => {
    let m = rememberBoard(EMPTY_CLUB_MEMORY, 'solo', { rank: 4, points: 22, week: 2 });
    m = rememberBoard(m, 'duo', { rank: 1, points: 40, week: 2 });
    expect(lastBoard(m, 'solo')).toEqual({ rank: 4, points: 22, week: 2 });
    expect(lastBoard(m, 'duo')).toEqual({ rank: 1, points: 40, week: 2 });
    expect(lastBoard(EMPTY_CLUB_MEMORY, 'solo')).toBeNull();
  });

  it('celebrates a milestone once', () => {
    let m = rememberMilestone(EMPTY_CLUB_MEMORY, 7);
    expect(hasMilestone(m, 7)).toBe(true);
    expect(hasMilestone(m, 3)).toBe(false);
    m = rememberMilestone(m, 3);
    m = rememberMilestone(m, 7);
    expect(m.milestones).toEqual([3, 7]);
  });

  it('celebrates a won week once', () => {
    const key = winnerKey('m1', 2);
    let m = rememberWinner(EMPTY_CLUB_MEMORY, key);
    m = rememberWinner(m, key);
    expect(m.winnerWeeks).toEqual(['m1:2']);
    expect(hasWinner(m, key)).toBe(true);
    expect(hasWinner(m, winnerKey('m1', 3))).toBe(false);
  });
});

describe('clubMemory — storage', () => {
  it('reads what it wrote, per email, and re-reads before an update', () => {
    const map = new Map<string, string>();
    const fake = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    } as unknown as Storage;
    const g = globalThis as { localStorage?: Storage };
    const previous = g.localStorage;
    g.localStorage = fake;
    try {
      writeClubMemory('a@x.io', markOpened(EMPTY_CLUB_MEMORY, 't1', '2026-09-27'));
      expect(isOpened(readClubMemory('a@x.io'), 't1')).toBe(true);
      expect(isOpened(readClubMemory('b@x.io'), 't1')).toBe(false);
      // A second writer that never saw the first write keeps it.
      const next = updateClubMemory('a@x.io', (m) => rememberMilestone(m, 3));
      expect(isOpened(next, 't1')).toBe(true);
      expect(hasMilestone(readClubMemory('a@x.io'), 3)).toBe(true);
    } finally {
      g.localStorage = previous;
    }
  });

  it('never throws when storage is broken', () => {
    const g = globalThis as { localStorage?: Storage };
    const previous = g.localStorage;
    g.localStorage = {
      getItem: () => {
        throw new Error('quota');
      },
      setItem: () => {
        throw new Error('quota');
      },
    } as unknown as Storage;
    try {
      expect(readClubMemory('a@x.io')).toEqual(EMPTY_CLUB_MEMORY);
      expect(() => writeClubMemory('a@x.io', EMPTY_CLUB_MEMORY)).not.toThrow();
      expect(updateClubMemory('a@x.io', (m) => rememberMilestone(m, 3)).milestones).toEqual([3]);
    } finally {
      g.localStorage = previous;
    }
  });
});
