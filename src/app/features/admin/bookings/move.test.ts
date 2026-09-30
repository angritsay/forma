import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import { isGone, planMove } from './move';

// Monday 5 Oct 2026, 10:00–10:30 Moscow (07:00 UTC). Moscow has no daylight saving.
const booking = { startsAt: '2026-10-05T07:00:00Z', endsAt: '2026-10-05T07:30:00Z' };
const hours = {
  rules: [{ weekday: 1, start: '09:00', end: '13:00' }],
  exceptions: [],
  timeZone: 'Europe/Moscow',
};

describe('planMove', () => {
  it('waits for a change: the same time is not a move', () => {
    const plan = planMove(booking, '2026-10-05', '10:00', 'Europe/Moscow', hours);
    expect(plan.unchanged).toBe(true);
    expect(plan.outside).toBe(false);
  });

  it('warns when the new time leaves the coach hours, and not before', () => {
    const inside = planMove(booking, '2026-10-05', '12:30', 'Europe/Moscow', hours);
    expect(inside).toMatchObject({ unchanged: false, outside: false });
    // 12:45–13:15 runs past 13:00.
    const late = planMove(booking, '2026-10-05', '12:45', 'Europe/Moscow', hours);
    expect(late.outside).toBe(true);
    // Tuesday has no hours at all.
    expect(planMove(booking, '2026-10-06', '10:00', 'Europe/Moscow', hours).outside).toBe(true);
    // Hours not read yet: no warning rather than a wrong one.
    expect(planMove(booking, '2026-10-06', '10:00', 'Europe/Moscow', null).outside).toBe(false);
  });

  it('names no start for fields that do not make one', () => {
    expect(planMove(booking, '2026-10-05', '', 'Europe/Moscow', hours).at).toBeNull();
    expect(planMove(booking, 'nope', '10:00', 'Europe/Moscow', hours).at).toBeNull();
  });
});

describe('isGone', () => {
  it('is the server saying the row changed under the admin', () => {
    expect(isGone(new AppError('validation', 'not_found'))).toBe(true);
    expect(isGone(new AppError('not_found', 'PGRST116'))).toBe(true);
    expect(isGone(new AppError('validation', 'slot_taken'))).toBe(false);
    expect(isGone(new Error('not_found'))).toBe(false);
  });
});
