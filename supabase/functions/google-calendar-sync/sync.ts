/**
 * Google Calendar → `coach_bookings`: reading the coach's calendar and deciding what each event
 * means. Runtime-neutral (no Deno, no fetch) so the same code runs in the Edge Function and in the
 * Node test suite; `index.ts` does the network and the database, this file does the thinking.
 *
 * WHY POLLING, AND WHY A TIME WINDOW
 * ----------------------------------
 * Google has push notifications, but a channel needs a verified HTTPS domain registered in the
 * Cloud project and has to be renewed every few days or it silently stops. A scheduled poll has
 * neither of those failure modes, and costs one API call every few minutes. The price is staleness:
 * a session cancelled just after a poll is still shown for up to `POLL_INTERVAL_MINUTES` — see the
 * constant.
 *
 * Google's own incremental sync (`syncToken`) is not usable here, and not for a small reason: the
 * API refuses `syncToken` together with `timeMin`/`timeMax` (Calendar API v3 discovery document,
 * revision 20260826: "There are several query parameters that cannot be specified together with
 * nextSyncToken … timeMin, timeMax"). A sync token therefore means ingesting the coach's entire
 * calendar history, and it expires with a 410 that forces a full resync anyway. A forward-looking
 * window is both smaller and honest: there is no reason for this app to know about last year.
 *
 * HOW A CANCELLATION ARRIVES
 * --------------------------
 * Two ways, and both are handled:
 *
 *  1. `status: 'cancelled'`. The list returns those only when `showDeleted=true` (or on an
 *     incremental sync), so the poll asks for them. On the organiser's own calendar — which is what
 *     the coach's calendar is for a booking made against his appointment schedule — a cancelled
 *     event keeps its details, so it still falls inside the time window and still carries its id.
 *
 *  2. It simply stops being there. Google's documentation says cancelled events "will eventually
 *     disappear", and a deleted event is "only guaranteed to have the id field populated" — an
 *     event with no start time cannot match a `timeMin`/`timeMax` query at all. So after a poll that
 *     listed the whole window successfully, anything we hold as active inside that window and did
 *     not see is cancelled too: `findVanished()`.
 *
 * The second rule is only safe when the listing completed. A half-read window would cancel every
 * booking in the unread part, and `apply_coach_booking()` never resurrects a cancelled row, so that
 * mistake would be permanent. `index.ts` runs the reconciliation only after the last page.
 *
 * WHAT IS A BOOKING AND WHAT IS THE COACH'S DENTIST
 * ------------------------------------------------
 * Nothing in the API marks an event as made through an appointment schedule: `eventType` has
 * exactly six values (`birthday`, `default`, `focusTime`, `fromGmail`, `outOfOffice`,
 * `workingLocation`) and none of them means "booked", and the discovery document does not contain
 * the word "appointment" anywhere. On a free personal account the appointment schedule also cannot
 * use a secondary calendar, so bookings land on the coach's primary calendar next to his own life.
 *
 * So the test is a shape, deliberately narrow, and a title filter on top of it:
 *
 *   - timed (not an all-day event), with a usable start and end;
 *   - exactly one guest who is neither the calendar itself, nor the organiser, nor a resource —
 *     that guest is the person who booked, and their address is the join key;
 *   - and, when `titleMatch` is configured, a title containing it. The event a booking creates is
 *     titled after the appointment schedule, so naming the schedule something specific and putting
 *     that string in the secret is what keeps a two-person lunch out of the app.
 *
 * Everything else is ignored with a reason. An ignored event is not an error: the calendar is full
 * of events that are not bookings, and that is the normal case.
 *
 * NO PERSONAL DATA IN A REASON. Every `why` here is about the event's shape and is safe to log.
 */

/** How often the poll runs. A cancellation can be up to this stale on the Тренер screen. */
export const POLL_INTERVAL_MINUTES = 10;

/**
 * How far ahead to look. Long enough that a session booked two months out is recorded the moment
 * it is made, short enough that one page of 250 events covers the coach's calendar comfortably.
 */
export const WINDOW_DAYS = 60;

/**
 * How far back the window starts. `timeMin` filters on an event's *end* time, so this is not
 * history: it is slack for clock skew between us, Postgres and Google, and it keeps a session that
 * ends during the poll from looking vanished to `findVanished()`.
 */
export const LOOKBACK_MINUTES = 60;

/** `coach_bookings.source` for everything this function writes. */
export const SOURCE = 'google_calendar';

/**
 * `external_id` is `gcal:<event id>`. The prefix is for whoever reads the table later: a row from
 * the Calendly webhook this project once had is a `https://api.calendly.com/…` uri, so provenance is legible at a glance, and the two
 * can never collide. The column caps the id at 400 characters; Google allows an event id of up to
 * 1024, so the cap is checked here rather than discovered as a constraint violation.
 */
