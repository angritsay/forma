/**
 * Google Calendar → Supabase: record the sessions people booked with the coach.
 *
 * Deploy:  Actions → Supabase apply → `deploy-calendar` (deploys with --no-verify-jwt and copies
 *          the secrets below from GitHub into the project; docs/SETUP.md §7.7).
 * Secrets: GOOGLE_SYNC_TOKEN, GOOGLE_CALENDAR_ID, GOOGLE_SA_CLIENT_EMAIL, GOOGLE_SA_PRIVATE_KEY,
 *          optional GOOGLE_BOOKING_TITLE and GOOGLE_COACH_EMAILS.
 *          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.)
 * Call it: POST https://<project>.functions.supabase.co/google-calendar-sync with the header
 *          `x-sync-token: <GOOGLE_SYNC_TOKEN>`, every POLL_INTERVAL_MINUTES — that is
 *          `.github/workflows/calendar-sync.yml`, because pg_cron is not enabled in this project.
 *          Or from the app: an admin's «Синхронизировать сейчас» on «Записи» sends the signed-in
 *          JWT instead (door.ts, 0045).
 *
 * WHAT IT IS FOR
 * --------------
 * The coach's booking page is a Google Calendar appointment schedule, which is free and which has
 * no webhooks, no callbacks and no way to tell anybody that somebody booked. So this reads his
 * calendar on a schedule and writes what it finds through the two service-role functions of
 * 0014 — `apply_coach_booking()` and `cancel_coach_booking()` — into its provider-neutral table.
 * (A Calendly webhook used to write there too; it needed a paid Calendly plan, was never switched
 * on, and has been removed.) Every new row wakes the owner's «Онлайн-тренировки» topic through
 * the `coach_bookings_notify_admin` trigger of 0040. See sync.ts for how an event is judged to be a booking, and
 * 0014_coach_bookings.sql for why the address on a booking grants nothing.
 *
 * THE DOOR
 * --------
 * Two things have to be true before anything runs:
 *
 *   - either `GOOGLE_SYNC_TOKEN` is set and matches the `token` query parameter (or the
 *     `x-sync-token` header) — the schedule — or the bearer JWT belongs to an admin, which
 *     PostgREST's own `is_admin()` decides when asked with that JWT (door.ts). Any signed-in user
 *     holds a valid JWT, so validity alone is never enough; being in `admins` is. Syncs started
 *     from the app wait ADMIN_COOLDOWN_MS between each other (429 inside it).
 *   - the three Google credentials are set. Without them the function returns 503 rather than
 *     quietly succeeding with nothing to do: a sync that silently writes nothing looks identical
 *     to a sync that works and has no bookings, and the difference is a person staring at an
 *     empty screen.
 *
 * Nothing here can be used to write a booking of the caller's choosing: the only input is the
 * coach's calendar. A signed-in user cannot write to `coach_bookings` at all — the table has no
 * write policy for `authenticated`, and both functions refuse a non-service role.
 *
 * NOTHING HERE LOGS WHO. Every line says what happened and how many; the address on a booking
 * never reaches a log, and neither does the private key or the access token.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchAccessToken } from './auth.ts';
import { chooseDoor, coolingDown, CORS_HEADERS, isAdminJwt } from './door.ts';
import {
  describeTally,
  emptyTally,
  findVanished,
  POLL_INTERVAL_MINUTES,
  readEvent,
  SOURCE,
  syncWindow,
} from './sync.ts';

/** A stop so a misconfigured calendar cannot turn one poll into a thousand requests. */
const MAX_PAGES = 20;
const PAGE_SIZE = 250;

function reply(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', ...CORS_HEADERS },
  });
}

/** When this instance last ran a sync an admin asked for (door.ts, `coolingDown`). */
let lastAdminRun: number | null = null;

