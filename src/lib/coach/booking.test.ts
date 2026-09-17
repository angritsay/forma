import { describe, expect, it } from 'vitest';
import {
  describeCountdown,
  durationMinutes,
  isUpcoming,
  pickUpcoming,
  type BookingTimes,
} from './booking';

/** A booking, described by where it sits relative to `NOW`. */
const NOW = Date.parse('2026-03-10T12:00:00Z');

function at(iso: string, minutes = 60, status: 'active' | 'cancelled' = 'active'): BookingTimes {
  const starts = Date.parse(iso);
  return {
    startsAt: new Date(starts).toISOString(),
    endsAt: new Date(starts + minutes * 60_000).toISOString(),
    status,
  };
}

describe('isUpcoming', () => {
  it('keeps a session that has not ended, including one in progress', () => {
    expect(isUpcoming(at('2026-03-10T15:00:00Z'), NOW)).toBe(true);
    // Started twenty minutes ago, runs for an hour: this is when the join link matters most.
    expect(isUpcoming(at('2026-03-10T11:40:00Z'), NOW)).toBe(true);
  });

  it('drops a session that is over, and never shows a cancelled one', () => {
    expect(isUpcoming(at('2026-03-10T10:00:00Z', 30), NOW)).toBe(false);
    expect(isUpcoming(at('2026-03-10T15:00:00Z', 60, 'cancelled'), NOW)).toBe(false);
  });

  it('treats the end instant as over, not as still running', () => {
    expect(isUpcoming(at('2026-03-10T11:00:00Z', 60), NOW)).toBe(false);
  });

  it('refuses unparseable times rather than guessing', () => {
    expect(isUpcoming({ startsAt: 'soon', endsAt: 'later', status: 'active' }, NOW)).toBe(false);
  });
});

describe('pickUpcoming', () => {
  it('takes the soonest session still worth showing, whatever order they arrive in', () => {
    const later = at('2026-03-12T09:00:00Z');
    const soon = at('2026-03-10T18:00:00Z');
    const done = at('2026-03-09T09:00:00Z');
    expect(pickUpcoming([later, done, soon], NOW)).toBe(soon);
  });

  it('prefers a session in progress over one later today', () => {
    const running = at('2026-03-10T11:40:00Z');
    const evening = at('2026-03-10T19:00:00Z');
    expect(pickUpcoming([evening, running], NOW)).toBe(running);
  });

  it('skips a cancelled session even when it is the soonest', () => {
    const cancelled = at('2026-03-10T13:00:00Z', 60, 'cancelled');
    const real = at('2026-03-11T13:00:00Z');
    expect(pickUpcoming([cancelled, real], NOW)).toBe(real);
  });

  it('is null when there is nothing left', () => {
    expect(pickUpcoming([], NOW)).toBeNull();
    expect(pickUpcoming([at('2026-03-01T09:00:00Z')], NOW)).toBeNull();
  });
});

describe('durationMinutes', () => {
  it('reads the two lengths the coach offers', () => {
    expect(durationMinutes('2026-03-10T09:00:00Z', '2026-03-10T09:30:00Z')).toBe(30);
    expect(durationMinutes('2026-03-10T09:00:00Z', '2026-03-10T10:00:00Z')).toBe(60);
  });

  it('is 0 rather than negative or NaN when the times make no sense', () => {
    expect(durationMinutes('2026-03-10T10:00:00Z', '2026-03-10T09:00:00Z')).toBe(0);
    expect(durationMinutes('nope', '2026-03-10T09:00:00Z')).toBe(0);
  });
});