export const EXTERNAL_ID_PREFIX = 'gcal:';
const MAX_EXTERNAL_ID = 400;

/** The IANA zone shape `coach_bookings.timezone` accepts. */
const TIMEZONE_RE = /^[A-Za-z][A-Za-z0-9+_/-]{1,63}$/;

/**
 * An address we are willing to treat as a join key. Deliberately loose — Google has already
 * validated it as RFC5322 — but with no spaces and one `@`, and within the column's 254.
 */
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@.]{2,}$/;

// --- the slice of the Google event we read ------------------------------------------------------

export interface GoogleEventDateTime {
  /** RFC3339 with an offset. Absent on an all-day event. */
  dateTime?: string | null;
  /** `yyyy-mm-dd`, present only on an all-day event. */
  date?: string | null;
  /** IANA name, optional on a single event. */
  timeZone?: string | null;
}

export interface GoogleAttendee {
  email?: string | null;
  organizer?: boolean | null;
  self?: boolean | null;
  resource?: boolean | null;
  responseStatus?: string | null;
}

export interface GoogleEvent {
  id?: string | null;
  status?: string | null;
  summary?: string | null;
  location?: string | null;
  hangoutLink?: string | null;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string | null; uri?: string | null }> | null;
  } | null;
  attendees?: GoogleAttendee[] | null;
  organizer?: { email?: string | null; self?: boolean | null } | null;
  creator?: { email?: string | null; self?: boolean | null } | null;
  start?: GoogleEventDateTime | null;
  end?: GoogleEventDateTime | null;
  recurringEventId?: string | null;
}

export interface ReadOptions {
  /** The calendar being polled — its id is the coach's own address, so never a booker. */
  calendarId: string;
  /** Any further addresses that are the coach rather than a client. */
  ownerEmails?: readonly string[];
  /** When set, only events whose title contains it (case-insensitively) are bookings. */
  titleMatch?: string | null;
  /** The calendar's default zone, from the list response — the fallback when the event has none. */
  calendarTimeZone?: string | null;
}

// --- what one event turns into ------------------------------------------------------------------

export interface BookingUpsert {
  kind: 'upsert';
  email: string;
  externalId: string;
  externalEventId: string;
  startsAt: string;
  endsAt: string;
  timezone: string | null;
  joinUrl: string | null;
  locationKind: string | null;
  locationText: string | null;
  eventName: string | null;
}

export interface BookingCancel {
  kind: 'cancel';
  externalId: string;
  reason: string | null;
}

/** Not a booking, and nothing wrong. `why` never names anybody. */
export interface BookingIgnore {
  kind: 'ignore';
  why: string;
}

export type EventChange = BookingUpsert | BookingCancel | BookingIgnore;

// --- small readers ------------------------------------------------------------------------------

