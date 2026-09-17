-- =============================================================================
-- 0014 — Coach bookings: the one-to-one session a person booked with the coach.
--
-- «Будет здорово если мы будем подгружать в приложение информацию о встрече которую сделал
--  пользователь. Типо вот ссылка на вход, через столько то начнется, дата, время»
--
-- The Тренер tab used to end at "pay and write to the coach". Bookings now happen in a scheduling
-- tool, and this table is the app's copy of them: one row per booked session, so the screen can
-- say when it starts, how long until it starts, and where to join.
--
-- NOTHING HERE IS CALENDLY-SHAPED
-- ------------------------------
-- Calendly's webhooks need its Standard plan; the free tier has no webhooks, no post-booking
-- redirect and one active event type, so it cannot serve the 30- and 60-minute sessions at all.
-- Which scheduler the owner ends up paying for (or replacing with a free Google Calendar
-- appointment schedule) is therefore an open question, and this table is written so that the
-- answer never reaches it:
--
--   external_id         the provider's own id for this booking-for-this-person. Calendly's
--                       invitee uri; a Google Calendar event id; whatever the next one calls it.
--                       Unique, and the reason a delivery repeated twice writes one row.
--   external_event_id   the provider's id for the session itself, which several people could
--                       in principle share.
--   source              a short slug naming the ingestion path, validated by shape and not
--                       against a list — so adding one is a new caller, never a migration.
--                       In use or foreseen: 'calendly_webhook', 'google_calendar', 'admin'.
--
-- Only `calendly_webhook` exists today (supabase/functions/calendly-webhook/), and only on a paid
-- Calendly plan. A second source fills the same columns through the same two functions below.
--
-- IDENTITY, AND WHY AN EMAIL HERE GRANTS NOTHING
-- ----------------------------------------------
-- A scheduler knows a person by the address typed into its form, which anybody can type. So the
-- address is a *join key*, never an identity: a row may exist for an address that never signs in,
-- and it does nothing until somebody holds a confirmed session for that address. Reading is
-- `public.current_email()`, which resolves through `auth.uid()` → a confirmed, unbanned
-- `auth.users` row — exactly as purchases (0001) and subscriptions (0005) do it. Booking a slot
-- therefore cannot grant access to anything; it only makes a card appear for the person who can
-- actually prove that address.
--
-- IDEMPOTENCY AND RESCHEDULES
-- ---------------------------
-- `external_id` is unique, so a delivery repeated twice writes once. Rescheduling is the awkward
-- case, because at least one provider does not have an event for it: Calendly cancels the old
-- invitee (with `rescheduled: true`) and creates a new one carrying `old_invitee`, i.e. a new
-- `external_id` for the same session. `apply_coach_booking()` takes that predecessor id and
-- *moves* the existing row onto the new booking instead of adding a second one. A cancellation
-- marks the row cancelled and keeps it: the person should see that the session they had is gone,
-- and the coach should still see that it happened.
-- =============================================================================