Deno.serve(async (req) => {
  // The app's button is a browser request with an `authorization` header: it asks first.
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return reply(405, 'method not allowed');

  const door = chooseDoor(
    Deno.env.get('GOOGLE_SYNC_TOKEN'),
    new URL(req.url).searchParams.get('token') ?? req.headers.get('x-sync-token'),
    req.headers.get('authorization'),
  );
  if (door.kind === 'refuse') {
    if (door.status === 503) {
      console.error('google-calendar-sync: GOOGLE_SYNC_TOKEN is not set; refusing to run');
    }
    return reply(door.status, door.body);
  }
  if (door.kind === 'bearer') {
    const admin = await isAdminJwt(
      door.jwt,
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      fetch,
    );
    if (!admin) return reply(403, 'not an admin');
    if (coolingDown(lastAdminRun, Date.now())) return reply(429, 'just synced');
  }

  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
  const clientEmail = Deno.env.get('GOOGLE_SA_CLIENT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_SA_PRIVATE_KEY');
  if (!calendarId || !clientEmail || !privateKey) {
    console.error(
      'google-calendar-sync: GOOGLE_CALENDAR_ID, GOOGLE_SA_CLIENT_EMAIL or GOOGLE_SA_PRIVATE_KEY is not set; refusing to run',
    );
    return reply(503, 'not configured');
  }
  if (door.kind === 'bearer') {
    // Only a sync that will really read the calendar starts the pause: a 503 can be asked again.
    lastAdminRun = Date.now();
    console.info('google-calendar-sync: started by an admin');
  }

  const options = {
    calendarId,
    titleMatch: Deno.env.get('GOOGLE_BOOKING_TITLE') ?? null,
    ownerEmails: (Deno.env.get('GOOGLE_COACH_EMAILS') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    calendarTimeZone: null as string | null,
  };

  let accessToken: string;
  try {
    accessToken = await fetchAccessToken(clientEmail, privateKey, fetch);
  } catch (error) {
    console.error(
      'google-calendar-sync: could not get an access token —',
      (error as Error).message,
    );
    return reply(502, 'google refused the credentials');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const range = syncWindow();
  const tally = emptyTally();
  /** Every booking this poll saw as still on. What is missing from it has been cancelled. */
  const seenActive = new Set<string>();
  let complete = false;
  let pageToken: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.searchParams.set('timeMin', range.timeMin);
    url.searchParams.set('timeMax', range.timeMax);
    // Instances, not the recurring parents, so every row has a real start time.
    url.searchParams.set('singleEvents', 'true');
    // A cancellation that still carries its details arrives as one of these.
    url.searchParams.set('showDeleted', 'true');
    url.searchParams.set('maxResults', String(PAGE_SIZE));
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
    if (!response.ok) {
      console.error(`google-calendar-sync: events.list answered ${response.status}`);
      return reply(502, 'could not read the calendar');
    }
    const body = (await response.json()) as {
      items?: unknown[];
      nextPageToken?: string;
      timeZone?: string;
    };
    if (typeof body.timeZone === 'string' && !options.calendarTimeZone) {
      options.calendarTimeZone = body.timeZone;
    }

    for (const item of body.items ?? []) {
      tally.scanned++;
      const change = readEvent(item, options);

      if (change.kind === 'ignore') {
        tally.ignored++;
        continue;
      }

      if (change.kind === 'cancel') {
        const { error } = await supabase.rpc('cancel_coach_booking', {
          p_external_id: change.externalId,
          p_reason: 'cancelled in google calendar',
        });
        if (error) {
          tally.failed++;
          console.error('google-calendar-sync: cancel_coach_booking failed —', error.message);
        } else {
          tally.cancelled++;
        }
        continue;
      }

      const { error } = await supabase.rpc('apply_coach_booking', {
        p_email: change.email,
        p_external_id: change.externalId,
        p_external_event_id: change.externalEventId,
        p_starts_at: change.startsAt,
        p_ends_at: change.endsAt,
        p_timezone: change.timezone,
        p_join_url: change.joinUrl,
        p_location_kind: change.locationKind,
        p_location_text: change.locationText,
        // Google has no per-invitee cancel or reschedule url in its API; the booker's own links
        // live in the invitation mail. Left null rather than filled with the organiser's htmlLink,
        // which would send the client to the coach's calendar.
        p_cancel_url: null,
        p_reschedule_url: null,
        p_event_name: change.eventName,
        // A Google reschedule moves the same event, so the same external id arrives with new
        // times and `apply_coach_booking()` updates the row it already has.
        p_previous_external_id: null,
        p_source: SOURCE,
      });
      if (error) {
        tally.failed++;
        console.error('google-calendar-sync: apply_coach_booking failed —', error.message);
        continue;
      }
      tally.booked++;
      seenActive.add(change.externalId);
    }

    pageToken = body.nextPageToken ?? null;
    if (!pageToken) {
      complete = true;
      break;
    }
  }

  /*
   * Only now, and only when the whole window was read and every write succeeded. A booking that is
   * missing because a page failed, not because it was cancelled, would be cancelled here for good:
   * `apply_coach_booking()` never brings a cancelled row back.
   */
  if (complete && tally.failed === 0) {
    const { data, error } = await supabase
      .from('coach_bookings')
      .select('external_id')
      .eq('source', SOURCE)
      .eq('status', 'active')
      .gt('ends_at', range.timeMin)
      .lt('starts_at', range.timeMax);
    if (error) {
      console.error('google-calendar-sync: could not list known bookings —', error.message);
    } else {
      for (const externalId of findVanished(data ?? [], seenActive)) {
        const { error: cancelError } = await supabase.rpc('cancel_coach_booking', {
          p_external_id: externalId,
          p_reason: 'no longer on the calendar',
        });
        if (cancelError) {
          tally.failed++;
          console.error('google-calendar-sync: cancel_coach_booking failed —', cancelError.message);
        } else {
          tally.vanished++;
        }
      }
    }
  } else if (!complete) {
    console.warn(`google-calendar-sync: stopped after ${MAX_PAGES} pages; skipped reconciliation`);
  }

  const line = `${describeTally(tally)} interval=${POLL_INTERVAL_MINUTES}m`;
  console.info(`google-calendar-sync: ${line}`);
  return reply(tally.failed > 0 ? 500 : 200, line);
});
