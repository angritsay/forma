import { describe, expect, it } from 'vitest';
import { countTraining, isActiveDay } from './consistency';
import type { DayActivity } from './types';

const day = (date: string, workoutDone = true): DayActivity => ({ date, workoutDone });

/* 2026-09-14 is a Monday, so this week runs 14…20 September. */
const MONDAY = '2026-09-14';
const WEDNESDAY = '2026-09-16';

describe('isActiveDay', () => {
  it('is true only for a finished workout', () => {
    expect(isActiveDay(day(MONDAY))).toBe(true);
    expect(isActiveDay(day(MONDAY, false))).toBe(false);
  });
});

describe('countTraining', () => {
  it('counts nothing out of nothing', () => {
    expect(countTraining([], WEDNESDAY)).toEqual({
      total: 0,
      thisWeek: 0,
      bestWeek: 0,
      activeWeeks: 0,
      todayDone: false,
    });
  });

  it('merges duplicate dates, ignores unfinished days and rubbish dates', () => {
    const c = countTraining(
      [day(MONDAY), day(MONDAY), day('2026-09-15', false), day('not-a-date'), day('')],
      WEDNESDAY,
    );
    expect(c.total).toBe(1);
    expect(c.activeWeeks).toBe(1);
  });

  it('ignores the future, so a fast clock cannot invent a workout', () => {
    expect(countTraining([day('2026-09-20')], WEDNESDAY).total).toBe(0);
    expect(countTraining([day(WEDNESDAY)], WEDNESDAY).todayDone).toBe(true);
  });

  /*
   * The whole reason this module replaced the streak: gaps must not cost anything. Three workouts
   * spread over three separate months are three workouts, three active weeks, and a best week of
   * one — a streak would have called the same history «1» on the last day and «0» the day after.
   */
  it('does not punish gaps', () => {
    const scattered = countTraining([day('2026-07-06'), day('2026-08-11'), day(MONDAY)], WEDNESDAY);
    expect(scattered.total).toBe(3);
    expect(scattered.activeWeeks).toBe(3);
    expect(scattered.bestWeek).toBe(1);
    expect(scattered.thisWeek).toBe(1);
  });

  it('reads the week from Monday, not from a rolling seven days', () => {
    // Sunday the 13th is the week before; Monday the 14th opens the current one.
    const c = countTraining([day('2026-09-13'), day(MONDAY), day(WEDNESDAY)], WEDNESDAY);
    expect(c.total).toBe(3);
    expect(c.thisWeek).toBe(2);
    expect(c.activeWeeks).toBe(2);
    expect(c.bestWeek).toBe(2);
  });

  it('takes the best week from anywhere in the history', () => {
    const c = countTraining(
      [
        // Five days in one week back in July — the course's own weekly shape.
        day('2026-07-06'),
        day('2026-07-07'),
        day('2026-07-08'),
        day('2026-07-09'),
        day('2026-07-10'),
        day(MONDAY),
      ],
      WEDNESDAY,
    );
    expect(c.bestWeek).toBe(5);
    expect(c.thisWeek).toBe(1);
    expect(c.lastActiveDate).toBe(MONDAY);
  });
});
