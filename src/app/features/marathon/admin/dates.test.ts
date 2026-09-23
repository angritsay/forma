import { describe, expect, it } from 'vitest';
import {
  boardWeek,
  boardWeeks,
  dateOfDay,
  dayOfDate,
  nextWinner,
  recentDays,
  repeatUntilDay,
} from './dates';

describe('dateOfDay / dayOfDate', () => {
  it('day 1 is the start date and they invert each other', () => {
    expect(dateOfDay('2026-09-01', 1)).toBe('2026-09-01');
    expect(dateOfDay('2026-09-01', 30)).toBe('2026-09-30');
    expect(dayOfDate('2026-09-01', 30, '2026-09-01')).toBe(1);
    expect(dayOfDate('2026-09-01', 30, dateOfDay('2026-09-01', 17))).toBe(17);
  });

  it('crosses a month and a DST change without drifting', () => {
    expect(dateOfDay('2026-10-20', 14)).toBe('2026-11-02');
    expect(dayOfDate('2026-10-20', 40, '2026-11-02')).toBe(14);
  });

  it('is 0 outside the run and for garbage', () => {
    expect(dayOfDate('2026-09-01', 30, '2026-08-31')).toBe(0);
    expect(dayOfDate('2026-09-01', 30, '2026-10-01')).toBe(0);
    expect(dayOfDate('2026-09-01', 30, '')).toBe(0);
  });
});

describe('recentDays', () => {
  it('is today and the thirteen days before it, newest first', () => {
    const days = recentDays(20, 30);
    expect(days).toHaveLength(14);
    expect(days[0]).toBe(20);
    expect(days.at(-1)).toBe(7);
  });

  it('stops at day 1 early in the round', () => {
    expect(recentDays(3, 30)).toEqual([3, 2, 1]);
  });

  it('is empty before the start and caps at the last day after the end', () => {
    expect(recentDays(0, 30)).toEqual([]);
    expect(recentDays(45, 30)[0]).toBe(30);
  });
});

describe('repeatUntilDay', () => {
  it('turns a date into the last day to repeat to', () => {
    expect(repeatUntilDay('2026-09-01', 30, 5, '2026-09-10')).toBe(10);
  });

  it('is null for no date, a date on or before the task, or an invalid date', () => {
    expect(repeatUntilDay('2026-09-01', 30, 5, '')).toBeNull();
    expect(repeatUntilDay('2026-09-01', 30, 5, '2026-09-05')).toBeNull();
    expect(repeatUntilDay('2026-09-01', 30, 5, '2026-08-20')).toBeNull();
    expect(repeatUntilDay('2026-09-01', 30, 5, 'nope')).toBeNull();
  });

  it('stops at the end of the round', () => {
    expect(repeatUntilDay('2026-09-01', 30, 5, '2026-12-31')).toBe(30);
  });
});

describe('board week selection', () => {
  it('opens on the running week', () => {
    expect(boardWeek(1, 28)).toBe(1);
    expect(boardWeek(8, 28)).toBe(2);
    expect(boardWeek(28, 28)).toBe(4);
  });

  it('is week 1 before the start and the last week after the end', () => {
    expect(boardWeek(0, 28)).toBe(1);
    expect(boardWeek(60, 28)).toBe(4);
  });

  it('lists every week so far, newest first', () => {
    expect(boardWeeks(15, 28)).toEqual([3, 2, 1]);
    expect(boardWeeks(0, 28)).toEqual([1]);
  });

  it('pressing the announced row withdraws it, any other row announces', () => {
    expect(nextWinner(null, 'a')).toBe('a');
    expect(nextWinner('a', 'b')).toBe('b');
    expect(nextWinner('a', 'a')).toBeNull();
  });
});
