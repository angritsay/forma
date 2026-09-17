import { describe, expect, it } from 'vitest';
import {
  describeTally,
  emptyTally,
  EXTERNAL_ID_PREFIX,
  findVanished,
  LOOKBACK_MINUTES,
  POLL_INTERVAL_MINUTES,
  readBooker,
  readEvent,
  readJoinUrl,
  SOURCE,
  syncWindow,
  WINDOW_DAYS,
  type GoogleEvent,
  type ReadOptions,
} from './sync';

const CALENDAR = 'coach@example.com';
const OPTIONS: ReadOptions = { calendarId: CALENDAR, calendarTimeZone: 'Europe/Moscow' };

/**
 * The event a Google Calendar appointment schedule creates on the coach's calendar, with only the
 * fields this function reads spelled out. The booker is the one guest; the coach is the organiser.
 */
function booked(overrides: Partial<GoogleEvent> = {}): GoogleEvent {
  return {
    id: 'abc123def456ghi789',
    status: 'confirmed',
    summary: 'Персональная тренировка 60 минут',
    hangoutLink: 'https://meet.google.com/aaa-bbbb-ccc',
    organizer: { email: CALENDAR, self: true },
    creator: { email: 'lena@example.com' },
    attendees: [
      { email: CALENDAR, organizer: true, self: true, responseStatus: 'accepted' },
      { email: 'Lena@Example.com', responseStatus: 'accepted' },
    ],
    start: { dateTime: '2026-03-11T09:00:00+03:00', timeZone: 'Europe/Moscow' },
    end: { dateTime: '2026-03-11T10:00:00+03:00', timeZone: 'Europe/Moscow' },
    ...overrides,
  };
}

describe('readEvent — a booking', () => {
  it('turns the event into the row the table wants', () => {
    const change = readEvent(booked(), OPTIONS);
    expect(change).toEqual({
      kind: 'upsert',
      email: 'lena@example.com',
      externalId: 'gcal:abc123def456ghi789',
      externalEventId: 'gcal:abc123def456ghi789',
      startsAt: '2026-03-11T06:00:00.000Z',
      endsAt: '2026-03-11T07:00:00.000Z',
      timezone: 'Europe/Moscow',
      joinUrl: 'https://meet.google.com/aaa-bbbb-ccc',
      locationKind: 'google_conference',
      locationText: null,
      eventName: 'Персональная тренировка 60 минут',
    });
  });

  it('lowercases the address, because it is the join key', () => {
    const change = readEvent(booked({ attendees: [{ email: '  LENA@Example.COM  ' }] }), OPTIONS);
    expect(change.kind).toBe('upsert');
    expect(change.kind === 'upsert' && change.email).toBe('lena@example.com');
  });

  it('records a booking whose address matches nobody who ever signed in', () => {
    // The same rule as Calendly: the address is a join key, never an identity. Whether anybody
    // holds it is `current_email()`'s business, not this function's.
    const change = readEvent(booked({ attendees: [{ email: 'never-signed-in@example.com' }] }), {
      ...OPTIONS,
    });
    expect(change.kind).toBe('upsert');
  });

  it('falls back to the calendar timezone when the event carries none', () => {
    const change = readEvent(booked({ start: { dateTime: '2026-03-11T09:00:00+03:00' } }), OPTIONS);
    expect(change.kind === 'upsert' && change.timezone).toBe('Europe/Moscow');
  });

  it('refuses a timezone that is not an IANA name', () => {
    const change = readEvent(
      booked({
        start: { dateTime: '2026-03-11T09:00:00Z', timeZone: '../../etc' },
        end: { dateTime: '2026-03-11T10:00:00Z' },
      }),
      { ...OPTIONS, calendarTimeZone: null },
    );
    expect(change.kind).toBe('upsert');
    expect(change.kind === 'upsert' && change.timezone).toBeNull();
  });

  it('takes the Meet link from conferenceData when hangoutLink is absent', () => {
    const change = readEvent(
      booked({
        hangoutLink: null,
        conferenceData: {
          entryPoints: [
            { entryPointType: 'phone', uri: 'tel:+15551234' },
            { entryPointType: 'video', uri: 'https://meet.google.com/zzz-yyyy-xxx' },
          ],
        },
      }),
      OPTIONS,
    );
    expect(change.kind === 'upsert' && change.joinUrl).toBe('https://meet.google.com/zzz-yyyy-xxx');
  });

  it('never accepts a join link that is not https', () => {
    const change = readEvent(booked({ hangoutLink: 'javascript:alert(1)' }), OPTIONS);
    expect(change.kind === 'upsert' && change.joinUrl).toBeNull();
    expect(change.kind === 'upsert' && change.locationKind).toBeNull();
  });

  it('keeps a physical location as text rather than as a link', () => {
    const change = readEvent(booked({ hangoutLink: null, location: 'Зал на Ленина, 5' }), OPTIONS);
    expect(change.kind === 'upsert' && change.joinUrl).toBeNull();
    expect(change.kind === 'upsert' && change.locationText).toBe('Зал на Ленина, 5');
    expect(change.kind === 'upsert' && change.locationKind).toBe('physical');
  });

  it('points an instance of a recurring event at its series', () => {
    const change = readEvent(booked({ recurringEventId: 'series777' }), OPTIONS);
    expect(change.kind === 'upsert' && change.externalEventId).toBe('gcal:series777');
    expect(change.kind === 'upsert' && change.externalId).toBe('gcal:abc123def456ghi789');
  });

  it('truncates a title the column would refuse', () => {
    const change = readEvent(booked({ summary: 'т'.repeat(400) }), OPTIONS);
    expect(change.kind === 'upsert' && change.eventName?.length).toBe(200);
  });
});

