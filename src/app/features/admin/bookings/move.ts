/**
 * The admin's move form in «Записи», as arithmetic (0058): what the typed Moscow date and time
 * mean, whether they change anything, and whether the new time is inside the coach's hours.
 *
 * The admin may put a session at any time the coach agreed to (`admin_move_booking`), so a time
 * outside the hours is a warning under the fields, never a refusal. A time equal to the current
 * one would send the client a «перенесено» about nothing, so the button waits for a change.
 */
import { isAppError } from '@/lib/api/errors';
import {
  bookingsOutsideHours,
  parseClock,
  wallToInstant,
  type DateException,
  type WeeklyRule,
} from '@/lib/coach/slots';

export interface MovePlan {
  /** The new start, or null when the fields do not name one. */
  at: number | null;
  /** The fields still say the session's own start. */
  unchanged: boolean;
  /** The new time is not wholly inside the coach's hours (known only once they are read). */
  outside: boolean;
}

export function planMove(
  booking: { startsAt: string; endsAt: string },
  date: string,
  time: string,
  /** The zone the fields are typed in (Moscow, as the form says). */
  timeZone: string,
  /** The coach's hours and the zone they are written in; null until they are read. */
  hours: {
    rules: readonly WeeklyRule[];
    exceptions: readonly DateException[];
    timeZone: string;
  } | null,
): MovePlan {
  const minutes = parseClock(time);
  const at = minutes === null ? Number.NaN : wallToInstant(date, minutes, timeZone);
  if (!Number.isFinite(at)) return { at: null, unchanged: false, outside: false };
  const from = Date.parse(booking.startsAt);
  const length = Date.parse(booking.endsAt) - from;
  const unchanged = at === from;
  const outside =
    hours !== null &&
    !unchanged &&
    length > 0 &&
    bookingsOutsideHours(
      [{ startsAt: new Date(at).toISOString(), endsAt: new Date(at + length).toISOString() }],
      hours.rules,
      hours.exceptions,
      hours.timeZone,
    ).length > 0;
  return { at, unchanged, outside };
}

/**
 * The row changed under the admin (0058): moved, cancelled, paid or run out since the list was
 * read. The server says `not_found`; the screen says so and reads the list again.
 */
export function isGone(e: unknown): boolean {
  return isAppError(e) && (e.code === 'not_found' || e.message === 'not_found');
}
