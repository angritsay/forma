-- =============================================================================
-- 0058 — booking edge cases: what happens to a session when something is not quite right.
--
-- 0055 and 0056 made the happy path work. Walking the unhappy ones found these:
--
--   1. **The same start picked again inside the anti-squat window** was answered as a taken slot,
--      so the screen said «Это время только что заняли» about a time nobody else had. `hold_slot`
--      now says `hold_again_later` with the minutes left, and `available_slots` stops offering that
--      start to that person until then.
--   2. **A coach with no room link** was bookable: the client paid and got a session with no way
--      in. `available_slots` offers no new time for such a coach (a move keeps working — the
--      session is paid for already).
--   3. **The admin booked a paid session for the wrong person.** `admin_book_from_payment` took the
--      checkout address when no account stood behind the payment. It takes `p_email` now, the
--      person the admin picked, and refuses (`person_required`) when there is neither.
--   4. **A payment of the wrong amount** is written as an unmatched course payment (the webhook
--      cannot tell what it was for). The admin can book it as a session with an explicit length
--      («Это занятие»); the journal then calls it a session.
--   5. **The admin could not see the recorded length** of a session payment, and guessed it from
--      the amount. `admin_payments` returns `session_option`.
--   6. **A late confirmation said nothing.** A payment confirmed after the start (the webhook was
--      slow, the admin booked it during the session) queued no `session_confirmed`. It is queued
--      while the session is still running, and lives until its end.
--   7. **Nobody could tell who gets bot messages.** `admin_coach_bookings` says whether the client
--      has Telegram linked; `my_telegram_linked()` tells the client themselves.
--   8. **A hold the admin could not end.** `admin_release_hold` frees a live hold («Освободить»),
--      for a client who wrote that they changed their mind.
--
-- Requires 0026, 0044, 0055, 0056. Idempotent: every function is `create or replace`, and the
-- ones whose signature or return type changes are dropped first and granted again as before.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The anti-squat window, as a question: when may this address hold this start again?
--
-- `hold_slot` (0055) lets an address hold one start for one hold time per twice that time. The
-- start becomes holdable again once every hold of it the address made in the window has aged out
-- of it, so the answer is the latest such hold plus twice the hold time; null when nothing
-- stands in the way, or when the first hold of the window still has time left (that is what the
-- next pick gets).
-- -----------------------------------------------------------------------------
create or replace function public.booking_hold_again_at(
  p_email     citext,
  p_coach     text,
  p_starts_at timestamptz
)
returns timestamptz
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select case
           when min(b.created_at) + public.booking_hold_time() <= now()
             then max(b.created_at) + 2 * public.booking_hold_time()
         end
  from public.coach_bookings b
  where b.email = p_email and b.source = 'forma' and b.coach_id = p_coach
    and b.starts_at = p_starts_at
    and b.status in ('pending', 'expired')
    and b.created_at > now() - 2 * public.booking_hold_time();
$$;

revoke execute on function public.booking_hold_again_at(citext, text, timestamptz)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. available_slots — the text of 0056 plus two filters for a new booking.
--
-- A coach without a room link offers nothing new: a paid session with no way into it is worse
-- than «напиши тренеру». And a start the caller may not hold again yet (§1) is not offered to
-- them. Neither applies to a move (`p_ignore_booking`): that session is paid for, and a move takes
-- no hold.
-- -----------------------------------------------------------------------------
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
  v_email  citext;
begin
  -- A coach the caller may not book has no free time for them (her card is not shown either).
  if not public.booking_coach_visible(p_coach) then
    return;
  end if;
  -- Without claims (the service role, a test) there is no caller's email, and nothing to filter.
  begin
    v_email := public.current_email();
  exception when others then
    v_email := null;
  end;
  if p_ignore_booking is not null and v_email is not null then
    select b.id into v_ignore from public.coach_bookings b
    where b.id = p_ignore_booking
      and b.email = v_email
      and b.status = 'active'
      and b.coach_id = p_coach;
  end if;
  if v_ignore is null
     and not exists (select 1 from public.coaches c where c.id = p_coach and c.room_url is not null) then
    return;
  end if;
  return query
  select s.starts_at, s.ends_at
  from public.booking_slots(p_coach, p_option, p_from, p_to, v_ignore) s
  where v_ignore is not null
     or v_email is null
     or public.booking_hold_again_at(v_email, p_coach, s.starts_at) is null;