describe('describeCountdown — what has already happened', () => {
  const zone = 'Europe/Moscow'; // UTC+3, no DST

  it('is past once the session has ended, and live while it runs', () => {
    expect(describeCountdown(...span('2026-03-10T09:00:00Z', 60), NOW, zone)).toEqual({
      kind: 'past',
    });
    expect(describeCountdown(...span('2026-03-10T11:40:00Z', 60), NOW, zone)).toEqual({
      kind: 'live',
    });
  });

  it('flips to live exactly at the start, and to past exactly at the end', () => {
    expect(describeCountdown(...span('2026-03-10T12:00:00Z', 60), NOW, zone)).toEqual({
      kind: 'live',
    });
    expect(describeCountdown(...span('2026-03-10T11:00:00Z', 60), NOW, zone)).toEqual({
      kind: 'past',
    });
  });
});

describe('describeCountdown — under an hour', () => {
  const zone = 'Europe/Moscow';

  it('counts the minutes: forty minutes away is forty minutes, not "in an hour"', () => {
    expect(describeCountdown(...span('2026-03-10T12:40:00Z'), NOW, zone)).toEqual({
      kind: 'minutes',
      minutes: 40,
    });
  });

  it('never says "60 minutes": 59m40s is already an hour', () => {
    expect(describeCountdown(...span('2026-03-10T12:59:40Z'), NOW, zone)).toEqual({
      kind: 'hours',
      hours: 1,
    });
    expect(describeCountdown(...span('2026-03-10T12:59:00Z'), NOW, zone)).toEqual({
      kind: 'minutes',
      minutes: 59,
    });
  });

  it('is exactly an hour at the boundary, not "in 60 minutes"', () => {
    expect(describeCountdown(...span('2026-03-10T13:00:00Z'), NOW, zone)).toEqual({
      kind: 'hours',
      hours: 1,
    });
  });

  it('never counts down to zero: seconds away is still one minute', () => {
    expect(describeCountdown(...span('2026-03-10T12:00:20Z'), NOW, zone)).toEqual({
      kind: 'minutes',
      minutes: 1,
    });
  });

  it('stays in minutes across midnight — "in 15 minutes" beats "tomorrow"', () => {
    const lateNight = Date.parse('2026-03-10T20:55:00Z'); // 23:55 in Moscow
    expect(describeCountdown(...span('2026-03-10T21:10:00Z'), lateNight, zone)).toEqual({
      kind: 'minutes',
      minutes: 15,
    });
  });
});

describe('describeCountdown — the day boundary', () => {
  const zone = 'Europe/Moscow';

  it('says hours for a session later the same day', () => {
    // 15:00 Moscow now, 22:00 Moscow tonight.
    const now = Date.parse('2026-03-10T12:00:00Z');
    expect(describeCountdown(...span('2026-03-10T19:00:00Z'), now, zone)).toEqual({
      kind: 'hours',
      hours: 7,
    });
  });

  it('says tomorrow for tomorrow at 09:00, even though it is fourteen hours away', () => {
    // 19:00 Moscow on the 10th → 09:00 Moscow on the 11th.
    const evening = Date.parse('2026-03-10T16:00:00Z');
    expect(describeCountdown(...span('2026-03-11T06:00:00Z'), evening, zone)).toEqual({
      kind: 'tomorrow',
      hour: 9,
      minute: 0,
    });
  });

  it('says hours for a session fourteen hours away that is still today', () => {
    // 08:00 Moscow on the 10th → 22:00 Moscow on the 10th.
    const morning = Date.parse('2026-03-10T05:00:00Z');
    expect(describeCountdown(...span('2026-03-10T19:00:00Z'), morning, zone)).toEqual({
      kind: 'hours',
      hours: 14,
    });
  });

  it('says tomorrow for a session only two hours away across midnight', () => {
    // 23:30 Moscow on the 10th → 01:30 Moscow on the 11th.
    const nearMidnight = Date.parse('2026-03-10T20:30:00Z');
    expect(describeCountdown(...span('2026-03-10T22:30:00Z'), nearMidnight, zone)).toEqual({
      kind: 'tomorrow',
      hour: 1,
      minute: 30,
    });
  });

  it('counts whole calendar days further out', () => {
    const now = Date.parse('2026-03-10T16:00:00Z'); // 19:00 Moscow, the 10th
    expect(describeCountdown(...span('2026-03-13T06:30:00Z'), now, zone)).toEqual({
      kind: 'later',
      days: 3,
      hour: 9,
      minute: 30,
    });
  });
});

