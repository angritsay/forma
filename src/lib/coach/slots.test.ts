import { describe, expect, it } from 'vitest';
import {
  addDaysIso,
  canSelfMove,
  clockIn,
  dateIn,
  dateStrip,
  firstOpenDay,
  generateSlots,
  holdClock,
  isoWeekday,
  joinOpen,
  parseClock,
  rangeProblems,
  rulesToWeek,
  slotsByDay,
  wallToInstant,
  weekToRules,
  zoneLabel,
  type SlotQuery,
} from './slots';

const MSK = 'Europe/Moscow';
/** Monday 5 Oct 2026, 06:00 UTC = 09:00 in Moscow. */
const NOW = Date.parse('2026-10-05T06:00:00Z');

function query(patch: Partial<SlotQuery> = {}): SlotQuery {
  return {
    rules: [{ weekday: 1, start: '10:00', end: '12:00' }],
    exceptions: [],
    busy: [],
    minutes: 30,
    from: NOW,
    to: NOW + 86_400_000,
    now: NOW,
    timeZone: MSK,
    leadMinutes: 15,
    ...patch,
  };
}

const starts = (q: SlotQuery) => generateSlots(q).map((s) => clockIn(s.startsAt, MSK));

describe('clocks and zones', () => {
  it('reads HH:MM and the seconds Postgres prints, and nothing else', () => {
    expect(parseClock('10:30')).toBe(630);
    expect(parseClock('10:30:00')).toBe(630);
    expect(parseClock('24:00')).toBeNull();
    expect(parseClock('9:00')).toBeNull();
    expect(parseClock('')).toBeNull();
  });

  it('turns a Moscow wall clock into the instant it names', () => {
    expect(new Date(wallToInstant('2026-10-05', 600, MSK)).toISOString()).toBe(
      '2026-10-05T07:00:00.000Z',
    );
  });

  it('survives a zone that changes its clock (London, 25 Oct 2026)', () => {
    // 10:00 in London is 09:00 UTC before the change and 10:00 UTC after it.
    expect(new Date(wallToInstant('2026-10-24', 600, 'Europe/London')).toISOString()).toBe(
      '2026-10-24T09:00:00.000Z',
    );
    expect(new Date(wallToInstant('2026-10-26', 600, 'Europe/London')).toISOString()).toBe(
      '2026-10-26T10:00:00.000Z',
    );
  });

  it('labels a time in the viewer zone, h23', () => {
    expect(clockIn('2026-10-05T07:00:00Z', MSK)).toBe('10:00');
    expect(clockIn('2026-10-05T07:00:00Z', 'Asia/Yekaterinburg')).toBe('12:00');
    expect(clockIn('garbage', MSK)).toBe('');
  });

  it('does calendar arithmetic without a zone', () => {
    expect(addDaysIso('2026-10-31', 1)).toBe('2026-11-01');
    expect(isoWeekday('2026-10-05')).toBe(1);
    expect(isoWeekday('2026-10-11')).toBe(7);
    expect(dateIn(Date.parse('2026-10-05T22:30:00Z'), MSK)).toBe('2026-10-06');
  });

  it('names a zone when the browser can, and never throws', () => {
    expect(zoneLabel('UTC', NOW, 'en')).not.toBe('');
    expect(zoneLabel('Not/AZone', NOW, 'en')).toBe('');
  });
});

describe('generateSlots — the rule booking_slots applies', () => {
  it('cuts a window into 30-minute starts on the grid', () => {
    expect(starts(query())).toEqual(['10:00', '10:30', '11:00', '11:30']);
  });

  it('needs two free cells for an hour', () => {
    expect(starts(query({ minutes: 60 }))).toEqual(['10:00', '10:30', '11:00']);
  });

  it('snaps a window that starts off the grid to the next half hour', () => {
    const rules = [{ weekday: 1, start: '10:15', end: '12:00' }];
    expect(starts(query({ rules }))).toEqual(['10:30', '11:00', '11:30']);
  });

  it('joins touching windows into one run', () => {
    const rules = [
      { weekday: 1, start: '10:00', end: '11:00' },
      { weekday: 1, start: '11:00', end: '12:00' },
    ];
    expect(starts(query({ rules, minutes: 60 }))).toEqual(['10:00', '10:30', '11:00']);
  });

  it('keeps the lead time', () => {
    // 09:50 in Moscow: 10:00 is ten minutes away, under the fifteen.
    const now = Date.parse('2026-10-05T06:50:00Z');
    expect(starts(query({ now, from: now }))).toEqual(['10:30', '11:00', '11:30']);
  });

  it('applies a day off, an hour off and an extra window', () => {
    expect(
      starts(query({ exceptions: [{ date: '2026-10-05', start: null, end: null, kind: 'off' }] })),
    ).toEqual([]);
    expect(
      starts(
        query({ exceptions: [{ date: '2026-10-05', start: '10:30', end: '11:00', kind: 'off' }] }),
      ),
    ).toEqual(['10:00', '11:00', '11:30']);
    expect(
      starts(
        query({
          exceptions: [
            { date: '2026-10-05', start: null, end: null, kind: 'off' },
            { date: '2026-10-05', start: '18:00', end: '19:00', kind: 'extra' },
          ],
        }),
      ),
    ).toEqual(['18:00', '18:30']);
  });

  it('removes what is busy, and an hour cannot straddle it', () => {
    const busy = [{ startsAt: '2026-10-05T07:30:00Z', endsAt: '2026-10-05T08:00:00Z' }];
    expect(starts(query({ busy }))).toEqual(['10:00', '11:00', '11:30']);
    expect(starts(query({ busy, minutes: 60 }))).toEqual(['11:00']);
  });

  it('stops at the horizon and at the end of the range', () => {
    expect(generateSlots(query({ horizonDays: 0 }))).toEqual([]);
    expect(generateSlots(query({ to: NOW }))).toEqual([]);
  });

  it('refuses a length off the grid', () => {
    expect(generateSlots(query({ minutes: 45 }))).toEqual([]);
  });
});

