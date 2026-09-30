-- =============================================================================
-- Booking admin (0056): a paid session booked by the admin, holds in «Записи», a move over its
-- own old time, the 24-hour rule for the new start, the reminder's life, and one «Занятие
-- оплачено» in the owner's channel. Run after 94_booking_core.sql on the same database, with
-- 0056_booking_admin.sql applied.
--
-- What this can get wrong:
--   * a client books from a payment, or the admin books a payment twice, a course payment, a
--     dismissed one, on top of a session or a live hold, or in the past;
--   * the booked session is not the client's (wrong address), has no room link, is not applied,
--     or never tells the client;
--   * a hold is missing from the `holds` scope, or leaks into the sessions;
--   * `p_ignore_booking` lets anybody see through somebody else's session;
--   * a move lands under 24 hours away;
--   * the hour-before reminder still dies after 55 minutes;
--   * the owner's channel hears about a paid hold twice, or not at all about an unmatched one.
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
-- A payment's id by its order number: the admin never reads `payments` directly (0044).
create or replace function pg_temp.pay(p_ref text) returns uuid
language sql stable security definer as $$
  select id from public.payments where provider_ref = p_ref
$$;
grant execute on function pg_temp.pay(text) to authenticated, service_role;

select pg_temp.as_super();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000056a1', 'bka-anna@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000056b2', 'bka-boris@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000056c3', 'bka-clara@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000056e5', 'bka-admin@example.com', '{}')
on conflict (id) do nothing;
insert into public.admins (email) values ('bka-admin@example.com') on conflict do nothing;
delete from public.order_throttle where bucket like 'hold:00000000-0000-0000-0000-000000005%'
                                     or bucket like 'move:00000000-0000-0000-0000-000000005%'
                                     or bucket like 'claim:00000000-0000-0000-0000-000000005%';

-- Sergey works 09:00–18:00 on days +3 and +4; his room is set.
select pg_temp.as_user('00000000-0000-0000-0000-0000000056e5', 'bka-admin@example.com');
do $$
declare v_d date := (now() at time zone 'Europe/Moscow')::date;
begin
  perform public.admin_save_coach('sergey', p_room_url => 'https://example.com/room-sergey');
  perform public.admin_set_availability('sergey', jsonb_build_array(
    jsonb_build_object('weekday', extract(isodow from v_d + 3), 'start', '09:00', 'end', '18:00'),
    jsonb_build_object('weekday', extract(isodow from v_d + 4), 'start', '09:00', 'end', '18:00')
  ));
end $$;
select pg_temp.as_super();

-- --- one «Занятие оплачено» for a paid hold ------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000056a1', 'bka-anna@example.com');
do $$ begin
  assert (select count(*) from public.hold_slot('sergey', 'hour', pg_temp.msk(3, '10:00'))) = 1,
    'Anna holds 10:00';
end $$;
select pg_temp.as_service();
do $$
declare v_pay uuid;
begin
  v_pay := public.record_payment('bka-anna@example.com', 3500, 'BKA-1', now(), 'session', false, 'prodamus');
  assert exists (select 1 from public.admin_outbox
                 where dedupe_key = 'session_paid:' || v_pay::text and status = 'pending'),
    'the payment queued its line';
  assert public.apply_session_payment('bka-anna@example.com', 'BKA-1', 'hour', now(), v_pay) is not null,
    'the hold is confirmed';
end $$;
select pg_temp.as_super();
do $$
declare
  v_pay uuid := pg_temp.pay('BKA-1');
  v_row record;
begin
  assert not exists (select 1 from public.admin_outbox where dedupe_key = 'session_paid:' || v_pay::text),
    'the payment''s own line is still queued next to the booking''s';
  select * into v_row from public.admin_outbox
  where kind = 'session_booked' and params ->> 'email' = 'bka-anna@example.com';
  assert found, 'no session_booked for a paid hold';
  assert v_row.params ->> 'paymentId' = v_pay::text, 'the booking names its payment';
  assert v_row.params ->> 'amount' = '3500.00' or v_row.params ->> 'amount' = '3500',
    'the booking carries the amount, got ' || coalesce(v_row.params ->> 'amount', 'null');
  assert v_row.params ->> 'provider' = 'prodamus', 'the booking carries the till';
end $$;

