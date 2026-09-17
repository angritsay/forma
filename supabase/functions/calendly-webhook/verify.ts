/**
 * Calendly webhook verification and payload reading, runtime-neutral (Web Crypto only) so the same
 * code runs in the Edge Function and in the Node test suite.
 *
 * SIGNATURE
 * ---------
 * Calendly sends `Calendly-Webhook-Signature: t=<unix seconds>,v1=<hex>`. The digest is
 * HMAC-SHA256 over the string `${t}.${rawBody}` using the *signing key of that webhook
 * subscription* — the value you chose when you created the subscription, not a Calendly-wide key.
 * The timestamp is part of the signed string so a captured delivery cannot be replayed later;
 * `TOLERANCE_MS` is the three minutes Calendly's own guidance uses.
 *
 * The body must be hashed exactly as received. That is why `index.ts` reads `req.text()` first and
 * only parses afterwards: re-serialising JSON changes the bytes and every signature stops matching.
 *
 * PAYLOAD
 * -------
 * The envelope is `{ event, created_at, created_by, payload }`. `payload` is the invitee, and the
 * session itself hangs off it as `scheduled_event`. There is no `invitee.rescheduled` event: a
 * reschedule arrives as `invitee.canceled` on the old invitee with `rescheduled: true`, plus
 * `invitee.created` on the new one carrying `old_invitee`. `readChange()` turns that pair into one
 * move, and refuses to treat the cancellation half as a real cancellation.
 *
 * The join link lives in `scheduled_event.location.join_url`, and only for a conferencing location
 * (`zoom_conference`, `google_conference`, `microsoft_teams_conference`, `gotomeeting`, …). A
 * physical or phone location carries human text in `location.location` instead, so the two are
 * read into separate fields rather than one that would sometimes be a URL and sometimes an address.
 *
 * Older Calendly payloads referenced the session as a bare uri in `payload.event` with no embedded
 * object. That shape carries no start time, so it cannot be recorded — `readChange()` reports it as
 * unusable rather than writing a row with invented times.
 */

/** Calendly's own replay window for a signed delivery. */
export const TOLERANCE_MS = 3 * 60 * 1000;

export const SIGNATURE_HEADER = 'calendly-webhook-signature';

export interface ParsedSignature {
  /** Unix seconds, as sent. */
  t: string;
  /** The v1 hex digest. */
  v1: string;
}

/** `t=1699999999,v1=abc…` → the pair, or null when the header is absent or malformed. */
export function parseSignature(header: string | null): ParsedSignature | null {
  if (!header) return null;
  let t = '';
  let v1 = '';
  for (const part of header.split(',')) {
    const at = part.indexOf('=');
    if (at < 0) continue;
    const key = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    if (key === 't') t = value;
    else if (key === 'v1') v1 = value;
  }
  if (!/^\d{1,15}$/.test(t)) return null;
  if (!/^[0-9a-f]{64}$/i.test(v1)) return null;
  return { t, v1 };
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** HMAC-SHA256 over `${t}.${rawBody}`, hex — the digest Calendly puts in `v1`. */
export async function signPayload(t: string, rawBody: string, key: string): Promise<string> {
  const hmac = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(`${t}.${rawBody}`)));
}

