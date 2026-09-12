/**
 * The fixture below is the same one supabase/tests/40_marathon.sql scores in SQL, down to the
 * names and the numbers: two pairs, one solo player, six tasks covering all four rules, one proof
 * that arrives after the deadline and one task set only to whoever plays alone.
 *
 * It is written twice on purpose. These totals — 22, 10, 13 — are the contract between the SQL that
 * computes the real board and the TypeScript that stands in for it in demo mode; if either side
 * drifts, one of the two suites goes red.
 */
import { describe, expect, it } from 'vitest';
import {
  appliesTo,
  board,
  countsFor,
  dayIndexOf,
  deadlineFor,
  scoreTask,
  weekOf,
  type CountedProof,
  type ScorableEntry,
  type ScorableTask,
} from './score';

const task = (
  over: Partial<ScorableTask> & Pick<ScorableTask, 'id' | 'dayIndex'>,
): ScorableTask => ({
  rule: 'per_member',
  points: 0,
  cap: null,
  audience: 'all',
  ...over,
});

const ENTRIES: ScorableEntry[] = [
  { id: 'team_a', kind: 'team', memberIds: ['vanya', 'vitya'] },
  { id: 'team_b', kind: 'team', memberIds: ['olya', 'katya'] },
  { id: 'zhenya', kind: 'solo', memberIds: ['zhenya'] },
];

const TASKS: ScorableTask[] = [
  task({ id: 'zaryadka', dayIndex: 1, rule: 'all_members', points: 10 }),
  task({ id: 'shagi', dayIndex: 2, rule: 'per_member', points: 5 }),
  task({ id: 'paluba', dayIndex: 3, rule: 'capped', points: 5, cap: 7 }),
  task({ id: 'utro', dayIndex: 4, rule: 'none', points: 0 }),
  task({ id: 'odinochnaya', dayIndex: 5, rule: 'per_member', points: 3, audience: 'solo' }),
  task({ id: 'planka', dayIndex: 6, rule: 'per_member', points: 4 }),
];

/** Everything that arrived in time and was not struck out. Планка is missing: Ваня sent it late. */
const COUNTED: CountedProof[] = [
  { taskId: 'zaryadka', memberId: 'vanya' },
  { taskId: 'zaryadka', memberId: 'vitya' },
  { taskId: 'zaryadka', memberId: 'olya' },
  { taskId: 'zaryadka', memberId: 'zhenya' },
  { taskId: 'shagi', memberId: 'vanya' },
  { taskId: 'shagi', memberId: 'olya' },
  { taskId: 'shagi', memberId: 'katya' },
  { taskId: 'paluba', memberId: 'vanya' },
  { taskId: 'paluba', memberId: 'vitya' },
  { taskId: 'utro', memberId: 'vanya' },
  { taskId: 'utro', memberId: 'olya' },
  { taskId: 'odinochnaya', memberId: 'zhenya' },
  { taskId: 'odinochnaya', memberId: 'vanya' },
];

const points = (rows: ReturnType<typeof board>, id: string) =>
  rows.find((r) => r.entryId === id)?.points;

describe('the four rules', () => {
  it('all_members pays the entry only when everybody delivered', () => {
    const t = task({ id: 't', dayIndex: 1, rule: 'all_members', points: 10 });
    expect(scoreTask(t, 2, 2)).toBe(10);
    expect(scoreTask(t, 1, 2)).toBe(0);
    // A team of one is satisfied by one person — which is what lets a solo player use the same rule.
    expect(scoreTask(t, 1, 1)).toBe(10);
    expect(scoreTask(t, 0, 1)).toBe(0);
  });

  it('per_member pays everyone who delivered', () => {
    const t = task({ id: 't', dayIndex: 1, rule: 'per_member', points: 5 });
    expect(scoreTask(t, 0, 2)).toBe(0);
    expect(scoreTask(t, 2, 2)).toBe(10);
  });

  it('capped stops the entry at the ceiling', () => {
    const t = task({ id: 't', dayIndex: 1, rule: 'capped', points: 5, cap: 7 });
    expect(scoreTask(t, 1, 2)).toBe(5);
    expect(scoreTask(t, 2, 2)).toBe(7);
  });

  it('none never scores, however many people tick it', () => {
    const t = task({ id: 't', dayIndex: 1, rule: 'none', points: 99 });
    expect(scoreTask(t, 2, 2)).toBe(0);
  });
});

describe('audience', () => {
  it('sets a task to teams, to solo players, or to everyone', () => {
    expect(appliesTo('all', 'team')).toBe(true);
    expect(appliesTo('all', 'solo')).toBe(true);
    expect(appliesTo('teams', 'team')).toBe(true);
    expect(appliesTo('teams', 'solo')).toBe(false);
    expect(appliesTo('solo', 'solo')).toBe(true);
    expect(appliesTo('solo', 'team')).toBe(false);
  });
});

describe('weeks', () => {
  it('runs 1..7, 8..14 from the marathon start, not from Monday', () => {
    expect(weekOf(1)).toBe(1);
    expect(weekOf(7)).toBe(1);
    expect(weekOf(8)).toBe(2);
    expect(weekOf(14)).toBe(2);
    expect(weekOf(15)).toBe(3);
  });
});

