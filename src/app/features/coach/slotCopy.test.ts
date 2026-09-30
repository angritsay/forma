import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import { dateOf, dayLong, slotErrorKey, weekdayLong, weekdayShort } from './slotCopy';

describe('slotErrorKey', () => {
  it('names what to do for each server code', () => {
    expect(slotErrorKey(new AppError('validation', 'slot_taken'))).toBe('app.bookHoldTaken');
    expect(slotErrorKey(new AppError('validation', 'too_late'))).toBe('app.bookMoveTooLate');
    expect(slotErrorKey(new AppError('validation', 'too_soon'))).toBe('app.bookMoveTooSoon');
    expect(slotErrorKey(new AppError('validation', 'rate_limited'))).toBe(
      'app.bookHoldRateLimited',
    );
    expect(slotErrorKey(new AppError('validation', 'coach_unavailable'))).toBe(
      'app.bookCoachUnavailable',
    );
  });

  it('falls back to «try again» for anything else', () => {
    expect(slotErrorKey(new AppError('network', 'offline'))).toBe('app.bookHoldError');
    expect(slotErrorKey(new Error('boom'))).toBe('app.bookHoldError');
  });
});

describe('dates for the picker', () => {
  it('names weekdays in both languages, Monday first', () => {
    expect(weekdayLong(1, 'en')).toBe('Monday');
    expect(weekdayLong(7, 'en')).toBe('Sunday');
    expect(weekdayLong(1, 'ru')).toBe('Понедельник');
    expect(weekdayShort('2026-10-05', 'en')).toBe('Mon');
  });

  it('writes a date whatever the runtime zone', () => {
    expect(dayLong('2026-10-05', 'en')).toContain('5 October');
    expect(dayLong('garbage', 'en')).toBe('garbage');
    expect(dateOf('2026-10-05T22:30:00Z', 'en', 'Europe/Moscow')).toContain('6 October');
    expect(dateOf('2026-10-05T22:30:00Z', 'en', 'UTC')).toContain('5 October');
  });
});
