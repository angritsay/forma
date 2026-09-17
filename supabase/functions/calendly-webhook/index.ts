/**
 * Calendly → Supabase: record the session a person booked with the coach.
 *
 * Deploy:  supabase functions deploy calendly-webhook --no-verify-jwt
 * Secrets: supabase secrets set CALENDLY_SIGNING_KEY=… CALENDLY_WEBHOOK_TOKEN=…
 *          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform)
 * Callback url to register with the subscription:
 *          https://<project>.functions.supabase.co/calendly-webhook?token=<CALENDLY_WEBHOOK_TOKEN>
 *
 * Two locks, both required. The token in the url is known only to whoever created the webhook
 * subscription; the HMAC signature in `Calendly-Webhook-Signature` can only be produced by
 * something holding that subscription's signing key. Unlike the payment webhook there is no
 * "token only" fallback: without `CALENDLY_SIGNING_KEY` the function refuses every delivery and
 * writes nothing. An unauthenticated endpoint that files bookings under an email address is an
 * endpoint that files a booking into anybody's account, so the verification is the feature.
 *
 * REQUIRES CALENDLY STANDARD OR ABOVE. Webhook subscriptions are not available on the Free plan
 * (which also allows one active event type and no post-booking redirect, so it cannot serve the
 * 30- and 60-minute sessions in any case). On a free account nothing here ever runs: Calendly
 * never calls it, and without the two secrets below it refuses every request anyway. It is inert,
 * not broken — `coach_bookings` is provider-neutral and can be filled from somewhere else
 * entirely, a Google Calendar appointment schedule included. See 0014_coach_bookings.sql.
 *
 * Nothing here logs who. A failure says what failed; the row it was about is found by the invitee
 * uri in Calendly's own delivery log, which is where that lookup belongs.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { readChange, SIGNATURE_HEADER, verifySignature } from './verify.ts';

function reply(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, 'method not allowed');

  const token = Deno.env.get('CALENDLY_WEBHOOK_TOKEN');
  if (!token || new URL(req.url).searchParams.get('token') !== token) {
    return reply(403, 'bad token');
  }

  const key = Deno.env.get('CALENDLY_SIGNING_KEY');
  if (!key) {
    console.error('calendly-webhook: CALENDLY_SIGNING_KEY is not set; refusing every delivery');
    return reply(503, 'not configured');
  }

  // The raw bytes, before any parsing: the signature covers what was sent, not what we re-encode.
  const raw = await req.text();
  const verdict = await verifySignature(raw, req.headers.get(SIGNATURE_HEADER), key);
  if (!verdict.ok) {
    console.warn(`calendly-webhook: signature rejected (${verdict.reason})`);
    return reply(403, 'bad signature');
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, 'unreadable body');
  }

  const change = readChange(body);
  if (change.kind === 'ignore') {
    console.info(`calendly-webhook: ignored — ${change.why}`);
    return reply(200, 'ignored');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  if (change.kind === 'cancel') {
    const { error } = await supabase.rpc('cancel_coach_booking', {
      p_external_id: change.inviteeUri,
      p_reason: change.reason,
    });
    if (error) {
      console.error('calendly-webhook: cancel_coach_booking failed', error.message);
      return reply(500, 'could not cancel the booking');
    }
    return reply(200, 'ok: cancelled');
  }

  const { error } = await supabase.rpc('apply_coach_booking', {
    p_email: change.email,
    p_external_id: change.inviteeUri,
    p_external_event_id: change.eventUri,
    p_starts_at: change.startsAt,
    p_ends_at: change.endsAt,
    p_timezone: change.timezone,
    p_join_url: change.joinUrl,
    p_location_kind: change.locationKind,
    p_location_text: change.locationText,
    p_cancel_url: change.cancelUrl,
    p_reschedule_url: change.rescheduleUrl,
    p_event_name: change.eventName,
    p_previous_external_id: change.previousInviteeUri,
    p_source: 'calendly_webhook',
  });
  if (error) {
    console.error('calendly-webhook: apply_coach_booking failed', error.message);
    return reply(500, 'could not record the booking');
  }
  return reply(200, change.previousInviteeUri ? 'ok: rescheduled' : 'ok: booked');
});
