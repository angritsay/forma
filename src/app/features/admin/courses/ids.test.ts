import { describe, expect, it } from 'vitest';
import { COURSE_ID_RE, NODE_ID_RE, nextDaySlot, nodeIdFor } from './ids';

describe('id rules', () => {
  it('match the check constraints in the migrations', () => {
    for (const ok of ['yoga', 'yoga_start', 'a1', 'w1d1']) {
      expect(COURSE_ID_RE.test(ok), ok).toBe(true);
      expect(NODE_ID_RE.test(ok), ok).toBe(true);
    }
    for (const bad of ['a', 'Yoga', 'yoga-start', 'йога', 'yoga start', 'x'.repeat(41)]) {
      expect(COURSE_ID_RE.test(bad), bad).toBe(false);
    }
  });

  it('builds a node id that reads in order', () => {
    expect(nodeIdFor(1, 1)).toBe('w1d1');
    expect(nodeIdFor(12, 7)).toBe('w12d7');
    expect(NODE_ID_RE.test(nodeIdFor(16, 7))).toBe(true);
  });
});

describe('nextDaySlot', () => {
  it('starts a new course at week 1, day 1', () => {
    expect(nextDaySlot([])).toEqual({ week: 1, day: 1 });
  });

  it('takes the next day of the same week', () => {
    expect(nextDaySlot([{ week: 1, day: 1 }])).toEqual({ week: 1, day: 2 });
    expect(nextDaySlot([{ week: 2, day: 5 }])).toEqual({ week: 2, day: 6 });
  });

  it('rolls into the next week after day 7', () => {
    expect(nextDaySlot([{ week: 1, day: 7 }])).toEqual({ week: 2, day: 1 });
    expect(nextDaySlot([{ week: 15, day: 7 }])).toEqual({ week: 16, day: 1 });
  });

  it('reads the latest slot, not the last element', () => {
    // The coach can renumber a day by hand, so the list is not necessarily sorted. Taking the last
    // element would return a slot that is already taken, and the unique (course_id, week, day)
    // would reject the insert.
    const days = [
      { week: 1, day: 1 },
      { week: 2, day: 3 },
      { week: 1, day: 2 },
    ];
    expect(nextDaySlot(days)).toEqual({ week: 2, day: 4 });
  });
});
