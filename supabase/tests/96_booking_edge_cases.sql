-- =============================================================================
-- Booking edge cases (0058): the anti-squat answer, a coach with no room, the admin booking a
-- payment for the right person (or a payment of the wrong amount), a late confirmation, who has
-- Telegram, and the admin freeing a hold. Run after 95_booking_admin.sql on the same database,
-- with 0058_booking_edge_cases.sql applied.
--
-- What this can get wrong:
--   * the same start picked again inside the window reads as «taken», says no time, or is still
--     offered to that person — or is hidden from everybody else;
--   * a coach with no room link is offered for a new booking, or a move is blocked by it;
--   * the admin books a payment with no account behind it onto the checkout address, ignores the
--     person picked, or does not link the checkout address to that person's account;
--   * a course payment is booked without an explicit length, or a subscription one at all;
--   * `admin_payments` does not say the recorded length;
--   * a payment confirmed after the start sends no confirmation, or one that outlives the session;
--   * `has_telegram` / `my_telegram_linked` say the wrong thing;
--   * a client frees a hold through the admin call, or the admin frees a session.
--
-- Every date is «so many days from today in Moscow», as in 94. Everything created is removed.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

create or replace function pg_temp.as_user(p_id uuid, p_email text, p_role text default 'authenticated')
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', p_role)::text, false);
  execute format('set role %I', p_role);
end $$;
create or replace function pg_temp.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', false);
  set role service_role;
end $$;
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;
create or replace function pg_temp.msk(p_day int, p_time text) returns timestamptz
language sql stable as $$
  select (((now() at time zone 'Europe/Moscow')::date + p_day) + p_time::time)
         at time zone 'Europe/Moscow'
$$;
grant execute on function pg_temp.msk(int, text) to authenticated, service_role;
create or replace function pg_temp.pay(p_ref text) returns uuid
language sql stable security definer as $$
  select id from public.payments where provider_ref = p_ref
$$;
grant execute on function pg_temp.pay(text) to authenticated, service_role;

select pg_temp.as_super();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000058a1', 'edge-anna@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000058b2', 'edge-boris@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000058e5', 'edge-admin@example.com', '{}')
on conflict (id) do nothing;
insert into public.admins (email) values ('edge-admin@example.com') on conflict do nothing;
delete from public.order_throttle where bucket like 'hold:00000000-0000-0000-0000-000000005%';

-- Sergey works 09:00–18:00 on day +3. No room link yet.
select pg_temp.as_user('00000000-0000-0000-0000-0000000058e5', 'edge-admin@example.com');
do $$
declare v_d date := (now() at time zone 'Europe/Moscow')::date;
begin
  perform public.admin_set_availability('sergey', jsonb_build_array(
    jsonb_build_object('weekday', extract(isodow from v_d + 3), 'start', '09:00', 'end', '18:00')
  ));
end $$;
select pg_temp.as_super();
update public.coaches set room_url = null where id = 'sergey';

-- --- a coach with no room link offers no new time --------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000058a1', 'edge-anna@example.com');
do $$ begin
  assert not exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                       pg_temp.msk(4, '00:00'))),
    'a coach with no room link is offered for a new booking';
end $$;
select pg_temp.as_super();
-- A move of a paid session is not blocked by it: the session is Anna's already.
insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at,
                                   timezone, status, source, coach_id, option_id)
values ('edge-anna@example.com', 'forma:edge-move', 'forma:edge-move', pg_temp.msk(3, '15:00'),
        pg_temp.msk(3, '15:30'), 'Europe/Moscow', 'active', 'forma', 'sergey', 'half');
select pg_temp.as_user('00000000-0000-0000-0000-0000000058a1', 'edge-anna@example.com');
do $$ begin
  assert exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00'),
                   (select id from public.my_coach_bookings where status = 'active' limit 1))),
    'a move is blocked by the missing room link';
end $$;
select pg_temp.as_super();
delete from public.coach_bookings where external_id = 'forma:edge-move';
update public.coaches set room_url = 'https://example.com/room-sergey' where id = 'sergey';

-- --- the same start again: «later», with the minutes, and not offered to her ------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000058a1', 'edge-anna@example.com');
do $$ begin
  assert exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:00')),
    'with a room link the coach is offered again';
  assert (select count(*) from public.hold_slot('sergey', 'half', pg_temp.msk(3, '10:00'))) = 1,
    'Anna holds 10:00';
end $$;
select pg_temp.as_super();
-- Twenty-five minutes on: the hold ran out five minutes ago.
update public.coach_bookings
   set created_at = now() - interval '25 minutes', hold_expires_at = now() - interval '5 minutes'
 where email = 'edge-anna@example.com' and status = 'pending';
