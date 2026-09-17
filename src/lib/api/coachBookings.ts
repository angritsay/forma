/**
 * Coach bookings: the one-to-one sessions the signed-in person has with the coach.
 *
 * Read-only from the app. Bookings are made in a scheduler — a free Google Calendar appointment
 * schedule, read by supabase/functions/google-calendar-sync/ — and written server-side with the
 * service role; `coach_bookings` has no write policy for a signed-in user, not even for their own
 * rows, so there is nothing here to write with. The view `my_coach_bookings` is already filtered
 * to the caller by
 * `current_email()` — the `status`/`starts_at` filters below are about what is worth showing, not
 * about who may see it.
 *
 * "Upcoming" is decided in TypeScript rather than in SQL on purpose: the rule (not cancelled, not
 * finished, soonest first — a session in progress still counts) is the same rule the demo backend
 * has to apply, and one tested copy in `src/lib/coach/booking.ts` is better than two.
 */
import { pickUpcoming } from '@/lib/coach/booking';
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, requireUser, unwrap } from './internal';
import { coachBookingFromDb, type DbCoachBooking } from './mappers';
import { isDemo } from './mode';
import type { CoachBooking } from './types';

const COLUMNS =
  'id, starts_at, ends_at, timezone, join_url, location_kind, location_text, cancel_url, reschedule_url, status, event_name';

/**
 * Every session this person has, soonest first — including cancelled and finished ones, so a
 * screen can show a history without asking again.
 */
export async function getMyCoachBookings(): Promise<CoachBooking[]> {
  if (isDemo()) return (await demo()).getMyCoachBookings();
  return guard(async () => {
    await requireUser();
    const rows = unwrap<DbCoachBooking[]>(
      await supabase().from('my_coach_bookings').select(COLUMNS).order('starts_at'),
    );
    return rows.map(coachBookingFromDb);
  });
}

/** The session to put on the Тренер screen: the soonest one not cancelled and not over, or null. */
export async function getMyUpcomingBooking(): Promise<CoachBooking | null> {
  if (isDemo()) return (await demo()).getMyUpcomingBooking();
  return pickUpcoming(await getMyCoachBookings());
}
