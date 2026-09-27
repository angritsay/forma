import { describe, expect, it } from 'vitest';
import { MILESTONES, nextMilestone, reachedMilestone, reachedMilestones } from './clubMilestones';

describe('clubMilestones', () => {
  it('names the five landmarks in order', () => {
    expect(MILESTONES).toEqual([3, 7, 14, 30, 100]);
  });

  it('points at the next landmark, and at nothing past the last', () => {
    expect(nextMilestone(0)).toBe(3);
    expect(nextMilestone(2)).toBe(3);
    expect(nextMilestone(3)).toBe(7);
    expect(nextMilestone(29)).toBe(30);
    expect(nextMilestone(100)).toBeNull();
    expect(nextMilestone(250)).toBeNull();
  });

  it('celebrates the day the streak lands on a landmark, and only that day', () => {
    expect(reachedMilestone(2, 3)).toBe(3);
    expect(reachedMilestone(6, 7)).toBe(7);
    expect(reachedMilestone(3, 4)).toBeNull();
    expect(reachedMilestone(7, 7)).toBeNull();
    // A broken streak counts down, and that is never a landmark.
    expect(reachedMilestone(9, 1)).toBeNull();
  });

  it('returns the highest landmark when several are crossed at once', () => {
    expect(reachedMilestone(0, 7)).toBe(7);
    expect(reachedMilestone(0, 2)).toBeNull();
  });

  it('lists the landmarks already behind a streak', () => {
    expect(reachedMilestones(0)).toEqual([]);
    expect(reachedMilestones(3)).toEqual([3]);
    expect(reachedMilestones(15)).toEqual([3, 7, 14]);
  });
});