create table if not exists public.coach_bookings (
  id                   uuid primary key default gen_random_uuid(),
  -- The address the person gave the scheduler. A join key, not an identity — see the header.
  email                citext not null,
  -- The provider's ids. `external_id` is unique per booking and is the idempotency key.
  external_id          text not null unique,
  external_event_id    text not null,
  -- Set when this row replaced an earlier booking, kept so support can follow a reschedule back.
  previous_external_id text,
  starts_at            timestamptz not null,
  ends_at              timestamptz not null,
  -- The IANA zone the person booked in, as the provider recorded it. See `my_coach_bookings`.
  timezone             text,
  -- Where to join. A conference location carries `join_url`; a physical one carries text instead,
  -- so the two are kept apart rather than squeezed into one column that means different things.
  join_url             text,
  location_kind        text,
  location_text        text,
  cancel_url           text,
  reschedule_url       text,
  status               text not null default 'active' check (status in ('active', 'cancelled')),
  cancel_reason        text,
  event_name           text,
  source               text not null default 'calendly_webhook',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.coach_bookings is
  'One-to-one sessions booked with the coach, whatever scheduler they came from. A reschedule moves the row; a cancellation keeps it.';

alter table public.coach_bookings drop constraint if exists coach_bookings_email_len;
alter table public.coach_bookings add constraint coach_bookings_email_len
  check (length(email::text) <= 254) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_external_id_len;
alter table public.coach_bookings add constraint coach_bookings_external_id_len
  check (length(external_id) between 1 and 400) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_external_event_id_len;
alter table public.coach_bookings add constraint coach_bookings_external_event_id_len
  check (length(external_event_id) between 1 and 400) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_replaces_len;
alter table public.coach_bookings add constraint coach_bookings_replaces_len
  check (previous_external_id is null or length(previous_external_id) <= 400) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_order;
alter table public.coach_bookings add constraint coach_bookings_order
  check (ends_at > starts_at) not valid;
-- An IANA zone name, loosely: enough to keep junk out of Intl.DateTimeFormat on the client.
alter table public.coach_bookings drop constraint if exists coach_bookings_timezone_fmt;
alter table public.coach_bookings add constraint coach_bookings_timezone_fmt
  check (timezone is null or timezone ~ '^[A-Za-z][A-Za-z0-9+_/-]{1,63}$') not valid;
/*
 * Every url the app may render as a link has to be https. The payload is attacker-shaped in the
 * worst case, and a `javascript:` or `data:` value that reaches an anchor is the whole exploit —
 * so it is refused at the column rather than sanitised at every call site.
 */
alter table public.coach_bookings drop constraint if exists coach_bookings_join_url_https;
alter table public.coach_bookings add constraint coach_bookings_join_url_https
  check (join_url is null or (join_url ~ '^https://' and length(join_url) <= 2000)) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_cancel_url_https;
alter table public.coach_bookings add constraint coach_bookings_cancel_url_https
  check (cancel_url is null or (cancel_url ~ '^https://' and length(cancel_url) <= 2000)) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_reschedule_url_https;
alter table public.coach_bookings add constraint coach_bookings_reschedule_url_https
  check (reschedule_url is null or (reschedule_url ~ '^https://' and length(reschedule_url) <= 2000)) not valid;
/*
 * `location_kind` is capped rather than enumerated. Calendly's set today is physical,
 * outbound_call, inbound_call, google_conference, zoom_conference, gotomeeting,
 * microsoft_teams_conference, custom and ask_invitee — and it grows whenever they add a
 * conferencing partner. An enum here would turn that into a failed webhook and a booking the
 * person never sees; the client already treats "has a join_url" as the thing that matters.
 */
alter table public.coach_bookings drop constraint if exists coach_bookings_location_kind_len;
alter table public.coach_bookings add constraint coach_bookings_location_kind_len
  check (location_kind is null or length(location_kind) <= 40) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_location_text_len;
alter table public.coach_bookings add constraint coach_bookings_location_text_len
  check (location_text is null or length(location_text) <= 500) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_event_name_len;
alter table public.coach_bookings add constraint coach_bookings_event_name_len
  check (event_name is null or length(event_name) <= 200) not valid;
alter table public.coach_bookings drop constraint if exists coach_bookings_cancel_reason_len;
alter table public.coach_bookings add constraint coach_bookings_cancel_reason_len
  check (cancel_reason is null or length(cancel_reason) <= 500) not valid;
/*
 * `source` is checked for shape, not for membership of a list, and deliberately — an enumerated
 * constraint would mean a migration every time the owner changes her mind about which scheduler
 * she is paying for, which is exactly the change this table exists to absorb. `subscriptions.source`
 * (0005) is capped the same way for the same reason.
 */
alter table public.coach_bookings drop constraint if exists coach_bookings_source_fmt;
alter table public.coach_bookings add constraint coach_bookings_source_fmt
  check (source ~ '^[a-z][a-z0-9_]{1,39}$') not valid;

-- The only query the app makes: this person's sessions, soonest first.
create index if not exists coach_bookings_email_starts_idx
  on public.coach_bookings (email, starts_at desc);
-- The coach's list: what is coming up, across everybody.
create index if not exists coach_bookings_status_starts_idx
  on public.coach_bookings (status, starts_at);

drop trigger if exists coach_bookings_touch on public.coach_bookings;
create trigger coach_bookings_touch
  before update on public.coach_bookings
  for each row execute function public.set_updated_at();

alter table public.coach_bookings enable row level security;

-- The coach and the owner read and write everything, as with purchases and subscriptions.
drop policy if exists "coach_bookings: admins all" on public.coach_bookings;
create policy "coach_bookings: admins all"
  on public.coach_bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

/*
 * Everybody else reads their own rows and only their own. This is a read policy and there is no
 * matching write policy on purpose: bookings are made in the scheduler and written by ingestion with
 * the service role. A signed-in person can never insert, move or cancel a booking through the API,
 * including their own — that would be a way to write a session into somebody else's account.
 */
drop policy if exists "coach_bookings: owner select" on public.coach_bookings;
create policy "coach_bookings: owner select"
  on public.coach_bookings for select
  to authenticated
  using (email = public.current_email());

revoke all on public.coach_bookings from anon, authenticated;
grant select, insert, update, delete on public.coach_bookings to authenticated;

-- -----------------------------------------------------------------------------
-- my_coach_bookings — the signed-in person's own sessions, soonest first.
--
-- `timezone` is passed through rather than used here: the row records the zone the person booked
-- in, but the app shows the time in the zone of the device they are holding, which is the one
-- they are actually living in when the session starts. The stored value is the fallback for a
-- browser that reports nothing useful. See src/lib/coach/booking.ts.
-- -----------------------------------------------------------------------------
drop view if exists public.my_coach_bookings;
create view public.my_coach_bookings
with (security_invoker = false)
as
  select b.id, b.starts_at, b.ends_at, b.timezone, b.join_url, b.location_kind, b.location_text,
         b.cancel_url, b.reschedule_url, b.status, b.event_name
  from public.coach_bookings b
  where b.email = public.current_email()
  order by b.starts_at;

revoke all on public.my_coach_bookings from anon, authenticated;
grant select on public.my_coach_bookings to authenticated;

-- -----------------------------------------------------------------------------
-- apply_coach_booking — a booking was made, or moved. Called by the ingestion path with the
-- service role; never by a signed-in user.
--
-- Idempotent on `p_external_id`: the same delivery twice writes one row. When `p_previous_external_id`
-- names a row we already have, that row is *moved* onto the new booking — a reschedule is the same
-- session at a new time, not a second session. Provider-neutral: see the header.
-- -----------------------------------------------------------------------------
create or replace function public.apply_coach_booking(
  p_email                text,
  p_external_id          text,
  p_external_event_id    text,
  p_starts_at            timestamptz,
  p_ends_at              timestamptz,
  p_timezone             text default null,
  p_join_url             text default null,
  p_location_kind        text default null,
  p_location_text        text default null,
  p_cancel_url           text default null,
  p_reschedule_url       text default null,
  p_event_name           text default null,
  p_previous_external_id text default null,
  p_source               text default 'calendly_webhook'
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email    citext;
  v_external  text;
  v_previous text;
  v_source   text;
  v_id       uuid;
begin
  -- Only the service role (the webhook) and the SQL editor: never a signed-in user.
  if coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '') <> 'service_role' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  v_email   := public.normalize_email(p_email);
  v_external := nullif(trim(coalesce(p_external_id, '')), '');
  if v_external is null then
    raise exception 'invalid_external_id' using errcode = 'P0001';
  end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'invalid_times' using errcode = 'P0001';
  end if;
  -- By shape, like the column: a new ingestion path is a new caller, not a new migration.
  if p_source is null or p_source !~ '^[a-z][a-z0-9_]{1,39}$' then
    raise exception 'invalid_source' using errcode = 'P0001';
  end if;
  v_source   := p_source;
  v_previous := nullif(trim(coalesce(p_previous_external_id, '')), '');

  -- A reschedule: move the row we already hold onto the new booking rather than inserting.
  if v_previous is not null and v_previous <> v_external then
    update public.coach_bookings
       set email                = v_email,
           external_id          = v_external,
           external_event_id    = p_external_event_id,
           previous_external_id = v_previous,
           starts_at            = p_starts_at,
           ends_at              = p_ends_at,
           timezone             = p_timezone,
           join_url             = p_join_url,
           location_kind        = p_location_kind,
           location_text        = p_location_text,
           cancel_url           = p_cancel_url,
           reschedule_url       = p_reschedule_url,
           status               = 'active',
           cancel_reason        = null,
           event_name           = coalesce(p_event_name, event_name),
           source               = v_source
     where external_id = v_previous
     returning id into v_id;
    if v_id is not null then
      return v_id;
    end if;
    -- The earlier booking never reached us (the webhook was added mid-flight, or the first
    -- delivery failed). Fall through and record the new one on its own.
  end if;

  insert into public.coach_bookings as cb (
    email, external_id, external_event_id, previous_external_id, starts_at, ends_at, timezone,
    join_url, location_kind, location_text, cancel_url, reschedule_url, status, event_name, source
  )
  values (
    v_email, v_external, p_external_event_id, v_previous, p_starts_at, p_ends_at, p_timezone,
    p_join_url, p_location_kind, p_location_text, p_cancel_url, p_reschedule_url, 'active',
    p_event_name, v_source
  )
  on conflict (external_id) do update
    set email                = excluded.email,
        external_event_id    = excluded.external_event_id,
        previous_external_id = coalesce(excluded.previous_external_id, cb.previous_external_id),
        starts_at            = excluded.starts_at,
        ends_at              = excluded.ends_at,
        timezone             = excluded.timezone,
        join_url             = excluded.join_url,
        location_kind        = excluded.location_kind,
        location_text        = excluded.location_text,
        cancel_url           = excluded.cancel_url,
        reschedule_url       = excluded.reschedule_url,
        -- A replayed "booked" delivery never resurrects a booking cancelled afterwards: the
        -- cancellation is the later fact about the same external id.
        status               = cb.status,
        event_name           = coalesce(excluded.event_name, cb.event_name),
        source               = excluded.source,
        updated_at           = now()
  returning cb.id into v_id;

  return v_id;
end;
$$;

comment on function public.apply_coach_booking(text, text, text, timestamptz, timestamptz, text, text, text, text, text, text, text, text, text) is
  'Service-role only: record or move a coach booking. Idempotent per external id; a reschedule moves the existing row.';

revoke execute on function public.apply_coach_booking(text, text, text, timestamptz, timestamptz, text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.apply_coach_booking(text, text, text, timestamptz, timestamptz, text, text, text, text, text, text, text, text, text)
  to service_role;

-- -----------------------------------------------------------------------------
-- cancel_coach_booking — the person (or the coach) cancelled. The row stays: the person needs
-- to see that the session is gone, and the coach needs the history.
--
-- Returns the row id, or null when the booking was never recorded here — which is normal for a
-- cancellation that arrives for a booking made before ingestion was switched on, and is not an
-- error the caller should retry.
-- -----------------------------------------------------------------------------
create or replace function public.cancel_coach_booking(
  p_external_id text,
  p_reason      text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_external text;
  v_id      uuid;
begin
  if coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '') <> 'service_role' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  v_external := nullif(trim(coalesce(p_external_id, '')), '');
  if v_external is null then
    raise exception 'invalid_external_id' using errcode = 'P0001';
  end if;

  update public.coach_bookings
     set status        = 'cancelled',
         cancel_reason = left(nullif(trim(coalesce(p_reason, '')), ''), 500)
   where external_id = v_external
   returning id into v_id;

  return v_id;
end;
$$;

comment on function public.cancel_coach_booking(text, text) is
  'Service-role only: mark a coach booking cancelled. Never deletes; null when the booking is unknown.';

revoke execute on function public.cancel_coach_booking(text, text) from public, anon, authenticated;
grant execute on function public.cancel_coach_booking(text, text) to service_role;
