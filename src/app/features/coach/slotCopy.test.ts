import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import {
  contextTime,
  dateOf,
  dayLong,
  holdAgainMinutes,
  slotErrorKey,
  weekdayLong,
  weekdayShort,
} from './slotCopy';

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
    expect(slotErrorKey(new AppError('unknown', 'boom'))).toBe('app.bookHoldError');
    expect(slotErrorKey(new Error('boom'))).toBe('app.bookHoldError');
  });

  /* 0058: the same start again inside the window is «later», never «taken» — nobody took it. */
  it('says when the same start can be held again, with the minutes from the server', () => {
    const e = new AppError('validation', 'hold_again_later', {
      cause: { message: 'hold_again_later', code: 'P0001', details: '14', hint: null },
    });
    expect(slotErrorKey(e)).toBe('app.bookHoldAgainLater');
    expect(holdAgainMinutes(e)).toBe(14);
    expect(holdAgainMinutes(new AppError('validation', 'hold_again_later'))).toBe(1);
  });

  it('names a changed session, a dropped connection and an expired sign-in', () => {
    expect(slotErrorKey(new AppError('validation', 'not_found'))).toBe('app.bookMoveGone');
    expect(slotErrorKey(new AppError('network', 'offline'))).toBe('common.errorOffline');
    expect(slotErrorKey(new AppError('auth', 'not_signed_in'))).toBe('app.bookErrorAuth');
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

describe('contextTime', () => {
  it('names the time a message is about, in Russian and Moscow time for the coach', () => {
    const line = contextTime('checking', '2026-10-06T07:00:00Z');
    expect(line.startsWith('Оплата проверяется, бронь: ')).toBe(true);
    expect(line).toContain('10:00');
    expect(line.endsWith('МСК')).toBe(true);
    expect(contextTime('booking', 'nope')).toBe('');
  });
});