end;
$$;

revoke execute on function public.available_slots(text, text, timestamptz, timestamptz, uuid)
  from public, anon;
grant execute on function public.available_slots(text, text, timestamptz, timestamptz, uuid)
  to authenticated, service_role;

comment on function public.available_slots(text, text, timestamptz, timestamptz, uuid) is
  'Free starts of a coach for half or hour (0055, 0056, 0058): weekly rules, then exceptions, minus bookings and live holds, lead time, 30-minute grid, 60 days. A new booking needs the coach''s room link and skips starts the caller may not hold again yet. p_ignore_booking = the caller''s own session being moved.';

-- -----------------------------------------------------------------------------
-- 3. hold_slot — the text of 0055 with the anti-squat answer said out loud.
--
-- The window itself is unchanged. What changes is the answer: `hold_again_later`, with the whole
-- minutes left in the error's DETAIL, instead of the empty «slot taken» — the person is the one
-- who held it, and telling them somebody else took it was false. It is checked before the
-- counter, and an error rolls the counter back anyway: this answer takes no slot and says nothing
-- about anybody else's, so it costs nothing to ask.
-- -----------------------------------------------------------------------------
create or replace function public.hold_slot(p_coach text, p_option text, p_starts_at timestamptz)
returns table (id uuid, coach_id text, option_id text, starts_at timestamptz, ends_at timestamptz,
               hold_expires_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c_window constant interval := interval '1 hour';
  c_max    constant int := 20;
  v_uid    uuid := auth.uid();
  v_email  citext := public.current_email();
  v_coach  public.coaches%rowtype;
  v_min    int;
  v_hits   int;
  v_old    uuid;
  v_until  timestamptz;
  v_again  timestamptz;
  v_id     uuid := gen_random_uuid();
begin
  if v_uid is null or v_email is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  v_min := public.booking_option_minutes(p_option);

  -- Nastia is bookable exactly where her card is shown: with the flag (0049), or for an admin.
  select * into v_coach from public.coaches c where c.id = p_coach and c.active;
  if not found or not public.booking_coach_visible(p_coach) then
    raise exception 'coach_unavailable' using errcode = 'P0001';
  end if;

  -- The same pick again (a reload, a double tap) is the hold the person has, not a fresh one.
  return query
  select b.id, b.coach_id, b.option_id, b.starts_at, b.ends_at, b.hold_expires_at
  from public.coach_bookings b
  where b.email = v_email and b.status = 'pending' and b.hold_expires_at > now()
    and b.coach_id = p_coach and b.option_id = p_option and b.starts_at = p_starts_at;
  if found then
    return;
  end if;

  /*
   * A slot is one address's for one hold time per twice that time (0055): picking the same start
   * every 19 minutes would otherwise keep it from everybody for free. Once the first hold of the
   * window has run out, the start is theirs again only when the window has passed — and they are
   * told when, rather than that somebody took it.
   */
  v_again := public.booking_hold_again_at(v_email, p_coach, p_starts_at);
  if v_again is not null then
    raise exception 'hold_again_later' using errcode = 'P0001',
      detail = greatest(1, ceil(extract(epoch from (v_again - now())) / 60))::int::text;
  end if;

  -- A hold blocks a slot for everybody for 20 minutes, so taking one costs something: the same
  -- sliding window as claim_payment(), per account. A taken slot is an empty answer rather than
  -- an error for this reason: an error would roll the counter back, and probing would be free.
  insert into public.order_throttle as t (bucket, window_start, hits)
  values ('hold:' || v_uid::text, now(), 1)
  on conflict (bucket) do update
  set window_start = case when t.window_start < now() - c_window then now() else t.window_start end,
      hits         = case when t.window_start < now() - c_window then 1 else t.hits + 1 end
  returning hits into v_hits;
  if v_hits > c_max then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  -- What is left of the window's first hold of this start, or a fresh hold time.
  select min(b.created_at) + public.booking_hold_time() into v_until
  from public.coach_bookings b
  where b.email = v_email and b.source = 'forma' and b.coach_id = p_coach
    and b.starts_at = p_starts_at
    and b.status in ('pending', 'expired')
    and b.created_at > now() - 2 * public.booking_hold_time();
  v_until := coalesce(v_until, now() + public.booking_hold_time());

  -- The person's current hold does not stand in the way of their own new pick (30 → 60 at the
  -- same start), and it survives a pick that fails: it goes only when the new one is taken.
  select b.id into v_old from public.coach_bookings b
  where b.email = v_email and b.status = 'pending';
  perform public.booking_sweep_holds(p_coach);

  if not exists (
    select 1 from public.booking_slots(p_coach, p_option, p_starts_at,
                                       p_starts_at + interval '1 minute', v_old) s
    where s.starts_at = p_starts_at
  ) then
    return;  -- slot_taken
  end if;

  begin
    update public.coach_bookings b
       set status = 'expired', cancel_reason = 'released'
     where b.email = v_email and b.status = 'pending';
    insert into public.coach_bookings (
      id, email, external_id, external_event_id, starts_at, ends_at, timezone, status, source,
      coach_id, option_id, hold_expires_at
    ) values (
      v_id, v_email, 'forma:' || v_id::text, 'forma:' || v_id::text, p_starts_at,
      p_starts_at + make_interval(mins => v_min), v_coach.timezone, 'pending', 'forma',
      p_coach, p_option, v_until
    );
  exception when exclusion_violation or unique_violation then
    -- Somebody took it between the check and the insert. The block rolls back to its start, so
    -- the old hold is back as it was.
    return;  -- slot_taken
  end;

  return query
  select b.id, b.coach_id, b.option_id, b.starts_at, b.ends_at, b.hold_expires_at
  from public.coach_bookings b where b.id = v_id;