describe('describeCountdown — the timezone is the viewer’s', () => {
  it('the same instant is today in one zone and tomorrow in another', () => {
    // 2026-03-10 22:00 UTC. In Berlin (UTC+1) that is 23:00 the same evening; in Moscow (UTC+3)
    // it is 01:00 the next morning.
    const now = Date.parse('2026-03-10T19:00:00Z');
    const session = span('2026-03-10T22:00:00Z');
    expect(describeCountdown(...session, now, 'Europe/Berlin')).toEqual({
      kind: 'hours',
      hours: 3,
    });
    expect(describeCountdown(...session, now, 'Europe/Moscow')).toEqual({
      kind: 'tomorrow',
      hour: 1,
      minute: 0,
    });
  });

  it('falls back to the device zone instead of throwing on a nonsense zone name', () => {
    const result = describeCountdown(...span('2026-03-10T12:40:00Z'), NOW, 'Middle/Earth');
    expect(result).toEqual({ kind: 'minutes', minutes: 40 });
  });
});

describe('describeCountdown — across a DST change', () => {
  /*
   * Europe/Berlin springs forward on 2026-03-29: 02:00 becomes 03:00, so that day is 23 hours
   * long. A session "tomorrow at 09:00" seen on the evening of the 28th is 13 elapsed hours away,
   * not 14 — and must still read as «завтра в 9:00», with 9 as the wall-clock hour after the
   * change rather than the 8 an offset frozen at the old value would give.
   */
  const zone = 'Europe/Berlin';

  it('says tomorrow at the post-change wall-clock time', () => {
    const evening = Date.parse('2026-03-28T19:00:00Z'); // 20:00 Berlin, the 28th
    // 09:00 Berlin on the 29th is 07:00 UTC, because the offset is already +02:00 by then.
    expect(describeCountdown(...span('2026-03-29T07:00:00Z'), evening, zone)).toEqual({
      kind: 'tomorrow',
      hour: 9,
      minute: 0,
    });
  });

  it('does not let the short day collapse into "today"', () => {
    // 23:30 Berlin on the 28th → 03:30 Berlin on the 29th, four elapsed hours but three on the
    // clock, and unambiguously the next day.
    const nearMidnight = Date.parse('2026-03-28T22:30:00Z');
    expect(describeCountdown(...span('2026-03-29T01:30:00Z'), nearMidnight, zone)).toEqual({
      kind: 'tomorrow',
      hour: 3,
      minute: 30,
    });
  });

  it('counts calendar days, not 24-hour blocks, over the change', () => {
    // 12:00 Berlin on the 27th → 12:00 Berlin on the 30th is 71 elapsed hours, three calendar days.
    const now = Date.parse('2026-03-27T11:00:00Z');
    expect(describeCountdown(...span('2026-03-30T10:00:00Z'), now, zone)).toEqual({
      kind: 'later',
      days: 3,
      hour: 12,
      minute: 0,
    });
  });

  it('is symmetrical when the clocks go back', () => {
    // Europe/Berlin falls back on 2026-10-25: that day is 25 hours long.
    const evening = Date.parse('2026-10-24T18:00:00Z'); // 20:00 Berlin, the 24th
    // 09:00 Berlin on the 25th is 08:00 UTC, the offset having dropped to +01:00.
    expect(describeCountdown(...span('2026-10-25T08:00:00Z'), evening, zone)).toEqual({
      kind: 'tomorrow',
      hour: 9,
      minute: 0,
    });
  });
});

/** `(startsAt, endsAt)` for a session of `minutes` beginning at `iso`. */
function span(iso: string, minutes = 60): [string, string] {
  const starts = Date.parse(iso);
  return [new Date(starts).toISOString(), new Date(starts + minutes * 60_000).toISOString()];
}