function rec(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

/** A url we are willing to hand to the app. https only — the column refuses anything else too. */
function httpsUrl(v: unknown): string | null {
  const s = str(v);
  return s && s.length <= 2000 && /^https:\/\//i.test(s) ? s : null;
}

function isoTime(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function email(v: unknown): string | null {
  const s = str(v)?.toLowerCase() ?? null;
  return s && s.length <= 254 && EMAIL_RE.test(s) ? s : null;
}

/** The Meet link: `hangoutLink` when Google filled it, else the video entry point. */
export function readJoinUrl(event: GoogleEvent): string | null {
  const direct = httpsUrl(event.hangoutLink);
  if (direct) return direct;
  const points = event.conferenceData?.entryPoints;
  if (!Array.isArray(points)) return null;
  for (const point of points) {
    const entry = rec(point);
    if (!entry) continue;
    if (str(entry.entryPointType) !== 'video') continue;
    const uri = httpsUrl(entry.uri);
    if (uri) return uri;
  }
  return null;
}

/**
 * The one guest who is not the coach. Returns `null` when there is nobody, and `'ambiguous'` when
 * there is more than one — an appointment-schedule booking has exactly one, and guessing which of
 * three addresses a session belongs to would file it into the wrong person's account.
 */
export function readBooker(
  event: GoogleEvent,
  options: ReadOptions,
): { email: string } | null | 'ambiguous' {
  const owners = new Set<string>([options.calendarId.trim().toLowerCase()]);
  for (const owner of options.ownerEmails ?? []) {
    const normalized = str(owner)?.toLowerCase();
    if (normalized) owners.add(normalized);
  }
  const organizer = email(event.organizer?.email);
  if (organizer) owners.add(organizer);

  const guests = new Set<string>();
  for (const raw of event.attendees ?? []) {
    const attendee = rec(raw) as GoogleAttendee | null;
    if (!attendee) continue;
    if (attendee.resource === true) continue;
    if (attendee.self === true || attendee.organizer === true) continue;
    const address = email(attendee.email);
    if (!address || owners.has(address)) continue;
    guests.add(address);
  }

  if (guests.size === 0) return null;
  if (guests.size > 1) return 'ambiguous';
  return { email: [...guests][0]! };
}

/**
 * One calendar event → the single change it represents, or a reasoned refusal.
 * Never throws: an event we cannot read is an `ignore`, not a failed sync.
 */
export function readEvent(raw: unknown, options: ReadOptions): EventChange {
  const event = rec(raw) as GoogleEvent | null;
  if (!event) return { kind: 'ignore', why: 'event is not an object' };

  const id = str(event.id);
  if (!id) return { kind: 'ignore', why: 'event has no id' };
  const externalId = EXTERNAL_ID_PREFIX + id;
  if (externalId.length > MAX_EXTERNAL_ID) {
    return { kind: 'ignore', why: 'event id is longer than the column allows' };
  }

  /*
   * A cancelled event is cancelled whatever else it looks like — a deleted one is only guaranteed
   * to carry its id, so there is nothing else left to test. `cancel_coach_booking()` returns null
   * for an id we never recorded, which is the normal case for every ordinary meeting the coach
   * deletes, so this costs one no-op call and never an error.
   */
  if (str(event.status) === 'cancelled') {
    return { kind: 'cancel', externalId, reason: null };
  }

  const startsAt = isoTime(event.start?.dateTime);
  const endsAt = isoTime(event.end?.dateTime);
  if (!startsAt || !endsAt) {
    // An all-day event carries `date` instead of `dateTime`, and a session is never all day.
    return { kind: 'ignore', why: 'event has no timed start and end' };
  }
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    return { kind: 'ignore', why: 'event ends before it starts' };
  }

  const title = str(event.summary);
  const titleMatch = str(options.titleMatch);
  if (titleMatch) {
    if (!title || !title.toLowerCase().includes(titleMatch.toLowerCase())) {
      return { kind: 'ignore', why: 'title does not match the booking filter' };
    }
  }

  const booker = readBooker(event, options);
  if (booker === null) return { kind: 'ignore', why: 'event has no guest besides the coach' };
  if (booker === 'ambiguous') return { kind: 'ignore', why: 'event has more than one guest' };

  const joinUrl = readJoinUrl(event);
  const locationText = str(event.location)?.slice(0, 500) ?? null;
  const zone = str(event.start?.timeZone) ?? str(options.calendarTimeZone);

  return {
    kind: 'upsert',
    email: booker.email,
    externalId,
    /*
     * The session itself. For an instance of a recurring event that is the series; for the single
     * event a booking creates, the two are the same, which is exactly what the column expects.
     */
    externalEventId: EXTERNAL_ID_PREFIX + (str(event.recurringEventId) ?? id),
    startsAt,
    endsAt,
    timezone: zone && TIMEZONE_RE.test(zone) ? zone : null,
    joinUrl,
    /*
     * The column is capped, not enumerated, and the client only asks "is there a join_url" — so
     * this is a label for a human reading the table, not a branch anybody takes.
     */
    locationKind: joinUrl ? 'google_conference' : locationText ? 'physical' : null,
    locationText,
    eventName: title ? title.slice(0, 200) : null,
  };
}

// --- the window, and what fell out of it --------------------------------------------------------

export interface SyncWindow {
  /** Lower bound on an event's *end* time. */
  timeMin: string;
  /** Upper bound on an event's *start* time. */
  timeMax: string;
}

export function syncWindow(now: number = Date.now()): SyncWindow {
  return {
    timeMin: new Date(now - LOOKBACK_MINUTES * 60_000).toISOString(),
    timeMax: new Date(now + WINDOW_DAYS * 86_400_000).toISOString(),
  };
}

/**
 * The bookings we hold as active inside the window that this poll did not see. Cancelled in
 * Google, gone from the list, and nothing else will ever tell us.
 *
 * Only call this after the whole window listed successfully — see the file header.
 */
export function findVanished(
  known: readonly { external_id?: string | null }[],
  seenActive: ReadonlySet<string>,
): string[] {
  const gone: string[] = [];
  for (const row of known) {
    const id = str(row?.external_id);
    if (!id || seenActive.has(id)) continue;
    gone.push(id);
  }
  return gone;
}

/** What a run did, for the log and the response body. Counts only — never who. */
export interface SyncTally {
  scanned: number;
  booked: number;
  cancelled: number;
  vanished: number;
  ignored: number;
  failed: number;
}

export function emptyTally(): SyncTally {
  return { scanned: 0, booked: 0, cancelled: 0, vanished: 0, ignored: 0, failed: 0 };
}

export function describeTally(tally: SyncTally): string {
  return (
    `scanned=${tally.scanned} booked=${tally.booked} cancelled=${tally.cancelled} ` +
    `vanished=${tally.vanished} ignored=${tally.ignored} failed=${tally.failed}`
  );
}