describe('readEvent — what is not a booking', () => {
  const ignored = (event: Partial<GoogleEvent>, options: ReadOptions = OPTIONS) =>
    readEvent(booked(event), options);

  it('ignores an event the coach is alone at', () => {
    expect(ignored({ attendees: [] }).kind).toBe('ignore');
    expect(ignored({ attendees: null }).kind).toBe('ignore');
  });

  it('ignores an event whose only guest is the coach himself', () => {
    expect(ignored({ attendees: [{ email: CALENDAR }] }).kind).toBe('ignore');
    expect(
      ignored(
        { attendees: [{ email: 'sergey@example.com' }] },
        {
          ...OPTIONS,
          ownerEmails: ['Sergey@Example.com'],
        },
      ).kind,
    ).toBe('ignore');
  });

  it('ignores an event with two guests: it cannot say whose session it is', () => {
    const change = ignored({
      attendees: [
        { email: CALENDAR, self: true },
        { email: 'a@example.com' },
        { email: 'b@example.com' },
      ],
    });
    expect(change).toEqual({ kind: 'ignore', why: 'event has more than one guest' });
  });

  it('ignores a meeting room', () => {
    expect(
      ignored({ attendees: [{ email: 'room@resource.calendar.google.com', resource: true }] }).kind,
    ).toBe('ignore');
  });

  it('ignores an all-day event', () => {
    expect(ignored({ start: { date: '2026-03-11' }, end: { date: '2026-03-12' } }).kind).toBe(
      'ignore',
    );
  });

  it('ignores an event that ends before it starts', () => {
    expect(
      ignored({
        start: { dateTime: '2026-03-11T10:00:00Z' },
        end: { dateTime: '2026-03-11T09:00:00Z' },
      }).kind,
    ).toBe('ignore');
  });

  it('ignores anything that is not an event at all', () => {
    expect(readEvent(null, OPTIONS).kind).toBe('ignore');
    expect(readEvent('nope', OPTIONS).kind).toBe('ignore');
    expect(readEvent({}, OPTIONS).kind).toBe('ignore');
  });

  it('ignores an id longer than the column can hold', () => {
    expect(ignored({ id: 'a'.repeat(1024) }).kind).toBe('ignore');
  });

  it('never names anybody in the reason it gives', () => {
    for (const change of [
      ignored({ attendees: [] }),
      ignored({ attendees: [{ email: 'a@example.com' }, { email: 'b@example.com' }] }),
      ignored({ start: { date: '2026-03-11' }, end: { date: '2026-03-12' } }),
    ]) {
      expect(change.kind).toBe('ignore');
      const why = change.kind === 'ignore' ? change.why : '';
      expect(why).not.toMatch(/@/);
    }
  });

  describe('the title filter', () => {
    const filtered: ReadOptions = { ...OPTIONS, titleMatch: 'тренировка' };

    it('keeps the rest of the coach’s life out of the app', () => {
      const change = readEvent(booked({ summary: 'Стоматолог' }), filtered);
      expect(change).toEqual({ kind: 'ignore', why: 'title does not match the booking filter' });
    });

    it('matches case-insensitively, so the schedule can be named however it reads best', () => {
      expect(readEvent(booked({ summary: 'ТРЕНИРОВКА 30' }), filtered).kind).toBe('upsert');
    });

    it('ignores an untitled event when a filter is set', () => {
      expect(readEvent(booked({ summary: null }), filtered).kind).toBe('ignore');
    });

    it('accepts anything shaped like a booking when no filter is set', () => {
      expect(readEvent(booked({ summary: 'Стоматолог' }), OPTIONS).kind).toBe('upsert');
    });
  });
});

