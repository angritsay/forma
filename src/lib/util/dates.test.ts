import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, weekStart } from './dates';

describe('dates', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('computes day differences', () => {
    expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7);
    expect(daysBetween('2026-01-08', '2026-01-01')).toBe(-7);
  });
  it('finds the monday of the ISO week', () => {
    expect(weekStart('2026-09-02')).toBe('2026-08-31'); // Wednesday → Monday
    expect(weekStart('2026-08-31')).toBe('2026-08-31');
    expect(weekStart('2026-09-06')).toBe('2026-08-31'); // Sunday
  });
});
