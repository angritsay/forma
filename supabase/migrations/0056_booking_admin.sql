-- =============================================================================
-- 0056 — booking admin: the gaps in 0055 that cost a client money or hide a paid session.
--
-- 0055 made booking a thing the app does. Running it showed where a paid session could slip past
-- the admin, or a client pay twice:
--
--   1. **A paid session with no time.** A payment that matched no hold stays unapplied (0055
--      §10), and the admin could see it but not act on it. `admin_book_from_payment()` books it:
--      the admin picks the coach and the time, and the payment becomes an active session with its
--      room link and the client's confirmation, as if the hold had been there.
--   2. **Holds were invisible.** `admin_coach_bookings()` listed sessions only; somebody paying
--      right now for a slot was nowhere in «Записи». It gains a `holds` scope, and every row now
--      says its coach, length and hold expiry, so the screen stops reading the table a second time
--      for the coach.
--   3. **A move could not overlap its own old time.** `booking_slots` already ignores the booking
--      being moved; `available_slots` now takes it (`p_ignore_booking`), only for the caller's own
--      session. And a move goes only to a start 24 hours or more away — the same rule that decides
--      whether «Перенести» is shown at all.
--   4. **The 1-hour reminder died young.** It lived 55 minutes, so one late run of the sender
--      dropped it. It lives 90 now, and the ones already queued are stretched to match.
--   5. **The owner's channel said «Занятие оплачено» twice.** The payment's own row (0044) and the
--      booking it confirmed (0055) each spoke. When the payment confirms a hold, the booking's
--      message carries the money and the payment's own line is taken out of the queue.
--
-- Requires 0040, 0044, 0045, 0055. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Slots for a move: the caller's own session does not block its new time.
--
-- `p_ignore_booking` is honoured only when it names an active session of the caller with this
-- coach; anything else is ignored, so it cannot be used to see through somebody else's booking.
-- The old four-argument version goes: two overloads would make PostgREST's choice ambiguous.
-- -----------------------------------------------------------------------------
drop function if exists public.available_slots(text, text, timestamptz, timestamptz);

create or replace function public.available_slots(
  p_coach          text,
  p_option         text,
  p_from           timestamptz default now(),
  p_to             timestamptz default now() + interval '14 days',
  p_ignore_booking uuid default null
)
returns table (starts_at timestamptz, ends_at timestamptz)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_ignore uuid;
begin
  -- A coach the caller may not book has no free time for them (her card is not shown either).
  if not public.booking_coach_visible(p_coach) then
    return;
  end if;
  -- Asked only when given: without claims (the service role, a test) there is no caller's email.
  if p_ignore_booking is not null then
    select b.id into v_ignore from public.coach_bookings b
    where b.id = p_ignore_booking
      and b.email = public.current_email()
      and b.status = 'active'
      and b.coach_id = p_coach;
  end if;
  return query
  select s.starts_at, s.ends_at
  from public.booking_slots(p_coach, p_option, p_from, p_to, v_ignore) s;
end;
$$;

revoke execute on function public.available_slots(text, text, timestamptz, timestamptz, uuid)
  from public, anon;
grant execute on function public.available_slots(text, text, timestamptz, timestamptz, uuid)
  to authenticated, service_role;

comment on function public.available_slots(text, text, timestamptz, timestamptz, uuid) is
  'Free starts of a coach for half or hour (0055, 0056): weekly rules, then exceptions, minus bookings and live holds, lead time, 30-minute grid, 60 days. p_ignore_booking = the caller''s own session being moved.';