describe('readEvent — a cancellation', () => {
  it('reads a cancelled event as a cancellation', () => {
    const change = readEvent(booked({ status: 'cancelled' }), OPTIONS);
    expect(change).toEqual({ kind: 'cancel', externalId: 'gcal:abc123def456ghi789', reason: null });
  });

  it('cancels on the id alone, which is all a deleted event is guaranteed to have', () => {
    // Google: "Deleted events are only guaranteed to have the id field populated."
    const change = readEvent({ id: 'abc123def456ghi789', status: 'cancelled' }, OPTIONS);
    expect(change).toEqual({ kind: 'cancel', externalId: 'gcal:abc123def456ghi789', reason: null });
  });

  it('uses the same external id the booking was written under', () => {
    const made = readEvent(booked(), OPTIONS);
    const gone = readEvent(booked({ status: 'cancelled' }), OPTIONS);
    expect(made.kind).toBe('upsert');
    expect(gone.kind).toBe('cancel');
    const madeId = made.kind === 'upsert' ? made.externalId : 'a';
    const goneId = gone.kind === 'cancel' ? gone.externalId : 'b';
    expect(goneId).toBe(madeId);
  });

  it('still needs an id to cancel anything', () => {
    expect(readEvent({ status: 'cancelled' }, OPTIONS).kind).toBe('ignore');
  });
});

describe('readBooker', () => {
  it('drops the organiser even when the attendee list does not flag them', () => {
    expect(
      readBooker(
        {
          organizer: { email: 'sergey@example.com' },
          attendees: [{ email: 'sergey@example.com' }, { email: 'lena@example.com' }],
        },
        OPTIONS,
      ),
    ).toEqual({ email: 'lena@example.com' });
  });

  it('treats the same address twice as one guest', () => {
    expect(
      readBooker(
        { attendees: [{ email: 'lena@example.com' }, { email: 'LENA@example.com' }] },
        OPTIONS,
      ),
    ).toEqual({ email: 'lena@example.com' });
  });

  it('refuses something that is not an address', () => {
    expect(readBooker({ attendees: [{ email: 'not an address' }] }, OPTIONS)).toBeNull();
  });
});

describe('readJoinUrl', () => {
  it('prefers hangoutLink', () => {
    expect(
      readJoinUrl({
        hangoutLink: 'https://meet.google.com/one',
        conferenceData: {
          entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/two' }],
        },
      }),
    ).toBe('https://meet.google.com/one');
  });

  it('is null when there is no conference at all', () => {
    expect(readJoinUrl({})).toBeNull();
    expect(
      readJoinUrl({
        conferenceData: { entryPoints: [{ entryPointType: 'more', uri: 'https://x/' }] },
      }),
    ).toBeNull();
  });
});

describe('the window', () => {
  const now = Date.parse('2026-03-11T12:00:00Z');

  it('starts a little before now and ends WINDOW_DAYS out', () => {
    const range = syncWindow(now);
    expect(Date.parse(range.timeMin)).toBe(now - LOOKBACK_MINUTES * 60_000);
    expect(Date.parse(range.timeMax)).toBe(now + WINDOW_DAYS * 86_400_000);
  });

  it('never looks at last year', () => {
    expect(Date.parse(syncWindow(now).timeMin)).toBeGreaterThan(Date.parse('2026-03-11T00:00:00Z'));
  });
});

describe('findVanished', () => {
  const known = [
    { external_id: 'gcal:one' },
    { external_id: 'gcal:two' },
    { external_id: 'gcal:three' },
  ];

  it('is the bookings we hold that the calendar no longer has', () => {
    expect(findVanished(known, new Set(['gcal:one', 'gcal:three']))).toEqual(['gcal:two']);
  });

  it('cancels nothing when the poll saw everything', () => {
    expect(findVanished(known, new Set(['gcal:one', 'gcal:two', 'gcal:three']))).toEqual([]);
  });

  it('survives a row with no id', () => {
    expect(findVanished([{ external_id: null }, { external_id: 'gcal:two' }], new Set())).toEqual([
      'gcal:two',
    ]);
  });
});

describe('the constants the owner will be asked about', () => {
  it('names a source the table accepts by shape', () => {
    expect(SOURCE).toMatch(/^[a-z][a-z0-9_]{1,39}$/);
    expect(EXTERNAL_ID_PREFIX).toBe('gcal:');
  });

  it('polls often enough that a cancellation is minutes stale, not hours', () => {
    expect(POLL_INTERVAL_MINUTES).toBeGreaterThan(0);
    expect(POLL_INTERVAL_MINUTES).toBeLessThanOrEqual(15);
  });

  it('counts without ever naming anybody', () => {
    const tally = emptyTally();
    tally.booked = 2;
    expect(describeTally(tally)).toBe(
      'scanned=0 booked=2 cancelled=0 vanished=0 ignored=0 failed=0',
    );
  });
});