select pg_temp.as_user('00000000-0000-0000-0000-0000000058a1', 'edge-anna@example.com');
do $$
declare v_detail text;
begin
  begin
    perform public.hold_slot('sergey', 'half', pg_temp.msk(3, '10:00'));
    assert false, 'Anna held 10:00 again inside the window';
  exception when others then
    get stacked diagnostics v_detail = pg_exception_detail;
    assert sqlerrm = 'hold_again_later', 'hold_again_later, got ' || sqlerrm;
    -- 40 minutes of window, 25 gone: 15 left.
    assert v_detail::int between 14 and 16, 'the minutes left, got ' || coalesce(v_detail, 'null');
  end;
  assert not exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                       pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:00')),
    'the start she cannot hold is still offered to her';
  assert exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:30')),
    'her other starts went with it';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000058b2', 'edge-boris@example.com');
do $$ begin
  assert exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:00')),
    'the start is hidden from somebody else';
end $$;
select pg_temp.as_super();
-- The window passed: hers again.
update public.coach_bookings set created_at = now() - interval '41 minutes'
 where email = 'edge-anna@example.com' and starts_at = pg_temp.msk(3, '10:00');
select pg_temp.as_user('00000000-0000-0000-0000-0000000058a1', 'edge-anna@example.com');
do $$ begin
  assert exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:00')),
    'the start came back to her after the window';
  assert (select count(*) from public.hold_slot('sergey', 'half', pg_temp.msk(3, '10:00'))) = 1,
    'Anna holds 10:00 again after the window';
end $$;
select pg_temp.as_super();

-- --- the admin frees a hold ------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000058b2', 'edge-boris@example.com');
do $$
declare v_blocked boolean := false;
begin
  begin
    perform public.admin_release_hold(
      (select id from public.coach_bookings where email = 'edge-anna@example.com' and status = 'pending'));
  exception when others then v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'a client freed somebody''s hold';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000058e5', 'edge-admin@example.com');
do $$
declare v_hold uuid := (select id from public.admin_coach_bookings('holds') b
                        where b.email = 'edge-anna@example.com');
begin
  assert v_hold is not null, 'the hold is in the holds scope';
  perform public.admin_release_hold(v_hold);
  assert not exists (select 1 from public.admin_coach_bookings('holds') b
                     where b.email = 'edge-anna@example.com'), 'the hold is still live';
  begin
    perform public.admin_release_hold(v_hold);
    assert false, 'a released hold was released twice';
  exception when others then
    assert sqlerrm = 'not_found', 'not_found, got ' || sqlerrm;
  end;
end $$;
select pg_temp.as_super();

-- --- book from a payment: the person, and a payment of the wrong amount -----------------------
select pg_temp.as_service();
do $$ begin
  -- Paid from an address nobody signs in with.
  perform public.record_payment('edge-stranger@example.com', 2500, 'EDGE-1', now(), 'session', false, 'prodamus');
  update public.payments set session_option = 'half' where provider_ref = 'EDGE-1';
  -- Paid 2 600 instead of 2 500: the webhook wrote it as an unmatched course payment.
  perform public.record_payment('edge-stranger@example.com', 2600, 'EDGE-2', now(), 'course', false, 'prodamus');
  perform public.record_payment('edge-stranger@example.com', 1990, 'EDGE-3', now(), 'monthly', false, 'prodamus');
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000058e5', 'edge-admin@example.com');
do $$
declare
  v_id  uuid;
  v_row public.coach_bookings%rowtype;