end;
$$;

revoke execute on function public.hold_slot(text, text, timestamptz) from public, anon;
grant execute on function public.hold_slot(text, text, timestamptz) to authenticated;

comment on function public.hold_slot(text, text, timestamptz) is
  'Hold a free slot for 20 minutes while the client pays (0055, 0058). One live hold per address; a new one replaces it. No row = slot_taken; hold_again_later (DETAIL = minutes) = this address held this start too recently.';

-- -----------------------------------------------------------------------------
-- 4. admin_book_from_payment — the person, and a payment of the wrong amount.
--
-- The text of 0056 with three changes:
--
--   * `p_email`: the person the admin picked (`PersonPicker`). It wins over everything the
--     payment says — the admin has spoken to the client. Without it the client is found as
--     before (the claiming account, else the account the paid address is linked to), and when
--     no account stands behind the payment at all the call is refused (`person_required`):
--     booking the checkout address blind put sessions on addresses nobody signs in with. An
--     address picked for an account with a different checkout address is linked to it, as
--     `admin_bind_payment` does, so the next payment from there finds them.
--   * A course payment that opened nothing (`intent = 'course'`, not applied, not decided) may be
--     booked too, but only with an explicit `p_option`: it is how a session paid at the wrong
--     amount arrives, since the webhook tells a session by its amount. The journal then calls it
--     a session.
--   * The picked address is kept on the payment (`bound_email`), so the journal says who it went
--     to.
--
-- The signature grows, so the 0056 function is dropped and made again with the same grants.
-- Errors: those of 0056, plus person_required · invalid_email.
-- -----------------------------------------------------------------------------
drop function if exists public.admin_book_from_payment(uuid, text, timestamptz, text);