-- -----------------------------------------------------------------------------
-- 2. move_my_booking — the text of 0055 plus one rule: the new start is 24 hours or more away.
--
-- The app offers only such starts (the picker asks from `now + 24h`); this is the same line held
-- on the server, so a sheet left open overnight cannot move a session to the next morning.
-- -----------------------------------------------------------------------------
create or replace function public.move_my_booking(p_id uuid, p_new_starts_at timestamptz)
returns table (id uuid, starts_at timestamptz, ends_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c_window constant interval := interval '1 hour';
  c_max    constant int := 10;
  v_uid    uuid := auth.uid();
  v_email  citext := public.current_email();
  v_row    public.coach_bookings%rowtype;
  v_hits   int;
begin
  if v_uid is null or v_email is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;

  select * into v_row from public.coach_bookings b
  where b.id = p_id and b.email = v_email and b.status = 'active' and b.coach_id is not null
  for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if now() > v_row.starts_at - public.booking_move_cutoff() then
    raise exception 'too_late' using errcode = 'P0001';
  end if;
  if p_new_starts_at is null or p_new_starts_at < now() + public.booking_move_cutoff() then
    raise exception 'too_soon' using errcode = 'P0001';
  end if;

  -- Every move writes to the coach's channel and the client's bot: not a loop anybody should run.
  insert into public.order_throttle as t (bucket, window_start, hits)
  values ('move:' || v_uid::text, now(), 1)
  on conflict (bucket) do update
  set window_start = case when t.window_start < now() - c_window then now() else t.window_start end,
      hits         = case when t.window_start < now() - c_window then 1 else t.hits + 1 end
  returning hits into v_hits;
  if v_hits > c_max then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  perform public.booking_sweep_holds(v_row.coach_id);
  if not exists (
    select 1 from public.booking_slots(v_row.coach_id, v_row.option_id, p_new_starts_at,
                                       p_new_starts_at + interval '1 minute', v_row.id) s
    where s.starts_at = p_new_starts_at
  ) then
    raise exception 'slot_taken' using errcode = 'P0001';
  end if;

  begin
    update public.coach_bookings b
       set starts_at = p_new_starts_at,
           ends_at   = p_new_starts_at + (v_row.ends_at - v_row.starts_at)
     where b.id = v_row.id;
  exception when exclusion_violation then
    raise exception 'slot_taken' using errcode = 'P0001';
  end;

  return query select b.id, b.starts_at, b.ends_at from public.coach_bookings b where b.id = v_row.id;
end;
$$;

revoke execute on function public.move_my_booking(uuid, timestamptz) from public, anon;
grant execute on function public.move_my_booking(uuid, timestamptz) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. admin_coach_bookings — the list of 0045 with the coach, the length and the holds.
--
-- `p_scope`: 'upcoming', 'past', 'cancelled' as in 0045, and 'holds' — live holds, soonest start
-- first: somebody has picked this time and is paying for it now. The return type grows, so the
-- function is dropped and made again.
-- -----------------------------------------------------------------------------
drop function if exists public.admin_coach_bookings(text);

create or replace function public.admin_coach_bookings(p_scope text default 'upcoming')
returns table (
  id              uuid,
  starts_at       timestamptz,
  ends_at         timestamptz,
  status          text,
  source          text,
  event_name      text,
  email           text,
  name            text,
  join_url        text,
  location_text   text,
  cancel_reason   text,
  created_at      timestamptz,
  coach_id        text,
  option_id       text,
  hold_expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_scope text := coalesce(p_scope, 'upcoming');
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_scope not in ('upcoming', 'past', 'cancelled', 'holds') then
    raise exception 'invalid_scope' using errcode = 'P0001';
  end if;

  return query
  select b.id, b.starts_at, b.ends_at, b.status, b.source, b.event_name,
         b.email::text,
         (select p.display_name from public.profiles p where p.email = b.email limit 1)::text,
         b.join_url, b.location_text, b.cancel_reason, b.created_at,
         b.coach_id, b.option_id, b.hold_expires_at
  from public.coach_bookings b
  where case v_scope
          when 'upcoming' then b.status = 'active' and b.ends_at > now()
          when 'past' then b.status = 'active' and b.ends_at <= now()
          when 'holds' then b.status = 'pending' and b.hold_expires_at > now()
          else b.status = 'cancelled'
        end
  order by
    case when v_scope in ('upcoming', 'holds') then b.starts_at end asc,
    b.starts_at desc
  limit 200;
end;
$$;

revoke execute on function public.admin_coach_bookings(text) from public, anon;
grant execute on function public.admin_coach_bookings(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. admin_book_from_payment — a paid session with no time gets one.
--
-- A session payment that matched no hold (0055 §10: another address, a hold that ran out and was
-- taken, the wrong length) stays unapplied, and the client has paid for nothing on the calendar.
-- The admin agrees a time with them and books it here:
--
--   * the payment is a session payment, not applied, not dismissed, and not already a booking;
--   * the length is the payment's own (`session_option`, written by the webhook), or `p_option`
--     when the webhook could not tell it (a lava.top key naming no option);
--   * the client is the account behind the payment: the one that claimed it, else the account
--     the paid address is linked to (0020), else the paid address itself — the address the app
--     shows sessions to (`my_coach_bookings`);
--   * the time is any future start the coach agreed to, as with `admin_move_booking` — not only a
--     published slot — but never on top of a session or a live hold: dead holds are swept, the
--     busy check is the one `booking_slots` makes (Sergey's old Google rows count), and the
--     exclusion constraint is the backstop;
--   * the row is written `active` with the payment and the coach's room link, so the booking's
--     triggers queue the client's `session_confirmed` and reminders, and tell the owner's
--     channel; the payment is marked applied.
--
-- Answers the booking's id. Errors: not_admin (42501) · not_found · not_session ·
-- already_applied · invalid_option · coach_unavailable · invalid_times · slot_taken.
-- -----------------------------------------------------------------------------
create or replace function public.admin_book_from_payment(
  p_payment_id uuid,
  p_coach      text,
  p_starts_at  timestamptz,
  p_option     text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_payment public.payments%rowtype;
  v_coach   public.coaches%rowtype;
  v_option  text;
  v_min     int;
  v_email   citext;
  v_ends    timestamptz;
  v_id      uuid := gen_random_uuid();
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if v_payment.intent is distinct from 'session' then
    raise exception 'not_session' using errcode = 'P0001';
  end if;
  if v_payment.applied
     or v_payment.resolution = 'dismissed'
     or exists (select 1 from public.coach_bookings b where b.payment_id = v_payment.id) then
    raise exception 'already_applied' using errcode = 'P0001';
  end if;

  v_option := coalesce(v_payment.session_option, nullif(btrim(coalesce(p_option, '')), ''));
  if v_option is null or v_option not in ('half', 'hour') then
    raise exception 'invalid_option' using errcode = 'P0001';
  end if;
  v_min := public.booking_option_minutes(v_option);

  select * into v_coach from public.coaches c where c.id = p_coach and c.active;
  if not found then
    raise exception 'coach_unavailable' using errcode = 'P0001';
  end if;
  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'invalid_times' using errcode = 'P0001';
  end if;
  v_ends := p_starts_at + make_interval(mins => v_min);

  select coalesce(
           (select u.email::citext from auth.users u
            where u.id = v_payment.claimed_by and u.email is not null and u.email <> ''),
           (select u.email::citext from public.payment_emails pe
            join auth.users u on u.id = pe.user_id
            where pe.email = v_payment.email and u.email is not null and u.email <> ''
            limit 1),
           v_payment.email)
    into v_email;

  perform public.booking_sweep_holds(p_coach);
  if exists (
    select 1 from public.coach_bookings b
    where (b.coach_id = p_coach or (b.coach_id is null and p_coach = 'sergey'))
      and (b.status = 'active' or (b.status = 'pending' and b.hold_expires_at > now()))
      and b.starts_at < v_ends
      and b.ends_at > p_starts_at
  ) then
    raise exception 'slot_taken' using errcode = 'P0001';
  end if;

  begin
    insert into public.coach_bookings (
      id, email, external_id, external_event_id, starts_at, ends_at, timezone, status, source,
      coach_id, option_id, payment_id, join_url, location_kind
    ) values (
      v_id, v_email, 'forma:' || v_id::text, 'forma:' || v_id::text, p_starts_at, v_ends,
      v_coach.timezone, 'active', 'forma', p_coach, v_option, v_payment.id, v_coach.room_url,
      case when v_coach.room_url is not null then 'room' end
    );
  exception when exclusion_violation or unique_violation then
    raise exception 'slot_taken' using errcode = 'P0001';
  end;

  update public.payments
     set applied = true,
         session_option = v_option
   where id = v_payment.id;
  return v_id;
end;
$$;

revoke execute on function public.admin_book_from_payment(uuid, text, timestamptz, text) from public, anon;
grant execute on function public.admin_book_from_payment(uuid, text, timestamptz, text) to authenticated;

comment on function public.admin_book_from_payment(uuid, text, timestamptz, text) is
  'Admins only (0056): book a paid session that matched no hold — coach and start picked by the admin, payment marked applied.';

-- -----------------------------------------------------------------------------
-- 5. The 1-hour reminder lives 90 minutes, not 55.
--
-- The sender runs on a schedule, and 55 minutes left no room for one late run: the reminder
-- expired before anybody sent it. 90 keeps it alive past the start by half an hour — «через час»
-- read at the start is still the link to the room, which is what the reminder is for.
-- -----------------------------------------------------------------------------
create or replace function public.booking_queue_reminders(p_row public.coach_bookings)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_hours int;
  v_at    timestamptz;
  v_base  jsonb := public.booking_params(p_row);
begin
  foreach v_hours in array array[24, 1] loop
    v_at := p_row.starts_at - make_interval(hours => v_hours);
    -- A reminder whose moment has passed says nothing the confirmation did not.
    continue when v_at <= now();
    perform public.enqueue_telegram(
      p_row.email::text,
      'session_reminder',
      'session_reminder:' || p_row.id::text || ':' || public.booking_version(p_row) || ':'
        || v_hours::text,
      v_base || jsonb_build_object('hours_before', v_hours),
      v_at,
      -- The day-before one goes once the hour-before one is due; the hour-before one outlives a
      -- late run of the sender.
      case when v_hours = 24 then interval '23 hours' else interval '90 minutes' end
    );
  end loop;
end;
$$;

revoke execute on function public.booking_queue_reminders(public.coach_bookings) from public, anon, authenticated;

-- The hour-before reminders already in the queue get the same life.
update public.telegram_outbox
   set expires_at = send_after + interval '90 minutes'
 where kind = 'session_reminder'
   and status = 'pending'
   and params ->> 'hours_before' = '1'
   and expires_at < send_after + interval '90 minutes';

-- -----------------------------------------------------------------------------
-- 6. The owner's channel: one «Занятие оплачено» per paid session.
--
-- The text of 0055 §12 with one change. A booking that becomes active with a payment (the webhook
-- confirmed a hold, a claim did, or the admin booked a payment) carries the money in its own
-- message, and the payment's `session_paid` line — queued by the payment's insert a moment
-- earlier — is taken out of the queue while it is still pending, as 0051 does for a referral.
-- A payment that confirms nothing keeps its line, next to `session_unmatched`.
-- -----------------------------------------------------------------------------
create or replace function public.coach_bookings_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_kind       text;
  v_was_active boolean := tg_op = 'UPDATE' and old.status = 'active';
  v_params     jsonb;
  v_payment    public.payments%rowtype;
begin
  begin
    if new.status = 'active' and not v_was_active then
      v_kind := 'session_booked';
    elsif new.status = 'cancelled' and v_was_active then
      v_kind := 'session_cancelled';
    elsif new.status = 'active' and v_was_active and old.starts_at is distinct from new.starts_at then
      v_kind := 'session_moved';
    end if;

    if v_kind is not null then
      v_params := jsonb_build_object(
        'email', new.email::text,
        'startsAt', new.starts_at::text,
        'minutes', greatest(1, round(extract(epoch from (new.ends_at - new.starts_at)) / 60)::int),
        'timezone', coalesce(new.timezone, ''),
        'eventName', coalesce(new.event_name, ''),
        'coach', coalesce((select c.name from public.coaches c where c.id = new.coach_id), '')
      );

      if v_kind = 'session_booked' and new.payment_id is not null then
        select * into v_payment from public.payments where id = new.payment_id;
        if found then
          v_params := v_params || jsonb_build_object(
            'paymentId', v_payment.id::text,
            'amount', coalesce(v_payment.amount::text, ''),
            'currency', coalesce(v_payment.currency, ''),
            'provider', coalesce(v_payment.provider, ''),
            'ref', coalesce(v_payment.provider_ref, '')
          );
          delete from public.admin_outbox
           where dedupe_key = 'session_paid:' || v_payment.id::text and status = 'pending';
        end if;
      end if;

      perform public.enqueue_admin(
        'sessions',
        v_kind,
        v_kind || ':' || new.external_id || ':' || public.booking_version(new),
        v_params
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

notify pgrst, 'reload schema';