begin
  assert (select session_option from public.admin_payments('sessions') where id = pg_temp.pay('EDGE-1')) = 'half',
    'the journal does not say the recorded length';
  -- Nobody behind the payment, nobody picked: refused, never booked onto the checkout address.
  begin
    perform public.admin_book_from_payment(pg_temp.pay('EDGE-1'), 'sergey', pg_temp.msk(3, '12:00'));
    assert false, 'booked onto an address nobody signs in with';
  exception when others then
    assert sqlerrm = 'person_required', 'person_required, got ' || sqlerrm;
  end;
  begin
    perform public.admin_book_from_payment(pg_temp.pay('EDGE-1'), 'sergey', pg_temp.msk(3, '12:00'),
      p_email => 'not an address');
    assert false, 'booked for a malformed address';
  exception when others then
    assert sqlerrm = 'invalid_email', 'invalid_email, got ' || sqlerrm;
  end;
  -- The person the admin picked.
  v_id := public.admin_book_from_payment(pg_temp.pay('EDGE-1'), 'sergey', pg_temp.msk(3, '12:00'),
    p_email => ' Edge-Boris@Example.com ');
  select * into v_row from public.coach_bookings where id = v_id;
  assert v_row.email = 'edge-boris@example.com', 'the booking is not the picked person''s';
  assert (select bound_email from public.admin_payments('all', 200) where id = pg_temp.pay('EDGE-1'))
         = 'edge-boris@example.com', 'the journal does not say who it went to';

  -- A course payment without a length: refused.
  begin
    perform public.admin_book_from_payment(pg_temp.pay('EDGE-2'), 'sergey', pg_temp.msk(3, '13:00'),
      p_email => 'edge-boris@example.com');
    assert false, 'a course payment was booked with no length';
  exception when others then
    assert sqlerrm = 'not_session', 'not_session, got ' || sqlerrm;
  end;
  -- A subscription payment: refused even with one.
  begin
    perform public.admin_book_from_payment(pg_temp.pay('EDGE-3'), 'sergey', pg_temp.msk(3, '13:00'),
      'half', p_email => 'edge-boris@example.com');
    assert false, 'a subscription payment was booked';
  exception when others then
    assert sqlerrm = 'not_session', 'not_session, got ' || sqlerrm;
  end;
  -- «Это занятие»: the wrong amount, booked with the length the admin says.
  v_id := public.admin_book_from_payment(pg_temp.pay('EDGE-2'), 'sergey', pg_temp.msk(3, '13:00'),
    'hour', p_email => 'edge-boris@example.com');
  assert (select ends_at - starts_at from public.coach_bookings where id = v_id) = interval '1 hour',
    'the length the admin said';
end $$;
select pg_temp.as_super();
do $$
declare v_pay public.payments%rowtype;
begin
  select * into v_pay from public.payments where provider_ref = 'EDGE-2';
  assert v_pay.applied and v_pay.intent = 'session' and v_pay.session_option = 'hour',
    'the wrong-amount payment is not a session in the journal';
  assert (select user_id from public.payment_emails where email = 'edge-stranger@example.com')
         = '00000000-0000-0000-0000-0000000058b2',
    'the checkout address was not linked to the picked account';
end $$;

-- --- a confirmation that arrives after the start ------------------------------------------------
insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at,
                                   timezone, status, source, coach_id, option_id, join_url)
values ('edge-anna@example.com', 'forma:edge-late', 'forma:edge-late', now() - interval '5 minutes',
        now() + interval '25 minutes', 'Europe/Moscow', 'active', 'forma', 'sergey', 'half',
        'https://example.com/room-sergey');
do $$
declare v_msg public.telegram_outbox%rowtype;
begin
  select * into v_msg from public.telegram_outbox
  where kind = 'session_confirmed'
    and dedupe_key = 'session_confirmed:' || (select id from public.coach_bookings
                                              where external_id = 'forma:edge-late')::text;
  assert found, 'a session confirmed after its start sent nothing';
  assert v_msg.expires_at <= now() + interval '26 minutes',
    'the late confirmation outlives the session: ' || v_msg.expires_at::text;
end $$;

-- --- who has Telegram ------------------------------------------------------------------------------
update public.profiles set telegram_id = 5800001 where email = 'edge-anna@example.com';
select pg_temp.as_user('00000000-0000-0000-0000-0000000058a1', 'edge-anna@example.com');
do $$ begin
  assert public.my_telegram_linked(), 'Anna has Telegram';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000058b2', 'edge-boris@example.com');
do $$ begin
  assert not public.my_telegram_linked(), 'Boris has no Telegram';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000058e5', 'edge-admin@example.com');
do $$ begin
  assert (select has_telegram from public.admin_coach_bookings('upcoming') b
          where b.email = 'edge-anna@example.com' limit 1), 'Anna''s row says no Telegram';
  assert not (select has_telegram from public.admin_coach_bookings('upcoming') b
              where b.email = 'edge-boris@example.com' limit 1), 'Boris''s row says Telegram';
end $$;
select pg_temp.as_super();

-- --- clean up -----------------------------------------------------------------------------
do $$
begin
  update public.profiles set telegram_id = null where email like 'edge-%';
  delete from public.coach_bookings where email like 'edge-%';
  delete from public.telegram_outbox where email like 'edge-%';
  delete from public.admin_outbox where params ->> 'email' like 'edge-%';
  delete from public.payments where provider_ref like 'EDGE-%' or email like 'edge-%';
  delete from public.payment_emails where email like 'edge-%';
  delete from public.coach_availability;
  delete from public.coach_availability_exceptions;
  update public.coaches set room_url = null;
  delete from public.admins where email = 'edge-admin@example.com';
  delete from public.order_throttle where bucket like 'hold:00000000-0000-0000-0000-000000005%';
end $$;

select 'ALL TESTS PASSED';