describe('the picker', () => {
  const slots = [
    { startsAt: '2026-10-05T07:00:00Z', endsAt: '2026-10-05T07:30:00Z' },
    { startsAt: '2026-10-07T15:00:00Z', endsAt: '2026-10-07T15:30:00Z' },
    { startsAt: '2026-10-07T14:00:00Z', endsAt: '2026-10-07T14:30:00Z' },
  ];

  it('draws fourteen days, free or not, from today in the viewer zone', () => {
    const strip = dateStrip(slots, NOW, MSK);
    expect(strip).toHaveLength(14);
    expect(strip[0]).toEqual({ date: '2026-10-05', day: 5, weekday: 1, count: 1 });
    expect(strip[1]?.count).toBe(0);
    expect(strip[2]?.count).toBe(2);
    expect(strip[13]?.date).toBe('2026-10-18');
  });

  it('groups by the viewer day and sorts each day', () => {
    const grouped = slotsByDay(slots, MSK);
    expect(grouped.get('2026-10-07')?.map((s) => clockIn(s.startsAt, MSK))).toEqual([
      '17:00',
      '18:00',
    ]);
    // 23:30 UTC is already tomorrow in Moscow.
    const late = [{ startsAt: '2026-10-05T21:30:00Z', endsAt: '2026-10-05T22:00:00Z' }];
    expect([...slotsByDay(late, MSK).keys()]).toEqual(['2026-10-06']);
    expect([...slotsByDay(late, 'UTC').keys()]).toEqual(['2026-10-05']);
  });

  it('opens on the picked day while it has slots, else the first that does', () => {
    const strip = dateStrip(slots, NOW, MSK);
    expect(firstOpenDay(strip, '2026-10-07')).toBe('2026-10-07');
    expect(firstOpenDay(strip, '2026-10-06')).toBe('2026-10-05');
    expect(firstOpenDay(dateStrip([], NOW, MSK))).toBeNull();
  });
});

describe('the hold', () => {
  it('counts down in minutes and seconds', () => {
    const until = new Date(NOW + 19 * 60_000 + 42_000).toISOString();
    expect(holdClock(until, NOW)).toEqual({ expired: false, seconds: 1182, left: '19:42' });
  });

  it('is over at its expiry, and an unreadable expiry is over too', () => {
    expect(holdClock(new Date(NOW).toISOString(), NOW).expired).toBe(true);
    expect(holdClock('later', NOW)).toEqual({ expired: true, seconds: 0, left: '0:00' });
  });
});

describe('the booked session', () => {
  const start = '2026-10-06T07:00:00Z';
  const end = '2026-10-06T08:00:00Z';

  it('opens the room fifteen minutes before and until the end', () => {
    expect(joinOpen(start, end, Date.parse('2026-10-06T06:44:00Z'))).toBe(false);
    expect(joinOpen(start, end, Date.parse('2026-10-06T06:45:00Z'))).toBe(true);
    expect(joinOpen(start, end, Date.parse('2026-10-06T07:59:00Z'))).toBe(true);
    expect(joinOpen(start, end, Date.parse('2026-10-06T08:00:00Z'))).toBe(false);
  });

  it('lets the client move it only 24 hours or more ahead', () => {
    expect(canSelfMove(start, Date.parse('2026-10-05T07:00:00Z'))).toBe(true);
    expect(canSelfMove(start, Date.parse('2026-10-05T07:00:01Z'))).toBe(false);
    expect(canSelfMove('soon', NOW)).toBe(false);
  });
});

describe('the admin week', () => {
  it('flags bad format, reversed and overlapping ranges, and allows touching ones', () => {
    const problems = rangeProblems([
      { start: '10:00', end: '12:00' },
      { start: '12:00', end: '14:00' },
      { start: '13:00', end: '15:00' },
      { start: '9', end: '10:00' },
      { start: '18:00', end: '17:00' },
    ]);
    expect(problems.get(0)).toBeUndefined();
    expect(problems.get(1)).toBe('overlap');
    expect(problems.get(2)).toBe('overlap');
    expect(problems.get(3)).toBe('format');
    expect(problems.get(4)).toBe('order');
  });

  it('round-trips the week through the rules the server takes', () => {
    const week = rulesToWeek([
      { weekday: 3, start: '18:00:00', end: '20:00:00' },
      { weekday: 3, start: '10:00:00', end: '12:00:00' },
      { weekday: 9, start: '10:00', end: '11:00' },
    ]);
    expect(week.get(1)).toEqual([]);
    expect(week.get(3)).toEqual([
      { start: '10:00', end: '12:00' },
      { start: '18:00', end: '20:00' },
    ]);
    expect(weekToRules(week)).toEqual([
      { weekday: 3, start: '10:00', end: '12:00' },
      { weekday: 3, start: '18:00', end: '20:00' },
    ]);
  });
});