describe('the board', () => {
  const rows = board(ENTRIES, TASKS, COUNTED, 1);

  it('scores the SQL suite to the same totals', () => {
    // 10 (both did Зарядка) + 5 (only Ваня did Шаги) + 7 (capped from 10) + 0 + 0
    expect(points(rows, 'team_a')).toBe(22);
    // 0 (only Оля did Зарядка) + 10 (both did Шаги)
    expect(points(rows, 'team_b')).toBe(10);
    // 10 (a team of one) + 3 (the solo task)
    expect(points(rows, 'zhenya')).toBe(13);
  });

  it('ranks them', () => {
    expect(rows.map((r) => r.entryId)).toEqual(['team_a', 'zhenya', 'team_b']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("leaves the solo task out of a pair's score", () => {
    // Ваня sent proof for Одиночная; his entry is a team, so the task was never his to do.
    expect(points(board(ENTRIES, TASKS, COUNTED, 1), 'team_a')).toBe(22);
  });

  it('starts every entry at zero in the next week', () => {
    expect(board(ENTRIES, TASKS, COUNTED, 2).every((r) => r.points === 0)).toBe(true);
  });

  it("adds the coach's manual points to the whole entry", () => {
    const withBonus = board(ENTRIES, TASKS, COUNTED, 1, [
      { memberId: 'katya', dayIndex: 3, points: 5 },
    ]);
    expect(points(withBonus, 'team_b')).toBe(15);
    // An adjustment dated in week 1 does not follow the entry into week 2.
    expect(
      board(ENTRIES, TASKS, COUNTED, 2, [{ memberId: 'katya', dayIndex: 3, points: 5 }]).every(
        (r) => r.points === 0,
      ),
    ).toBe(true);
  });

  it('gives tied entries the same rank', () => {
    const tied = board(
      [
        { id: 'a', kind: 'team', memberIds: ['x'] },
        { id: 'b', kind: 'team', memberIds: ['y'] },
        { id: 'c', kind: 'team', memberIds: ['z'] },
      ],
      [task({ id: 't', dayIndex: 1, rule: 'per_member', points: 5 })],
      [
        { taskId: 't', memberId: 'x' },
        { taskId: 't', memberId: 'y' },
      ],
      1,
    );
    expect(tied.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it('never lets a penalty push an entry below zero', () => {
    const punished = board(ENTRIES, TASKS, COUNTED, 1, [
      { memberId: 'olya', dayIndex: 2, points: -1000 },
    ]);
    expect(points(punished, 'team_b')).toBe(0);
  });
});

describe('deadlines', () => {
  // The marathon runs on Moscow time: the day closes at 22:00 there for everyone, wherever they are.
  const deadline = deadlineFor('2026-09-01', 3, '22:00', 'Europe/Moscow');

  it("closes the day at the marathon's own clock", () => {
    // 2026-09-03 22:00 +03:00 is 19:00 UTC.
    expect(deadline.toISOString()).toBe('2026-09-03T19:00:00.000Z');
  });

  it('counts proof sent before it and drops proof sent after', () => {
    const inTime = { submittedAt: '2026-09-03T18:59:00.000Z', voidedAt: null };
    const late = { submittedAt: '2026-09-03T19:01:00.000Z', voidedAt: null };
    expect(countsFor(inTime, deadline, false)).toBe(true);
    expect(countsFor(late, deadline, false)).toBe(false);
    // …unless the task says lateness is forgiven.
    expect(countsFor(late, deadline, true)).toBe(true);
  });

  it('drops a voided proof however early it arrived', () => {
    const struck = {
      submittedAt: '2026-09-03T06:00:00.000Z',
      voidedAt: '2026-09-04T09:00:00.000Z',
    };
    expect(countsFor(struck, deadline, false)).toBe(false);
    expect(countsFor(struck, deadline, true)).toBe(false);
  });

  it('survives a daylight-saving change in a zone that has one', () => {
    // Lisbon is UTC+1 in August and UTC+0 in November.
    expect(deadlineFor('2026-08-01', 1, '22:00', 'Europe/Lisbon').toISOString()).toBe(
      '2026-08-01T21:00:00.000Z',
    );
    expect(deadlineFor('2026-11-01', 1, '22:00', 'Europe/Lisbon').toISOString()).toBe(
      '2026-11-01T22:00:00.000Z',
    );
  });
});

describe('which day it is', () => {
  it("counts from the marathon start in the marathon's zone", () => {
    const at = (iso: string) => dayIndexOf('2026-09-01', 'Europe/Moscow', new Date(iso));
    expect(at('2026-09-01T10:00:00Z')).toBe(1);
    expect(at('2026-09-09T10:00:00Z')).toBe(9);
    // 23:30 UTC on the 8th is already the 9th in Moscow — the marathon has moved on.
    expect(at('2026-09-08T21:30:00Z')).toBe(9);
  });

  it('is 0 before it starts', () => {
    expect(dayIndexOf('2026-09-01', 'Europe/Moscow', new Date('2026-08-30T10:00:00Z'))).toBe(0);
  });
});
