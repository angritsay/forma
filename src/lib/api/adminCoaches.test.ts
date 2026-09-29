import { describe, expect, it } from 'vitest';
import {
  adminCoachFromDb,
  cleanRoomUrl,
  exceptionFromDb,
  exceptionToDb,
  ruleFromDb,
} from './adminCoaches';
import { holdFromDb, slotFromDb } from './coachSlots';
import { coachBookingFromDb } from './mappers';
import { isAppError } from './errors';

function codeOf(fn: () => unknown): string {
  try {
    fn();
    return 'ok';
  } catch (e) {
    return isAppError(e) ? e.message : 'unknown';
  }
}

describe('admin coaches — mappers', () => {
  it('keeps an https room link and drops anything else', () => {
    const base = {
      id: 'sergey',
      name: 'Сергей',
      name_en: 'Sergey',
      email: null,
      timezone: 'Europe/Moscow',
      active: true,
      flag: null,
    };
    expect(adminCoachFromDb({ ...base, room_url: 'https://example.com/r' }).roomUrl).toBe(
      'https://example.com/r',
    );
    expect(adminCoachFromDb({ ...base, room_url: 'javascript:alert(1)' }).roomUrl).toBeNull();
    expect(adminCoachFromDb({ ...base, room_url: null, timezone: null }).timezone).toBe(
      'Europe/Moscow',
    );
  });

  it('reads Postgres times as HH:MM and drops rows it cannot read', () => {
    expect(ruleFromDb({ weekday: 2, start_time: '10:00:00', end_time: '14:30:00' })).toEqual({
      weekday: 2,
      start: '10:00',
      end: '14:30',
    });
    expect(ruleFromDb({ weekday: 8, start_time: '10:00:00', end_time: '11:00:00' })).toBeNull();
    expect(
      exceptionFromDb({
        id: 'e1',
        date: '2026-10-10',
        start_time: null,
        end_time: null,
        kind: 'off',
        note: null,
      }),
    ).toEqual({ id: 'e1', date: '2026-10-10', start: null, end: null, kind: 'off', note: null });
  });

  it('checks an exception the way the table constraint does', () => {
    expect(
      exceptionToDb('sergey', { date: '2026-10-10', start: null, end: null, kind: 'off' }),
    ).toEqual({
      coach_id: 'sergey',
      date: '2026-10-10',
      start_time: null,
      end_time: null,
      kind: 'off',
      note: null,
    });
    const bad = (d: Parameters<typeof exceptionToDb>[1]) =>
      codeOf(() => exceptionToDb('sergey', d));
    expect(bad({ date: '2026-10-10', start: null, end: null, kind: 'extra' })).toBe(
      'invalid_times',
    );
    expect(bad({ date: '2026-10-10', start: '10:00', end: null, kind: 'off' })).toBe(
      'invalid_times',
    );
    expect(bad({ date: '2026-10-10', start: '12:00', end: '11:00', kind: 'off' })).toBe(
      'invalid_times',
    );
    expect(bad({ date: '10.10.2026', start: null, end: null, kind: 'off' })).toBe('invalid_date');
  });

  it('accepts only an https room link, and empty to clear it', () => {
    expect(cleanRoomUrl('  https://telemost.yandex.ru/j/1 ')).toBe(
      'https://telemost.yandex.ru/j/1',
    );
    expect(cleanRoomUrl('')).toBe('');
    expect(codeOf(() => cleanRoomUrl('http://example.com'))).toBe('invalid_room_url');
    expect(codeOf(() => cleanRoomUrl('https://a b'))).toBe('invalid_room_url');
  });
});

describe('client slots — mappers', () => {
  it('reads a hold from a table function answer, and nothing from an empty one', () => {
    const row = {
      id: 'h1',
      coach_id: 'sergey',
      option_id: 'hour',
      starts_at: '2026-10-06T07:00:00Z',
      ends_at: '2026-10-06T08:00:00Z',
      hold_expires_at: '2026-10-05T07:20:00Z',
    };
    expect(holdFromDb([row])).toEqual({
      id: 'h1',
      coachId: 'sergey',
      optionId: 'hour',
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      holdExpiresAt: row.hold_expires_at,
    });
    expect(holdFromDb([])).toBeNull();
    expect(holdFromDb(null)).toBeNull();
    expect(holdFromDb([{ ...row, option_id: 'day' }])).toBeNull();
    expect(slotFromDb({ starts_at: 'a', ends_at: 'b' })).toEqual({ startsAt: 'a', endsAt: 'b' });
  });

  it('carries the coach and the length of a session, and none for a Google row', () => {
    const base = {
      id: 'b1',
      starts_at: '2026-10-06T07:00:00Z',
      ends_at: '2026-10-06T08:00:00Z',
      timezone: null,
      join_url: null,
      location_kind: null,
      location_text: null,
      cancel_url: null,
      reschedule_url: null,
      status: 'active',
      event_name: null,
    };
    expect(coachBookingFromDb({ ...base, coach_id: 'nastia', option_id: 'half' })).toMatchObject({
      coachId: 'nastia',
      optionId: 'half',
    });
    expect(coachBookingFromDb(base)).toMatchObject({ coachId: null, optionId: null });
  });
});