create or replace function public.admin_book_from_payment(
  p_payment_id uuid,
  p_coach      text,
  p_starts_at  timestamptz,
  p_option     text default null,
  p_email      text default null
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
  v_picked  citext;
  v_user    uuid;
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

  v_option := nullif(btrim(coalesce(p_option, '')), '');
  -- A session payment, or a course payment that opened nothing and that the admin says was a
  -- session (the wrong amount). Nothing else: a subscription payment is not a session.
  if v_payment.intent is distinct from 'session'
     and not (v_payment.intent = 'course' and v_option is not null) then
    raise exception 'not_session' using errcode = 'P0001';
  end if;
  if v_payment.applied
     or v_payment.resolution is not null
     or exists (select 1 from public.coach_bookings b where b.payment_id = v_payment.id) then
    raise exception 'already_applied' using errcode = 'P0001';
  end if;

  -- The admin's length is a guess from the amount; the webhook's, when it knew one, is what was
  -- paid for. A different one is refused rather than quietly replaced.
  if v_payment.session_option is not null and v_option is not null
     and v_option is distinct from v_payment.session_option then
    raise exception 'option_mismatch' using errcode = 'P0001';
  end if;
  v_option := coalesce(v_payment.session_option, v_option);
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

  if nullif(btrim(coalesce(p_email, '')), '') is not null then
    v_picked := public.normalize_email(p_email);
  end if;

  select coalesce(
           v_picked,
           (select u.email::citext from auth.users u
            where u.id = v_payment.claimed_by and u.email is not null and u.email <> ''),
           (select u.email::citext from public.payment_emails pe
            join auth.users u on u.id = pe.user_id
            where pe.email = v_payment.email and u.email is not null and u.email <> ''
            limit 1),
           (select pr.email from public.profiles pr where pr.email = v_payment.email limit 1))
    into v_email;
  if v_email is null then
    raise exception 'person_required' using errcode = 'P0001';
  end if;

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

  -- The picked person's account keeps the checkout address, as a bind does (0044).
  if v_picked is not null then
    select pr.id into v_user from public.profiles pr where pr.email = v_picked limit 1;
    if v_user is not null and v_payment.email <> v_picked
       and not exists (select 1 from public.payment_emails e where e.email = v_payment.email) then
      insert into public.payment_emails (user_id, email, linked_by)
      values (v_user, v_payment.email, coalesce(v_payment.provider_ref, 'admin'));
    end if;
  end if;

  update public.payments
     set applied        = true,
         intent         = 'session',
         session_option = v_option,
         bound_email    = coalesce(v_picked, bound_email)
   where id = v_payment.id;
  return v_id;
end;
$$;

revoke execute on function public.admin_book_from_payment(uuid, text, timestamptz, text, text)
  from public, anon;
grant execute on function public.admin_book_from_payment(uuid, text, timestamptz, text, text)
  to authenticated;

comment on function public.admin_book_from_payment(uuid, text, timestamptz, text, text) is
  'Admins only (0056, 0058): book a paid session that matched no hold — coach, start and (p_email) the person picked by the admin; a course payment that opened nothing books with an explicit option. Payment marked applied.';

-- -----------------------------------------------------------------------------
-- 5. admin_payments — the text of 0044 plus `session_option`.
--
-- The length the webhook recorded, so «Записать на время» starts on it instead of guessing from
-- the amount. The return type grows, so the function is dropped and made again.
-- -----------------------------------------------------------------------------
drop function if exists public.admin_payments(text, int, int, uuid);

create or replace function public.admin_payments(
  p_filter text default 'unclaimed',
  p_limit  int  default 50,
  p_offset int  default 0,
  p_id     uuid default null
)
returns table (
  id             uuid,
  email          text,
  amount         numeric,
  currency       text,
  intent         text,
  provider       text,
  provider_ref   text,
  paid_at        timestamptz,
  applied        boolean,
  claimed_at     timestamptz,
  account_email  text,
  resolution     text,
  resolved_at    timestamptz,
  bound_email    text,
  resolve_note   text,
  course_id      text,
  has_account    boolean,
  total          bigint,
  session_option text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_filter text := coalesce(nullif(btrim(p_filter), ''), 'unclaimed');
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_filter not in ('unclaimed', 'all', 'sessions') then
    raise exception 'invalid_filter' using errcode = 'P0001';
  end if;

  return query
  select y.id, y.email::text, y.amount, y.currency, y.intent, y.provider, y.provider_ref,
         y.paid_at, y.applied, y.claimed_at,
         (select pr.email::text from public.profiles pr where pr.id = y.claimed_by),
         y.resolution, y.resolved_at, y.bound_email::text, y.resolve_note,
         (select pu.course_id from public.purchases pu
           where y.provider_ref is not null and pu.provider_ref = y.provider_ref
           limit 1),
         exists (select 1 from public.profiles pr where pr.email = y.email),
         count(*) over (),
         y.session_option
  from public.payments y
  where case
          when p_id is not null then y.id = p_id
          when v_filter = 'unclaimed' then
            not y.applied and y.resolution is null and y.intent <> 'session'
          when v_filter = 'sessions' then y.intent = 'session'
          else true
        end
  order by y.paid_at desc, y.id
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.admin_payments(text, int, int, uuid) is
  'Admin-only: the payments journal, filtered unclaimed / all / sessions, or one row by id (0044, 0058: session_option).';

revoke execute on function public.admin_payments(text, int, int, uuid) from public, anon;
grant execute on function public.admin_payments(text, int, int, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. The client's messages: a confirmation that arrives late still arrives.
--
-- The text of 0055 §11 with one change: `session_confirmed` is queued while the session has not
-- ended (it used to be «while it has not started»), and lives until its end. A payment the
-- webhook confirmed five minutes into the session, or the admin booked for a client already
-- waiting in the room, used to confirm nothing — and the room link is exactly what that client
-- needs. The sender words it for a session already running (telegram-notify/copy.ts).
-- -----------------------------------------------------------------------------
create or replace function public.coach_bookings_notify_client()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_was_active boolean := tg_op = 'UPDATE' and old.status = 'active';
  v_left       interval := new.starts_at - now();
  v_running    interval := new.ends_at - now();
begin
  if new.coach_id is null then
    return new;
  end if;
  begin
    if new.status = 'active' and not v_was_active then
      -- Paid: the confirmation (while the session has not ended) and the reminders.
      if v_running > interval '0' then
        perform public.enqueue_telegram(
          new.email::text, 'session_confirmed', 'session_confirmed:' || new.id::text,
          public.booking_params(new), now(), least(interval '3 days', v_running));
      end if;
      perform public.booking_queue_reminders(new);

    elsif new.status = 'active' and v_was_active and old.starts_at is distinct from new.starts_at then
      perform public.booking_skip_reminders(new.id, 'booking moved');
      if v_left > interval '0' then
        perform public.enqueue_telegram(
          new.email::text, 'session_moved',
          'session_moved:' || new.id::text || ':' || public.booking_version(new),
          public.booking_params(new) || jsonb_build_object('from_starts_at', old.starts_at),
          now(), least(interval '3 days', v_left));
      end if;
      perform public.booking_queue_reminders(new);

    elsif new.status = 'cancelled' and v_was_active then
      perform public.booking_skip_reminders(new.id, 'booking cancelled');
      if v_left > interval '0' then
        perform public.enqueue_telegram(
          new.email::text, 'session_cancelled', 'session_cancelled:' || new.id::text,
          public.booking_params(new) - 'join_url', now(), least(interval '3 days', v_left));
      end if;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Who gets bot messages.
--
-- Every message about a session goes through the bot, and a client who came from the website
-- has never linked it: the confirmation, the reminders and a move all go nowhere. The admin sees
-- it on the row (`has_telegram`), and the client is told on their session card
-- (`my_telegram_linked`). Email reminders need a mail provider, which is the owner's decision.
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
  hold_expires_at timestamptz,
  has_telegram    boolean
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
         b.coach_id, b.option_id, b.hold_expires_at,
         exists (select 1 from public.profiles p
                 where p.email = b.email and p.telegram_id is not null)
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

create or replace function public.my_telegram_linked()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.telegram_id is not null
  );
$$;

revoke execute on function public.my_telegram_linked() from public, anon;
grant execute on function public.my_telegram_linked() to authenticated;

comment on function public.my_telegram_linked() is
  'Whether the caller''s profile has Telegram linked, so the bot can send session messages (0058).';

-- -----------------------------------------------------------------------------
-- 8. admin_release_hold — «Освободить».
--
-- A live hold blocks its slot for everybody for up to 20 minutes. When the client writes that
-- they changed their mind, or the slot is needed for somebody the admin is talking to, the admin
-- frees it the way «Выбрать другое время» does. Errors: not_admin (42501) · not_found (a hold that
-- ran out, was paid or was released meanwhile).
-- -----------------------------------------------------------------------------
create or replace function public.admin_release_hold(p_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.coach_bookings
     set status = 'expired', cancel_reason = 'released_by_admin'
   where id = p_id and status = 'pending' and hold_expires_at > now();
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_release_hold(uuid) from public, anon;
grant execute on function public.admin_release_hold(uuid) to authenticated;

comment on function public.admin_release_hold(uuid) is
  'Admins only (0058): free a live hold, as the client''s «Выбрать другое время» does.';

notify pgrst, 'reload schema';
