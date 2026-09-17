/**
 * What the app has to know about a booked session, as arithmetic rather than as copy.
 *
 * Two questions, both easy to get subtly wrong:
 *
 * 1. Which booking to show. "Upcoming" is not "starts in the future" — a session that started
 *    twenty minutes ago and runs for an hour is the one the person wants the join link for, and a
 *    cancelled session is never it.
 *
 * 2. How far away it is. The naive answer is elapsed hours, and it is wrong the moment a day
 *    boundary is involved: a session tomorrow at 09:00 is «завтра в 9:00», not «через 14 часов»,
 *    even though fourteen hours is exactly how far away it is. People think in calendar days, so
 *    the boundary here is the calendar day *in the viewer's own timezone* — which also makes it
 *    survive a DST change, where "24 hours from now" and "tomorrow at the same time" differ by an
 *    hour and only one of them is what the person means.
 *
 * These return a shape, never a string. The Russian lives in `src/i18n`, and the screen turns
 * `{ kind: 'tomorrow', hour: 9, minute: 0 }` into «завтра в 9:00».
 *
 * TIMEZONE. The zone passed in is the device's (`Intl.DateTimeFormat().resolvedOptions().timeZone`),
 * not the one stored on the booking. Calendly records the zone the person booked *in*; the app
 * should show the zone the person is *living in* when the session starts, and for somebody who
 * booked from a laptop abroad and opens the Mini App at home those differ. The stored value is the
 * fallback for a browser that reports nothing usable.
 */

export type CoachBookingStatusLike = 'active' | 'cancelled';

export interface BookingTimes {
  startsAt: string;
  endsAt: string;
  status: CoachBookingStatusLike;
}

/**
 * Still worth showing: not cancelled, and not over yet. A session in progress counts — that is
 * exactly when the join link matters most.
 */
export function isUpcoming(booking: BookingTimes, now: number = Date.now()): boolean {
  if (booking.status !== 'active') return false;
  const ends = Date.parse(booking.endsAt);
  return Number.isFinite(ends) && ends > now;
}

/** The soonest session still worth showing, or null. */
export function pickUpcoming<T extends BookingTimes>(
  bookings: readonly T[],
  now: number = Date.now(),
): T | null {
  let best: T | null = null;
  let bestStart = Number.POSITIVE_INFINITY;
  for (const booking of bookings) {
    if (!isUpcoming(booking, now)) continue;
    const starts = Date.parse(booking.startsAt);
    if (!Number.isFinite(starts) || starts >= bestStart) continue;
    best = booking;
    bestStart = starts;
  }
  return best;
}

/** Whole minutes the session runs for; 0 when the times are unusable. */
export function durationMinutes(startsAt: string, endsAt: string): number {
  const a = Date.parse(startsAt);
  const b = Date.parse(endsAt);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 60_000);
}

export type Countdown =
  /** Less than an hour away. `minutes` is at least 1. */
  | { kind: 'minutes'; minutes: number }
  /** An hour or more away, still today. */
  | { kind: 'hours'; hours: number }
  /** The next calendar day, at this wall-clock time. */
  | { kind: 'tomorrow'; hour: number; minute: number }
  /** Further out: `days` whole calendar days away, at this wall-clock time. */
  | { kind: 'later'; days: number; hour: number; minute: number }
  /** Started and not finished. */
  | { kind: 'live' }
  /** Over. */
  | { kind: 'past' };

interface Civil {
  /** Days since the epoch in the given zone — the calendar day, as a comparable number. */
  day: number;
  hour: number;
  minute: number;
}

/**
 * The wall-clock reading of an instant in a zone. `Intl` is the only thing that knows when a zone
 * changed its offset, so the civil fields are read out of a formatter rather than computed from
 * the instant — that is what makes the day boundary survive DST.
 */
function civil(ms: number, timeZone: string | undefined): Civil {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-GB', { ...options, timeZone }).formatToParts(new Date(ms));
  } catch {
    // An unknown zone name must not take the screen down; the device's own zone is the fallback.
    parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(new Date(ms));
  }
  const at = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((p) => p.type === type);
    return found ? Number(found.value) : 0;
  };
  const hour = at('hour') % 24;
  return {
    day: Math.round(Date.UTC(at('year'), at('month') - 1, at('day')) / 86_400_000),
    hour,
    minute: at('minute'),
  };
}

/**
 * How to say when this session starts.
 *
 * The order of the tests is the whole design.
 *
 * Under an hour wins outright, before any calendar question is asked: a session at 00:10 seen at
 * 23:55 is «через 15 минут», and telling somebody it is «завтра» when they have a quarter of an
 * hour to get ready would be true and useless. Past that, the unit is the calendar day in the
 * viewer's zone and never elapsed hours — which is what makes a session tomorrow at 09:00 read as
 * «завтра в 9:00» rather than «через 14 часов», and what keeps it reading that way across a
 * clock change.
 */
export function describeCountdown(
  startsAt: string,
  endsAt: string,
  now: number = Date.now(),
  timeZone?: string,
): Countdown {
  const starts = Date.parse(startsAt);
  const ends = Date.parse(endsAt);
  if (!Number.isFinite(starts) || !Number.isFinite(ends)) return { kind: 'past' };
  if (now >= ends) return { kind: 'past' };
  if (now >= starts) return { kind: 'live' };

  /*
   * Rounding to the nearest minute, then reading 60 minutes as an hour, is what keeps the two
   * "soon" forms from ever disagreeing: 59m40s rounds to 60 and is said as «через 1 час», never
   * as «через 60 минут».
   */
  const minutes = Math.max(1, Math.round((starts - now) / 60_000));
  if (minutes < 60) return { kind: 'minutes', minutes };

  const nowCivil = civil(now, timeZone);
  const startCivil = civil(starts, timeZone);
  const days = startCivil.day - nowCivil.day;

  if (days <= 0) return { kind: 'hours', hours: Math.max(1, Math.round(minutes / 60)) };
  if (days === 1) return { kind: 'tomorrow', hour: startCivil.hour, minute: startCivil.minute };
  return { kind: 'later', days, hour: startCivil.hour, minute: startCivil.minute };
}

/** The device's timezone, or undefined when the browser will not say. */
export function deviceTimeZone(): string | undefined {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