-- --- the hour-before reminder lives 90 minutes ------------------------------------------------
do $$
declare v_row public.telegram_outbox%rowtype;
begin
  select * into v_row from public.telegram_outbox
  where email = 'bka-anna@example.com' and kind = 'session_reminder'
    and (params ->> 'hours_before')::int = 1 and status = 'pending';
  assert found, 'no hour-before reminder';
  assert v_row.send_after = pg_temp.msk(3, '09:00'), 'sent an hour before';
  assert v_row.expires_at = pg_temp.msk(3, '10:30'),
    'the hour-before reminder lives 90 minutes, got ' || v_row.expires_at::text;
  assert (select expires_at - send_after from public.telegram_outbox
          where email = 'bka-anna@example.com' and kind = 'session_reminder'
            and (params ->> 'hours_before')::int = 24) = interval '23 hours',
    'the day-before reminder is unchanged';
end $$;

-- --- a move over its own old time, and only 24 hours or more away -----------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000056a1', 'bka-anna@example.com');
do $$
declare v_id uuid := (select id from public.my_coach_bookings where status = 'active');
begin
  assert not exists (select 1 from public.available_slots('sergey', 'hour', pg_temp.msk(3, '00:00'),
                       pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:30')),
    'without the booking ignored, 10:30 overlaps it and is not offered';
  assert exists (select 1 from public.available_slots('sergey', 'hour', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00'), v_id) where starts_at = pg_temp.msk(3, '10:30')),
    'the session being moved does not block its own new time';
  begin
    perform public.move_my_booking(v_id, now() + interval '20 hours');
    assert false, 'a move to under 24 hours away was accepted';
  exception when others then
    assert sqlerrm = 'too_soon', 'too_soon, got ' || sqlerrm;
  end;
  perform public.move_my_booking(v_id, pg_temp.msk(3, '10:30'));
  assert (select starts_at from public.my_coach_bookings where id = v_id) = pg_temp.msk(3, '10:30'),
    'moved half an hour, over its own old time';
end $$;
select pg_temp.as_super();

-- Somebody else's session cannot be seen through.
select pg_temp.as_user('00000000-0000-0000-0000-0000000056b2', 'bka-boris@example.com');
do $$
declare v_anna uuid := (select id from public.coach_bookings where email = 'bka-anna@example.com' and status = 'active');
begin
  assert not exists (select 1 from public.available_slots('sergey', 'hour', pg_temp.msk(3, '00:00'),
                       pg_temp.msk(4, '00:00'), v_anna) where starts_at = pg_temp.msk(3, '10:30')),
    'another client''s booking was ignored for Boris';
end $$;
select pg_temp.as_super();

-- --- holds in «Записи» ------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000056b2', 'bka-boris@example.com');
do $$ begin
  assert (select count(*) from public.hold_slot('sergey', 'half', pg_temp.msk(3, '14:00'))) = 1,
    'Boris holds 14:00';
end $$;
select pg_temp.as_super();
select pg_temp.as_user('00000000-0000-0000-0000-0000000056b2', 'bka-boris@example.com');
do $$
declare v_blocked boolean := false;
begin
  begin
    perform * from public.admin_coach_bookings('holds');
  exception when others then v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'a client reads the holds';
end $$;
select pg_temp.as_super();
select pg_temp.as_user('00000000-0000-0000-0000-0000000056e5', 'bka-admin@example.com');
do $$
declare v_row record;
begin
  select * into v_row from public.admin_coach_bookings('holds') b where b.email = 'bka-boris@example.com';
  assert found, 'a live hold is not in the holds scope';
  assert v_row.status = 'pending', 'a hold says pending';
  assert v_row.coach_id = 'sergey' and v_row.option_id = 'half', 'a hold names its coach and length';
  assert v_row.hold_expires_at > now(), 'a hold says when it ends';
  assert not exists (select 1 from public.admin_coach_bookings('upcoming') b
                     where b.email = 'bka-boris@example.com'),
    'a hold is listed as a session';
  select * into v_row from public.admin_coach_bookings('upcoming') b where b.email = 'bka-anna@example.com';
  assert v_row.coach_id = 'sergey' and v_row.option_id = 'hour', 'a session names its coach and length';
  assert not exists (select 1 from public.admin_coach_bookings('holds') b where b.status <> 'pending'),
    'the holds scope lists something else';
  begin
    perform * from public.admin_coach_bookings('soon');
    assert false, 'an unknown scope was accepted';
  exception when others then
    assert sqlerrm = 'invalid_scope', 'invalid_scope, got ' || sqlerrm;
  end;
end $$;
select pg_temp.as_super();
-- A dead hold is not in the list.
update public.coach_bookings set hold_expires_at = now() - interval '1 minute', created_at = now() - interval '30 minutes'
where email = 'bka-boris@example.com' and status = 'pending';
select pg_temp.as_user('00000000-0000-0000-0000-0000000056e5', 'bka-admin@example.com');
do $$ begin
  assert not exists (select 1 from public.admin_coach_bookings('holds') b where b.email = 'bka-boris@example.com'),
    'an expired hold is still in the holds scope';
end $$;
select pg_temp.as_super();

-- --- a paid session with no time, booked by the admin -----------------------------------------
select pg_temp.as_service();
do $$
declare v_pay uuid;
begin
  -- Paid from an address with no account and no hold: nothing is booked.
  v_pay := public.record_payment('bka-payer@example.com', 2500, 'BKA-2', now(), 'session', false, 'prodamus');
  assert public.apply_session_payment('bka-payer@example.com', 'BKA-2', 'half', now(), v_pay) is null,
    'a payment with no hold booked something';
  -- The unmatched one keeps its own line: nothing else says the money came.
  assert exists (select 1 from public.admin_outbox where dedupe_key = 'session_paid:' || v_pay::text),
    'an unmatched payment lost its session_paid';
  -- A course payment, to be refused.
  perform public.record_payment('bka-payer@example.com', 2990, 'BKA-3', now(), 'course', false, 'prodamus');
  -- A lava.top session whose key named no option: no `session_option` on the row.
  perform public.record_payment('bka-payer@example.com', 39, 'BKA-4', now(), 'session', false, 'lava', 'USD');
end $$;
select pg_temp.as_super();

-- A client cannot book from a payment.
select pg_temp.as_user('00000000-0000-0000-0000-0000000056b2', 'bka-boris@example.com');
do $$
declare v_blocked boolean := false;
begin
  begin
    perform public.admin_book_from_payment(pg_temp.pay('BKA-2'),
      'sergey', pg_temp.msk(4, '10:00'));
  exception when others then v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'a client booked a session from a payment';
end $$;
select pg_temp.as_super();

select pg_temp.as_user('00000000-0000-0000-0000-0000000056e5', 'bka-admin@example.com');
do $$
declare
  v_pay  uuid := pg_temp.pay('BKA-2');
  v_id   uuid;
  v_row  public.coach_bookings%rowtype;
begin
  -- On top of Anna's session (10:30–11:30): refused.
  begin
    perform public.admin_book_from_payment(v_pay, 'sergey', pg_temp.msk(3, '11:00'));
    assert false, 'booked on top of a session';
  exception when others then
    assert sqlerrm = 'slot_taken', 'slot_taken, got ' || sqlerrm;
  end;
  -- In the past: refused.
  begin
    perform public.admin_book_from_payment(v_pay, 'sergey', now() - interval '1 hour');
    assert false, 'booked in the past';
  exception when others then
    assert sqlerrm = 'invalid_times', 'invalid_times, got ' || sqlerrm;
  end;
  -- A course payment: refused.
  begin
    perform public.admin_book_from_payment(pg_temp.pay('BKA-3'),
      'sergey', pg_temp.msk(4, '10:00'));
    assert false, 'a course payment was booked';
  exception when others then
    assert sqlerrm = 'not_session', 'not_session, got ' || sqlerrm;
  end;
  -- No such coach: refused.
  begin
    perform public.admin_book_from_payment(v_pay, 'nobody', pg_temp.msk(4, '10:00'));
    assert false, 'booked with a coach that does not exist';
  exception when others then
    assert sqlerrm = 'coach_unavailable', 'coach_unavailable, got ' || sqlerrm;
  end;
  -- The payment's own length wins over a wrong one passed in.
  v_id := public.admin_book_from_payment(v_pay, 'sergey', pg_temp.msk(4, '10:00'), 'hour');
  select * into v_row from public.coach_bookings where id = v_id;
  assert v_row.status = 'active', 'the booking is active';
  assert v_row.email = 'bka-payer@example.com', 'the booking is the payer''s';
  assert v_row.payment_id = v_pay, 'the booking carries the payment';
  assert v_row.option_id = 'half' and v_row.ends_at = pg_temp.msk(4, '10:30'),
    'the payment''s own length';
  assert v_row.join_url = 'https://example.com/room-sergey' and v_row.location_kind = 'room',
    'the coach''s room is the link';
  assert v_row.source = 'forma' and v_row.coach_id = 'sergey', 'our own row, with its coach';
  -- Twice: refused.
  begin
    perform public.admin_book_from_payment(v_pay, 'sergey', pg_temp.msk(4, '12:00'));
    assert false, 'a payment was booked twice';
  exception when others then
    assert sqlerrm = 'already_applied', 'already_applied, got ' || sqlerrm;
  end;
  -- No length known and none given: refused; with one given, booked.
  begin
    perform public.admin_book_from_payment(pg_temp.pay('BKA-4'),
      'sergey', pg_temp.msk(4, '14:00'));
    assert false, 'booked with no length';
  exception when others then
    assert sqlerrm = 'invalid_option', 'invalid_option, got ' || sqlerrm;
  end;
  perform public.admin_book_from_payment(pg_temp.pay('BKA-4'),
    'sergey', pg_temp.msk(4, '14:00'), 'hour');
end $$;
select pg_temp.as_super();
do $$
declare
  v_pay uuid := pg_temp.pay('BKA-2');
  v_id  uuid := (select id from public.coach_bookings where payment_id = v_pay);
begin
  assert (select applied from public.payments where id = v_pay), 'the payment is applied';
  assert (select session_option from public.payments where provider_ref = 'BKA-4') = 'hour',
    'the length given is written onto the payment';
  assert (select ends_at - starts_at from public.coach_bookings
          where payment_id = pg_temp.pay('BKA-4')) = interval '1 hour',
    'the length given is the booking''s';
  assert exists (select 1 from public.telegram_outbox
                 where kind = 'session_confirmed' and dedupe_key = 'session_confirmed:' || v_id::text
                   and params ->> 'join_url' = 'https://example.com/room-sergey'),
    'the client was not told';
  assert (select count(*) from public.telegram_outbox
          where kind = 'session_reminder' and dedupe_key like 'session_reminder:' || v_id::text || ':%') = 2,
    'no reminders for a session booked from a payment';
  assert exists (select 1 from public.admin_outbox
                 where kind = 'session_booked' and params ->> 'paymentId' = v_pay::text),
    'the owner''s channel did not hear of it';
end $$;

-- A dismissed payment is not booked.
update public.payments set resolution = 'dismissed', resolved_at = now()
where provider_ref = 'BKA-3';
select pg_temp.as_service();
do $$ begin
  perform public.record_payment('bka-payer@example.com', 2500, 'BKA-5', now(), 'session', false, 'prodamus');
end $$;
select pg_temp.as_super();
update public.payments set resolution = 'dismissed', resolved_at = now(), session_option = 'half'
where provider_ref = 'BKA-5';
select pg_temp.as_user('00000000-0000-0000-0000-0000000056e5', 'bka-admin@example.com');
do $$ begin
  perform public.admin_book_from_payment(pg_temp.pay('BKA-5'),
    'sergey', pg_temp.msk(4, '16:00'));
  assert false, 'a dismissed payment was booked';
exception when others then
  assert sqlerrm = 'already_applied', 'already_applied, got ' || sqlerrm;
end $$;
select pg_temp.as_super();

-- A payment claimed by an account books to that account's address.
select pg_temp.as_service();
do $$
declare v_pay uuid;
begin
  v_pay := public.record_payment('bka-clara-card@example.com', 2500, 'BKA-6', now(), 'session', false, 'prodamus');
  assert public.apply_session_payment('bka-clara-card@example.com', 'BKA-6', 'half', now(), v_pay) is null,
    'nothing to confirm yet';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000056c3', 'bka-clara@example.com');
do $$ begin
  assert public.claim_payment('BKA-6') = 'linked', 'Clara claims the payment, with no hold';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000056e5', 'bka-admin@example.com');
do $$
declare v_id uuid;
begin
  v_id := public.admin_book_from_payment(pg_temp.pay('BKA-6'),
    'sergey', pg_temp.msk(4, '12:00'));
  assert (select email from public.coach_bookings where id = v_id) = 'bka-clara@example.com',
    'a claimed payment is booked to the account that claimed it';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000056c3', 'bka-clara@example.com');
do $$ begin
  assert (select count(*) from public.my_coach_bookings where status = 'active') = 1,
    'Clara sees the session the admin booked';
end $$;
select pg_temp.as_super();

-- --- clean up -----------------------------------------------------------------------------
do $$
begin
  delete from public.coach_bookings where email like 'bka-%';
  delete from public.telegram_outbox where email like 'bka-%';
  delete from public.admin_outbox where params ->> 'email' like 'bka-%';
  delete from public.payments where provider_ref like 'BKA-%' or email like 'bka-%';
  delete from public.payment_emails where email like 'bka-%';
  delete from public.coach_availability;
  delete from public.coach_availability_exceptions;
  update public.coaches set room_url = null;
  delete from public.admins where email = 'bka-admin@example.com';
  delete from public.order_throttle where bucket like 'hold:00000000-0000-0000-0000-000000005%'
                                       or bucket like 'move:00000000-0000-0000-0000-000000005%'
                                       or bucket like 'claim:00000000-0000-0000-0000-000000005%';
end $$;

select 'ALL TESTS PASSED';