/** Constant-time comparison of two hex digests. */
export function signatureMatches(expected: string, received: string | null): boolean {
  if (!received || received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

export type VerifyFailure = 'no_signature' | 'stale' | 'mismatch';
export type VerifyResult = { ok: true } | { ok: false; reason: VerifyFailure };

/**
 * The whole door. Nothing in the body is read until this returns ok — an endpoint that writes
 * bookings keyed by an address is an endpoint that writes into anybody's account otherwise.
 */
export async function verifySignature(
  rawBody: string,
  header: string | null,
  key: string,
  now: number = Date.now(),
  toleranceMs: number = TOLERANCE_MS,
): Promise<VerifyResult> {
  const parsed = parseSignature(header);
  if (!parsed) return { ok: false, reason: 'no_signature' };

  const sentAt = Number(parsed.t) * 1000;
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > toleranceMs) {
    return { ok: false, reason: 'stale' };
  }

  const expected = await signPayload(parsed.t, rawBody, key);
  if (!signatureMatches(expected, parsed.v1.toLowerCase()))
    return { ok: false, reason: 'mismatch' };
  return { ok: true };
}

// --- payload ----------------------------------------------------------------

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

export interface BookingUpsert {
  kind: 'upsert';
  email: string;
  inviteeUri: string;
  eventUri: string;
  startsAt: string;
  endsAt: string;
  timezone: string | null;
  joinUrl: string | null;
  locationKind: string | null;
  locationText: string | null;
  cancelUrl: string | null;
  rescheduleUrl: string | null;
  eventName: string | null;
  /** The invitee this booking replaces, when it is a reschedule. */
  previousInviteeUri: string | null;
}

export interface BookingCancel {
  kind: 'cancel';
  inviteeUri: string;
  reason: string | null;
}

/** Nothing to write, and nothing wrong: the delivery is acknowledged so Calendly stops retrying. */
export interface BookingIgnore {
  kind: 'ignore';
  /** Why, for the log. Never contains anything about the person. */
  why: string;
}

export type BookingChange = BookingUpsert | BookingCancel | BookingIgnore;

/** The location's join link and its human text, whichever the location kind carries. */
export function readLocation(location: unknown): {
  kind: string | null;
  joinUrl: string | null;
  text: string | null;
} {
  const loc = rec(location);
  if (!loc) return { kind: null, joinUrl: null, text: null };
  const kind = str(loc.type);
  return {
    kind: kind && kind.length <= 40 ? kind : null,
    // Conferencing locations only; a physical one has no join_url at all.
    joinUrl: httpsUrl(loc.join_url),
    // `location` is the address, the phone number or the free text the host or invitee gave.
    text: (() => {
      const s = str(loc.location);
      return s ? s.slice(0, 500) : null;
    })(),
  };
}

/**
 * Turn one delivery into the single change it represents, or into a reasoned refusal.
 * Never throws: a body that does not look like a Calendly webhook is an `ignore`, not a 500.
 */
export function readChange(body: unknown): BookingChange {
  const envelope = rec(body);
  if (!envelope) return { kind: 'ignore', why: 'body is not an object' };

  const event = str(envelope.event);
  const payload = rec(envelope.payload);
  if (!event) return { kind: 'ignore', why: 'no event name' };
  if (!payload) return { kind: 'ignore', why: `no payload for ${event}` };

  const inviteeUri = str(payload.uri);
  if (!inviteeUri || inviteeUri.length > 400) {
    return { kind: 'ignore', why: `no usable invitee uri for ${event}` };
  }

  if (event === 'invitee.canceled') {
    /*
     * A reschedule cancels the old invitee before (or after) creating the new one. Treating that
     * as a cancellation would flash "your session was cancelled" at somebody who just moved it,
     * and the ordering of the two deliveries is not guaranteed, so it is refused outright: the
     * `invitee.created` half carries `old_invitee` and moves the row on its own.
     */
    if (payload.rescheduled === true) {
      return { kind: 'ignore', why: 'cancellation is one half of a reschedule' };
    }
    const cancellation = rec(payload.cancellation);
    const reason = cancellation ? str(cancellation.reason) : null;
    return { kind: 'cancel', inviteeUri, reason: reason ? reason.slice(0, 500) : null };
  }

  if (event !== 'invitee.created') return { kind: 'ignore', why: `unhandled event ${event}` };

  const email = str(payload.email)?.toLowerCase() ?? null;
  if (!email || email.length > 254) return { kind: 'ignore', why: 'no usable invitee email' };

  const scheduled = rec(payload.scheduled_event);
  if (!scheduled) {
    // The bare-uri shape: no start time, so there is nothing honest to record.
    return { kind: 'ignore', why: 'no scheduled_event object in the payload' };
  }

  const startsAt = isoTime(scheduled.start_time);
  const endsAt = isoTime(scheduled.end_time);
  if (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) {
    return { kind: 'ignore', why: 'scheduled_event has no usable start/end time' };
  }

  const eventUri = str(scheduled.uri) ?? str(payload.event);
  if (!eventUri || eventUri.length > 400) {
    return { kind: 'ignore', why: 'no usable scheduled event uri' };
  }

  const location = readLocation(scheduled.location);
  const previous = str(payload.old_invitee);
  const timezone = str(payload.timezone);
  const eventName = str(scheduled.name);

  return {
    kind: 'upsert',
    email,
    inviteeUri,
    eventUri,
    startsAt,
    endsAt,
    timezone: timezone && /^[A-Za-z][A-Za-z0-9+_/-]{1,63}$/.test(timezone) ? timezone : null,
    joinUrl: location.joinUrl,
    locationKind: location.kind,
    locationText: location.text,
    cancelUrl: httpsUrl(payload.cancel_url),
    rescheduleUrl: httpsUrl(payload.reschedule_url),
    eventName: eventName ? eventName.slice(0, 200) : null,
    previousInviteeUri: previous && previous.length <= 400 ? previous : null,
  };
}
