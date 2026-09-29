-- =============================================================================
-- Booking core (0055): slots, holds, the overlap constraint, payments, moves, messages.
-- Run after 10_smoke.sql on the same database, with 0055_booking_core.sql applied.
--
-- What this can get wrong:
--   * slots: the weekly rules and the exceptions are applied in the wrong order, the 30-minute
--     grid drifts, touching windows do not merge, the Moscow clock is read as UTC, the lead time
--     or the 60-day horizon is ignored, a booking or a live hold does not block its time;
--   * the same slot is sold twice — through the RPC, or straight into the table;
--   * a hold does not expire, or an expired one keeps its slot;
--   * a payment confirms the wrong hold, confirms twice, or is lost when nothing matches;
--   * a client moves a session later than 24 hours before it, into a taken slot, or somebody
--     else's session; a client cancels;
--   * the messages: no confirmation, reminders at the wrong time, reminders for the old time
--     after a move or a cancellation;
--   * Nastia is bookable without her flag; a coach's address or room link is readable.
--
-- The tests run on the real clock, so every date is «so many days from today in Moscow». Moscow
-- has no daylight saving: 10:00 there is 07:00 UTC on every date, which the slot checks rely on.
-- Everything this suite creates is removed at the end.
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
-- «Day n from today, hh:mm in Moscow» as an instant.
create or replace function pg_temp.msk(p_day int, p_time text) returns timestamptz
language sql stable as $$
  select (((now() at time zone 'Europe/Moscow')::date + p_day) + p_time::time)
         at time zone 'Europe/Moscow'
$$;
grant execute on function pg_temp.msk(int, text) to authenticated, service_role;

select pg_temp.as_super();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000055a1', 'book-anna@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000055b2', 'book-boris@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000055c3', 'book-clara@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000055f6', 'book-eva@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000055f7', 'book-fedor@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000055f8', 'book-gleb@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000055f9', 'book-hana@example.com', '{}')
on conflict (id) do nothing;
insert into public.admins (email) values ('book-admin@example.com') on conflict do nothing;
delete from public.order_throttle where bucket like 'hold:00000000-0000-0000-0000-000000005%'
                                     or bucket like 'move:00000000-0000-0000-0000-000000005%';

-- --- the seed and the privacy of a coach ---------------------------------------------
do $$
begin
  assert (select count(*) from public.coaches where id in ('sergey', 'nastia')) = 2,
    'both coaches are seeded';
  assert (select flag from public.coaches where id = 'nastia') = 'coach_nastia',
    'Nastia is behind her flag';
  assert (select timezone from public.coaches where id = 'sergey') = 'Europe/Moscow',
    'the default zone is Moscow';
  assert not has_column_privilege('anon', 'public.coaches', 'email', 'select'),
    'anon reads a coach''s address';
  assert not has_column_privilege('authenticated', 'public.coaches', 'room_url', 'select'),
    'a signed-in person reads the room link';
  assert has_column_privilege('anon', 'public.coaches', 'name', 'select'), 'the name is public';
end $$;

-- --- only an admin sets a coach up -------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000055a1', 'book-anna@example.com');
do $$
declare v_blocked boolean := false;
begin
  begin
    perform public.admin_save_coach('sergey', p_room_url => 'https://example.com/steal');
  exception when others then v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'a client can change the room link';
  v_blocked := false;
  begin
    insert into public.coach_availability (coach_id, weekday, start_time, end_time)
    values ('sergey', 1, '00:00', '23:00');
  exception when others then v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'a client can write availability';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com');
do $$
declare
  v_d1 date := (now() at time zone 'Europe/Moscow')::date + 4;
begin
  perform public.admin_save_coach('sergey', p_room_url => 'https://example.com/room-sergey');
  perform public.admin_save_coach('nastia', p_room_url => 'https://example.com/room-nastia');
  begin
    perform public.admin_save_coach('sergey', p_room_url => 'javascript:alert(1)');
    assert false, 'a non-https room link must be refused';
  exception when check_violation then null;
  end;
  -- Day +4: 09:00–10:00, with 09:30–10:00 taken off below. Touching rules 15–16 and 16–17.
  -- Day +5: a rule, and the whole day off.
  perform public.admin_set_availability('sergey', jsonb_build_array(
    jsonb_build_object('weekday', extract(isodow from v_d1), 'start', '09:00', 'end', '10:00'),
    jsonb_build_object('weekday', extract(isodow from v_d1), 'start', '15:00', 'end', '16:00'),
    jsonb_build_object('weekday', extract(isodow from v_d1), 'start', '16:00', 'end', '17:00'),
    jsonb_build_object('weekday', extract(isodow from v_d1 + 1), 'start', '09:00', 'end', '12:00')
  ));
  begin
    perform public.admin_set_availability('sergey', '[{"weekday": 8, "start": "09:00", "end": "10:00"}]');
    assert false, 'weekday 8 must be refused';
  exception when others then
    assert sqlerrm = 'invalid_rules', 'bad rules say invalid_rules, got ' || sqlerrm;
  end;
end $$;
select pg_temp.as_super();

-- Exceptions straight into the table, as the admin editor does (RLS: admin write).
select pg_temp.as_user('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com');
insert into public.coach_availability_exceptions (coach_id, date, start_time, end_time, kind) values
  -- Day +3: a lone window 10:00–12:00, and one off the grid, 13:15–14:30.
  ('sergey', (now() at time zone 'Europe/Moscow')::date + 3, '10:00', '12:00', 'extra'),
  ('sergey', (now() at time zone 'Europe/Moscow')::date + 3, '13:15', '14:30', 'extra'),
  ('sergey', (now() at time zone 'Europe/Moscow')::date + 4, '09:30', '10:00', 'off'),
  ('sergey', (now() at time zone 'Europe/Moscow')::date + 5, null, null, 'off'),
  -- Past the 60-day horizon.
  ('sergey', (now() at time zone 'Europe/Moscow')::date + 70, '10:00', '12:00', 'extra');
select pg_temp.as_super();

-- --- slots: rules, exceptions, grid, merge, zone -------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000055a1', 'book-anna@example.com');
do $$
declare
  v_half timestamptz[];
  v_hour timestamptz[];
begin
  -- Day +3, the two extra windows.
  select array_agg(starts_at order by starts_at) into v_half
  from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'), pg_temp.msk(4, '00:00'));
  assert v_half = array[pg_temp.msk(3, '10:00'), pg_temp.msk(3, '10:30'), pg_temp.msk(3, '11:00'),
                        pg_temp.msk(3, '11:30'), pg_temp.msk(3, '13:30'), pg_temp.msk(3, '14:00')],
    'half-hour slots on day +3: ' || coalesce(v_half::text, 'none');
  -- The Moscow clock, with no daylight saving: 10:00 there is 07:00 UTC.
  assert extract(hour from (v_half[1] at time zone 'UTC')) = 7, 'MSK is UTC+3';

  select array_agg(starts_at order by starts_at) into v_hour
  from public.available_slots('sergey', 'hour', pg_temp.msk(3, '00:00'), pg_temp.msk(4, '00:00'));
  assert v_hour = array[pg_temp.msk(3, '10:00'), pg_temp.msk(3, '10:30'), pg_temp.msk(3, '11:00'),
                        pg_temp.msk(3, '13:30')],
    'hour slots on day +3: ' || coalesce(v_hour::text, 'none');
  assert (select ends_at from public.available_slots('sergey', 'hour', pg_temp.msk(3, '00:00'),
            pg_temp.msk(4, '00:00')) order by starts_at limit 1) = pg_temp.msk(3, '11:00'),
    'an hour ends an hour later';

  -- Day +4: the rule 09–10 minus the 09:30 exception; the touching rules 15–16 and 16–17 merge.
  select array_agg(starts_at order by starts_at) into v_half
  from public.available_slots('sergey', 'half', pg_temp.msk(4, '00:00'), pg_temp.msk(4, '12:00'));
  assert v_half = array[pg_temp.msk(4, '09:00')], 'the partial off window: ' || coalesce(v_half::text, 'none');
  assert exists (select 1 from public.available_slots('sergey', 'hour', pg_temp.msk(4, '00:00'),
                   pg_temp.msk(5, '00:00')) where starts_at = pg_temp.msk(4, '15:30')),
    'touching windows merge: an hour at 15:30';
  assert not exists (select 1 from public.available_slots('sergey', 'hour', pg_temp.msk(4, '00:00'),
                   pg_temp.msk(5, '00:00')) where starts_at = pg_temp.msk(4, '16:30')),
    'an hour does not run past the window';

  -- Day +5: the whole day off beats the weekly rule.
  assert not exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(5, '00:00'),
                       pg_temp.msk(6, '00:00'))), 'a day off has no slots';

  -- Past the horizon.
  assert not exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(69, '00:00'),
                       pg_temp.msk(71, '00:00'))), 'nothing past 60 days';

  -- Nastia has no availability at all.
  assert not exists (select 1 from public.available_slots('nastia', 'half')), 'an empty calendar';

  begin
    perform * from public.available_slots('sergey', 'forty', now(), now() + interval '1 day');
    assert false, 'an unknown option must be refused';
  exception when others then
    assert sqlerrm = 'invalid_option', 'invalid_option, got ' || sqlerrm;
  end;
end $$;
select pg_temp.as_super();

-- --- the lead time: today and tomorrow fully open ------------------------------------
insert into public.coach_availability_exceptions (coach_id, date, start_time, end_time, kind) values
  ('sergey', (now() at time zone 'Europe/Moscow')::date, '00:00', '24:00', 'extra'),
  ('sergey', (now() at time zone 'Europe/Moscow')::date + 1, '00:00', '24:00', 'extra');
do $$
declare v_first timestamptz;
begin
  select min(starts_at) into v_first
  from public.available_slots('sergey', 'half', now() - interval '1 day', now() + interval '1 day');
  assert v_first >= now() + interval '15 minutes', 'a slot inside the lead time';
  assert v_first < now() + interval '45 minutes', 'the first slot after the lead time is missing';
  assert extract(minute from v_first) in (0, 30) and extract(second from v_first) = 0,
    'slots sit on the 30-minute grid';
end $$;
delete from public.coach_availability_exceptions
where coach_id = 'sergey' and date <= (now() at time zone 'Europe/Moscow')::date + 1;

-- --- holds ------------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000055a1', 'book-anna@example.com');
do $$
declare v_row record;
begin
  select * into v_row from public.hold_slot('sergey', 'half', pg_temp.msk(3, '10:00'));
  assert v_row.id is not null, 'a hold is made';
  assert v_row.hold_expires_at between now() + interval '19 minutes' and now() + interval '21 minutes',
    'a hold lasts 20 minutes';
  assert (select count(*) from public.my_booking_hold()) = 1, 'the hold is readable by its owner';
  assert not exists (select 1 from public.my_coach_bookings), 'a hold is not a session';
  -- The held time is gone for everybody, and the hour that would overlap it too.
  assert not exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                       pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:00')),
    'a held slot is still offered';
  assert not exists (select 1 from public.available_slots('sergey', 'hour', pg_temp.msk(3, '00:00'),
                       pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:00')),
    'an hour over a held half is still offered';
  -- A time the coach does not offer: no row (slot_taken), and the hold already made stays.
  assert not exists (select 1 from public.hold_slot('sergey', 'half', pg_temp.msk(3, '10:15'))),
    'an off-grid start must be refused';
  assert (select starts_at from public.my_booking_hold()) = pg_temp.msk(3, '10:00'),
    'a failed pick cost the person their hold';
end $$;
select pg_temp.as_super();

-- Somebody else cannot take it — and the refused try still counts against the hourly limit,
-- so probing which slots are held is not free.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055b2', 'book-boris@example.com');
do $$
begin
  assert not exists (select 1 from public.hold_slot('sergey', 'half', pg_temp.msk(3, '10:00'))),
    'a held slot was sold twice';
end $$;
select pg_temp.as_super();
do $$
begin
  assert (select hits from public.order_throttle
          where bucket = 'hold:00000000-0000-0000-0000-0000000055b2') = 1,
    'a refused hold did not count';
end $$;

-- Nor can the table be written around the RPC: the constraint holds on its own.
do $$
begin
  begin
    insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at,
                                       status, source, coach_id, option_id)
    values ('book-boris@example.com', 'forma:direct', 'forma:direct', pg_temp.msk(3, '10:15'),
            pg_temp.msk(3, '10:45'), 'active', 'forma', 'sergey', 'half');
    assert false, 'an overlapping row was accepted';
  exception when exclusion_violation then null;
  end;
  -- Another coach's calendar is another calendar.
  insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at,
                                     status, source, coach_id, option_id, hold_expires_at)
  values ('book-probe@example.com', 'forma:nastia-probe', 'forma:nastia-probe', pg_temp.msk(3, '10:00'),
          pg_temp.msk(3, '10:30'), 'pending', 'forma', 'nastia', 'half', now() + interval '1 minute');
  delete from public.coach_bookings where external_id = 'forma:nastia-probe';
end $$;

-- One hold per address: a new pick replaces the old one.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055a1', 'book-anna@example.com');
do $$ begin perform public.hold_slot('sergey', 'half', pg_temp.msk(3, '11:00')); end $$;
do $$
begin
  assert (select starts_at from public.my_booking_hold()) = pg_temp.msk(3, '11:00'), 'the new hold';
  assert exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '10:00')),
    'the replaced hold still blocks its slot';
end $$;
select pg_temp.as_super();
do $$
begin
  assert (select count(*) from public.coach_bookings
          where email = 'book-anna@example.com' and status = 'pending') = 1, 'one live hold';
  assert (select count(*) from public.coach_bookings
          where email = 'book-anna@example.com' and status = 'expired') = 1, 'the old one expired';
end $$;

-- Expiry: Anna's hold runs out, and Boris takes the slot.
update public.coach_bookings set hold_expires_at = now() - interval '1 second', created_at = now() - interval '30 minutes'
where email = 'book-anna@example.com' and status = 'pending';
select pg_temp.as_user('00000000-0000-0000-0000-0000000055b2', 'book-boris@example.com');
do $$
begin
  assert exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '11:00')),
    'an expired hold still blocks its slot';
  assert (select count(*) from public.my_booking_hold()) = 0, 'Boris has no hold yet';
  perform public.hold_slot('sergey', 'half', pg_temp.msk(3, '11:00'));
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000055a1', 'book-anna@example.com');
do $$
begin
  assert (select count(*) from public.my_booking_hold()) = 0, 'an expired hold is not live';
end $$;
select pg_temp.as_super();
do $$
begin
  assert (select status from public.coach_bookings
          where email = 'book-anna@example.com' and starts_at = pg_temp.msk(3, '11:00')) = 'expired',
    'the dead hold was swept when its slot was taken';
end $$;

-- release_hold
select pg_temp.as_user('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com');
do $$
begin
  perform public.hold_slot('sergey', 'half', pg_temp.msk(3, '13:30'));
  assert public.release_hold(), 'a hold is released';
  assert not public.release_hold(), 'nothing left to release';
  assert exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00')) where starts_at = pg_temp.msk(3, '13:30')),
    'a released slot is free again';
end $$;
select pg_temp.as_super();

-- Nastia: only with the flag.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com');
insert into public.coach_availability_exceptions (coach_id, date, start_time, end_time, kind)
values ('nastia', (now() at time zone 'Europe/Moscow')::date + 3, '10:00', '11:00', 'extra');
select pg_temp.as_user('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com');
do $$
begin
  assert not exists (select 1 from public.available_slots('nastia', 'half', pg_temp.msk(3, '00:00'),
                       pg_temp.msk(4, '00:00'))), 'Nastia''s slots are listed without the flag';
  assert not exists (select 1 from public.coach_availability_exceptions where coach_id = 'nastia'),
    'Nastia''s hours are readable without the flag';
  assert not exists (select 1 from public.coaches where id = 'nastia'),
    'Nastia''s card is readable without the flag';
  begin
    perform public.hold_slot('nastia', 'half', pg_temp.msk(3, '10:00'));
    assert false, 'Nastia was bookable without the flag';
  exception when others then
    assert sqlerrm = 'coach_unavailable', 'coach_unavailable, got ' || sqlerrm;
  end;
end $$;
select pg_temp.as_super();
insert into public.feature_flags (flag, user_id)
values ('coach_nastia', '00000000-0000-0000-0000-0000000055d4') on conflict do nothing;
select pg_temp.as_user('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com');
do $$
begin
  assert exists (select 1 from public.available_slots('nastia', 'half', pg_temp.msk(3, '00:00'),
                   pg_temp.msk(4, '00:00'))), 'with the flag, Nastia''s slots are listed';
  assert exists (select 1 from public.coach_availability_exceptions where coach_id = 'nastia'),
    'with the flag, Nastia''s hours are readable';
  perform public.hold_slot('nastia', 'half', pg_temp.msk(3, '10:00'));
  assert (select coach_id from public.my_booking_hold()) = 'nastia', 'with the flag, Nastia is bookable';
  perform public.release_hold();
end $$;
select pg_temp.as_super();

-- --- payments -------------------------------------------------------------------------
-- A signed-in person cannot confirm anything.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055b2', 'book-boris@example.com');
do $$
declare v_blocked boolean := false;
begin
  begin
    perform public.apply_session_payment('book-boris@example.com', 'x', 'half');
  exception when others then v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'apply_session_payment is open to a signed-in person';
end $$;
select pg_temp.as_super();
do $$
begin
  assert not has_function_privilege('authenticated', 'public.apply_session_payment(text, text, text, timestamptz, uuid)', 'execute'),
    'authenticated can execute apply_session_payment';
  assert has_function_privilege('service_role', 'public.apply_session_payment(text, text, text, timestamptz, uuid)', 'execute'),
    'service_role cannot execute apply_session_payment';
end $$;

-- Boris pays for his live hold at 11:00.
select pg_temp.as_service();
do $$
declare
  v_pay  uuid;
  v_id   uuid;
  v_row  public.coach_bookings%rowtype;
begin
  v_pay := public.record_payment('Book-Boris@example.com', 2500, 'BOOK-1', now(), 'session', false, 'prodamus');
  v_id := public.apply_session_payment('Book-Boris@example.com', 'BOOK-1', 'half');
  assert v_id is not null, 'the live hold is confirmed';
  select * into v_row from public.coach_bookings where id = v_id;
  assert v_row.status = 'active', 'the booking is active';
  assert v_row.payment_id = v_pay, 'the payment is on the booking';
  assert v_row.join_url = 'https://example.com/room-sergey', 'the coach''s room is the link';
  assert v_row.starts_at = pg_temp.msk(3, '11:00'), 'the held time';
  assert (select applied from public.payments where id = v_pay), 'the payment is applied';
  -- The same delivery again.
  assert public.apply_session_payment('book-boris@example.com', 'BOOK-1', 'half') = v_id,
    'a repeated delivery returns the same booking';
  assert (select count(*) from public.coach_bookings where payment_id = v_pay) = 1, 'booked once';
end $$;
select pg_temp.as_super();

do $$
declare v_row record;
begin
  -- The client's messages.
  select * into v_row from public.telegram_outbox
  where email = 'book-boris@example.com' and kind = 'session_confirmed';
  assert found, 'no session_confirmed';
  assert (v_row.params ->> 'starts_at')::timestamptz = pg_temp.msk(3, '11:00'), 'confirmed: starts_at';
  assert (v_row.params ->> 'minutes')::int = 30, 'confirmed: minutes';
  assert v_row.params ->> 'tz' = 'Europe/Moscow', 'confirmed: tz';
  assert v_row.params ->> 'coach' = 'Сергей' and v_row.params ->> 'coach_en' = 'Sergey', 'confirmed: coach';
  assert v_row.params ->> 'join_url' = 'https://example.com/room-sergey', 'confirmed: link';
  assert v_row.params::text not ilike '%@example.com%', 'no address in params';

  assert (select count(*) from public.telegram_outbox
          where email = 'book-boris@example.com' and kind = 'session_reminder' and status = 'pending') = 2,
    'two reminders';
  assert (select send_after from public.telegram_outbox
          where email = 'book-boris@example.com' and kind = 'session_reminder'
            and (params ->> 'hours_before')::int = 24) = pg_temp.msk(2, '11:00'),
    'the day-before reminder';
  assert (select send_after from public.telegram_outbox
          where email = 'book-boris@example.com' and kind = 'session_reminder'
            and (params ->> 'hours_before')::int = 1) = pg_temp.msk(3, '10:00'),
    'the hour-before reminder';
  assert (select expires_at from public.telegram_outbox
          where email = 'book-boris@example.com' and kind = 'session_reminder'
            and (params ->> 'hours_before')::int = 1) < pg_temp.msk(3, '11:00'),
    'a reminder never outlives the start';

  -- The owner's channel: the payment, and the booking once it is paid — not the hold.
  assert exists (select 1 from public.admin_outbox
                 where kind = 'session_booked' and params ->> 'email' = 'book-boris@example.com'
                   and params ->> 'coach' = 'Сергей'),
    'session_booked when the hold is paid';
  assert not exists (select 1 from public.admin_outbox
                     where kind = 'session_booked' and params ->> 'email' in ('book-anna@example.com', 'book-dima@example.com')),
    'a hold is not a booking in the channel';

  -- The person sees it now.
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000055b2', 'book-boris@example.com');
do $$
begin
  assert (select count(*) from public.my_coach_bookings where status = 'active') = 1,
    'the paid session is on the person''s screen';
  assert (select coach_id from public.my_coach_bookings) = 'sergey', 'with its coach';
end $$;
select pg_temp.as_super();

-- A slow payer whose slot is still free is confirmed; one whose slot is gone is not.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055c3', 'book-clara@example.com');
do $$ begin perform public.hold_slot('sergey', 'half', pg_temp.msk(3, '14:00')); end $$;
select pg_temp.as_super();
update public.coach_bookings set hold_expires_at = now() - interval '5 minutes'
where email = 'book-clara@example.com' and status = 'pending';

select pg_temp.as_user('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com');
do $$ begin perform public.hold_slot('sergey', 'half', pg_temp.msk(3, '10:00')); end $$;
select pg_temp.as_super();
update public.coach_bookings set hold_expires_at = now() - interval '5 minutes'
where email = 'book-dima@example.com' and status = 'pending';
-- Anna takes Dima's time, as an hour, after it lapsed.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055a1', 'book-anna@example.com');
do $$ begin perform public.hold_slot('sergey', 'hour', pg_temp.msk(3, '10:00')); end $$;
select pg_temp.as_super();

select pg_temp.as_service();
do $$
declare v_id uuid;
begin
  perform public.record_payment('book-clara@example.com', 2500, 'BOOK-2', now(), 'session', false, 'lava', 'USD');
  v_id := public.apply_session_payment('book-clara@example.com', 'BOOK-2', 'half');
  assert v_id is not null, 'a late payment confirms a slot that is still free';

  perform public.record_payment('book-dima@example.com', 2500, 'BOOK-3', now(), 'session', false, 'prodamus');
  assert public.apply_session_payment('book-dima@example.com', 'BOOK-3', 'half') is null,
    'a late payment for a taken slot books nothing';

  -- Anna holds an hour and pays for half an hour.
  perform public.record_payment('book-anna@example.com', 2500, 'BOOK-4', now(), 'session', false, 'prodamus');
  assert public.apply_session_payment('book-anna@example.com', 'BOOK-4', 'half') is null,
    'the wrong length books nothing';

  -- Somebody pays with no hold at all.
  perform public.record_payment('book-nobody@example.com', 3500, 'BOOK-5', now(), 'session', false, 'prodamus');
  assert public.apply_session_payment('book-nobody@example.com', 'BOOK-5', 'hour') is null,
    'no hold, no booking';
end $$;
select pg_temp.as_super();

do $$
begin
  assert (select status from public.coach_bookings where email = 'book-clara@example.com'
          and starts_at = pg_temp.msk(3, '14:00')) = 'active', 'Clara is booked';
  assert (select applied from public.payments where provider_ref = 'BOOK-3') = false,
    'an unmatched payment stays unapplied';
  assert (select params ->> 'reason' from public.admin_outbox
          where kind = 'session_unmatched' and params ->> 'ref' = 'BOOK-3') = 'slot_taken',
    'the owner is told the slot was taken';
  assert (select params ->> 'reason' from public.admin_outbox
          where kind = 'session_unmatched' and params ->> 'ref' = 'BOOK-4') = 'option_mismatch',
    'the owner is told the wrong length was paid';
  assert (select params ->> 'reason' from public.admin_outbox
          where kind = 'session_unmatched' and params ->> 'ref' = 'BOOK-5') = 'no_hold',
    'the owner is told there was no hold';
  assert (select topic from public.admin_outbox
          where kind = 'session_unmatched' and params ->> 'ref' = 'BOOK-5') = 'sessions',
    'in the sessions topic';
end $$;

-- --- payments: the cases a reviewer broke -------------------------------------------------
-- Day +6 gets a window of its own, so these bookings touch nothing above.
insert into public.coach_availability_exceptions (coach_id, date, start_time, end_time, kind)
values ('sergey', (now() at time zone 'Europe/Moscow')::date + 6, '10:00', '13:00', 'extra');

-- Eva holds 10:00, changes her mind to 10:30, and pays with no order number (Prodamus may send
-- none): the webhook passes the ledger row's id, so the booking points at the payment and the
-- payment is applied. A second payment does not revive the slot she gave up.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f6', 'book-eva@example.com');
do $$
begin
  perform public.hold_slot('sergey', 'half', pg_temp.msk(6, '10:00'));
  perform public.hold_slot('sergey', 'half', pg_temp.msk(6, '10:30'));
end $$;
select pg_temp.as_service();
do $$
declare
  v_pay uuid;
  v_id  uuid;
begin
  v_pay := public.record_payment('book-eva@example.com', 2500, null, now(), 'session', false, 'prodamus');
  v_id := public.apply_session_payment('book-eva@example.com', null, 'half', now(), v_pay);
  assert v_id is not null, 'a payment without an order number books the hold';
  assert (select payment_id from public.coach_bookings where id = v_id) = v_pay,
    'the booking points at the payment';
  assert (select applied from public.payments where id = v_pay), 'the payment is applied';
  assert (select session_option from public.payments where id = v_pay) = 'half',
    'the option is on the payment';

  -- The same payment delivered again (a new ledger row, since there is no number to match).
  v_pay := public.record_payment('book-eva@example.com', 2500, null, now(), 'session', false, 'prodamus');
  assert public.apply_session_payment('book-eva@example.com', null, 'half', now(), v_pay) is null,
    'a second payment booked the slot the client gave up';
  assert (select status from public.coach_bookings
          where email = 'book-eva@example.com' and starts_at = pg_temp.msk(6, '10:00')) = 'expired',
    'the released slot came back to life';
  assert (select params ->> 'reason' from public.admin_outbox
          where kind = 'session_unmatched' and params ->> 'paymentId' = v_pay::text) = 'no_hold',
    'the owner is told the second payment matched nothing';

  -- Neither an id nor a number: nothing to point at, nothing booked.
  assert public.apply_session_payment('book-eva@example.com', null, 'half') is null,
    'a payment with no ledger row booked something';
end $$;
select pg_temp.as_super();

-- Fedor pays from an address already linked to his account (payment_emails): the hold made
-- under his own address is found.
insert into public.payment_emails (user_id, email, linked_by)
values ('00000000-0000-0000-0000-0000000055f7', 'book-fedor-pay@example.com', 'BOOK-test')
on conflict do nothing;
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f7', 'book-fedor@example.com');
do $$ begin perform public.hold_slot('sergey', 'half', pg_temp.msk(6, '11:00')); end $$;
select pg_temp.as_service();
do $$
begin
  perform public.record_payment('book-fedor-pay@example.com', 2500, 'BOOK-6', now(), 'session', false, 'prodamus');
  assert public.apply_session_payment('book-fedor-pay@example.com', 'BOOK-6', 'half') is not null,
    'a payment from a linked address does not find the account''s hold';
end $$;
select pg_temp.as_super();
do $$
begin
  assert (select status from public.coach_bookings
          where email = 'book-fedor@example.com' and starts_at = pg_temp.msk(6, '11:00')) = 'active',
    'Fedor is booked';
end $$;

-- Gleb pays from an address nobody knows yet: nothing is booked. He claims the payment by its
-- number, and the claim confirms his hold.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f8', 'book-gleb@example.com');
do $$ begin perform public.hold_slot('sergey', 'hour', pg_temp.msk(6, '11:30')); end $$;
select pg_temp.as_service();
do $$
begin
  perform public.record_payment('book-gleb-other@example.com', 3500, 'BOOK-7', now(), 'session', false, 'lava', 'RUB');
  assert public.apply_session_payment('book-gleb-other@example.com', 'BOOK-7', 'hour') is null,
    'an unknown address booked somebody''s hold';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f8', 'book-gleb@example.com');
do $$
begin
  assert public.claim_payment('BOOK-7') = 'session', 'the claim did not confirm the hold';
  assert (select count(*) from public.my_coach_bookings where status = 'active') = 1,
    'the claimed session is on Gleb''s screen';
end $$;
select pg_temp.as_super();
do $$
begin
  assert (select b.payment_id = p.id and p.applied
          from public.coach_bookings b, public.payments p
          where b.email = 'book-gleb@example.com' and b.status = 'active' and p.provider_ref = 'BOOK-7'),
    'the claimed payment is on the booking and applied';
end $$;

-- The admin ends a hold: it is not a session, so the client never sees it as a cancelled one,
-- and a payment that arrives afterwards does not bring it back.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com');
do $$ begin perform public.hold_slot('sergey', 'half', pg_temp.msk(6, '12:30')); end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com');
do $$
begin
  perform public.admin_cancel_booking(
    (select id from public.coach_bookings where email = 'book-dima@example.com' and status = 'pending'));
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com');
do $$
begin
  assert not exists (select 1 from public.my_coach_bookings), 'a cancelled hold shows as a session';
  assert not exists (select 1 from public.my_booking_hold()), 'the cancelled hold is still live';
end $$;
select pg_temp.as_service();
do $$
begin
  perform public.record_payment('book-dima@example.com', 2500, 'BOOK-8', now(), 'session', false, 'prodamus');
  assert public.apply_session_payment('book-dima@example.com', 'BOOK-8', 'half') is null,
    'a payment confirmed a hold the admin ended';
end $$;
select pg_temp.as_super();

-- Signed out: Sergey's hours are public, Nastia's are not.
do $$ begin perform set_config('request.jwt.claims', '{"role":"anon"}', false); end $$;
set role anon;
do $$
begin
  assert exists (select 1 from public.coach_availability_exceptions where coach_id = 'sergey'),
    'Sergey''s hours are hidden from a visitor';
  assert not exists (select 1 from public.coach_availability_exceptions where coach_id = 'nastia'),
    'Nastia''s hours are readable signed out';
end $$;
select pg_temp.as_super();

-- --- moves ----------------------------------------------------------------------------
-- Boris (day +3, 11:00, more than 24 hours ahead) moves to day +4 09:00.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055b2', 'book-boris@example.com');
do $$
declare
  v_id uuid := (select id from public.my_coach_bookings where status = 'active');
begin
  begin
    perform public.move_my_booking(v_id, pg_temp.msk(3, '14:00'));
    assert false, 'a move onto a booked slot';
  exception when others then
    assert sqlerrm = 'slot_taken', 'slot_taken, got ' || sqlerrm;
  end;
  begin
    perform public.move_my_booking(v_id, pg_temp.msk(3, '12:00'));
    assert false, 'a move to a time the coach does not offer';
  exception when others then
    assert sqlerrm = 'slot_taken', 'slot_taken, got ' || sqlerrm;
  end;
  perform public.move_my_booking(v_id, pg_temp.msk(3, '11:30'));
  perform public.move_my_booking(v_id, pg_temp.msk(4, '09:00'));
  assert (select starts_at from public.my_coach_bookings where id = v_id) = pg_temp.msk(4, '09:00'),
    'moved';
  -- No self-cancel: the table has no write policy for a client.
  update public.coach_bookings set status = 'cancelled' where id = v_id;
  assert (select status from public.my_coach_bookings where id = v_id) = 'active',
    'a client cancelled their own session';
end $$;
select pg_temp.as_super();

do $$
declare v_id uuid := (select id from public.coach_bookings where email = 'book-boris@example.com' and status = 'active');
begin
  assert (select count(*) from public.telegram_outbox
          where email = 'book-boris@example.com' and kind = 'session_moved') = 2, 'two moves, two messages';
  assert (select (params ->> 'from_starts_at')::timestamptz from public.telegram_outbox
          where email = 'book-boris@example.com' and kind = 'session_moved'
            and (params ->> 'starts_at')::timestamptz = pg_temp.msk(4, '09:00')) = pg_temp.msk(3, '11:30'),
    'the move says where it was';
  assert (select count(*) from public.telegram_outbox
          where email = 'book-boris@example.com' and kind = 'session_reminder' and status = 'pending') = 2,
    'reminders only for the new time';
  assert not exists (select 1 from public.telegram_outbox
                     where email = 'book-boris@example.com' and kind = 'session_reminder'
                       and status = 'pending' and (params ->> 'starts_at')::timestamptz <> pg_temp.msk(4, '09:00')),
    'a reminder for an old time is still pending';
  assert exists (select 1 from public.admin_outbox
                 where kind = 'session_moved' and params ->> 'email' = 'book-boris@example.com'),
    'the owner sees the move';
end $$;

-- Under 24 hours: refused. The session is put 10 hours ahead, as if the clock had moved on.
update public.coach_bookings set starts_at = now() + interval '10 hours', ends_at = now() + interval '10 hours 30 minutes'
where email = 'book-clara@example.com' and status = 'active';
select pg_temp.as_user('00000000-0000-0000-0000-0000000055c3', 'book-clara@example.com');
do $$
declare v_id uuid := (select id from public.my_coach_bookings where status = 'active');
begin
  begin
    perform public.move_my_booking(v_id, pg_temp.msk(4, '15:00'));
    assert false, 'a move under 24 hours was accepted';
  exception when others then
    assert sqlerrm = 'too_late', 'too_late, got ' || sqlerrm;
  end;
end $$;
select pg_temp.as_super();

-- Somebody else's session is not found.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com');
do $$
begin
  begin
    perform public.move_my_booking(
      (select id from public.coach_bookings where email = 'book-boris@example.com' and status = 'active'),
      pg_temp.msk(4, '15:00'));
    assert false, 'somebody else''s session was moved';
  exception when others then
    assert sqlerrm in ('not_found', 'permission denied for table coach_bookings'),
      'not_found, got ' || sqlerrm;
  end;
end $$;
select pg_temp.as_super();

-- --- admin: move and cancel ----------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000055d4', 'book-dima@example.com');
do $$
declare v_blocked boolean := false;
begin
  begin
    perform public.admin_cancel_booking('00000000-0000-0000-0000-000000000000');
  exception when others then v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'a client can use admin_cancel_booking';
end $$;
select pg_temp.as_super();

select pg_temp.as_user('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com');
do $$
declare
  v_clara uuid;
  v_boris uuid;
begin
  -- The RPC reads the table as its owner; the admin also reads it through RLS.
  select id into v_clara from public.coach_bookings where email = 'book-clara@example.com' and status = 'active';
  select id into v_boris from public.coach_bookings where email = 'book-boris@example.com' and status = 'active';
  -- Under 24 hours is the admin's call, and any time the coach agreed to.
  perform public.admin_move_booking(v_clara, now() + interval '2 days 3 hours');
  begin
    perform public.admin_move_booking(v_clara, pg_temp.msk(4, '09:00'));
    assert false, 'the admin moved a session onto another';
  exception when others then
    assert sqlerrm = 'slot_taken', 'slot_taken, got ' || sqlerrm;
  end;
  perform public.admin_cancel_booking(v_boris, 'the client asked');
  assert (select status from public.coach_bookings where id = v_boris) = 'cancelled', 'cancelled';
  -- The admin sees the private columns through the RPC.
  assert (select room_url from public.admin_coaches() where id = 'sergey') = 'https://example.com/room-sergey',
    'admin_coaches returns the room link';
end $$;
select pg_temp.as_super();

do $$
begin
  assert exists (select 1 from public.telegram_outbox
                 where email = 'book-boris@example.com' and kind = 'session_cancelled'
                   and not (params ? 'join_url')), 'the cancellation, without a link';
  assert not exists (select 1 from public.telegram_outbox
                     where email = 'book-boris@example.com' and kind = 'session_reminder' and status = 'pending'),
    'no reminders for a cancelled session';
  assert exists (select 1 from public.admin_outbox
                 where kind = 'session_cancelled' and params ->> 'email' = 'book-boris@example.com'),
    'the owner sees the cancellation';
end $$;

-- There and back again: moved to another day and back, the session still gets its reminders,
-- and only the last move's message is waiting. Separate statements, as separate admin clicks.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com');
do $$ begin perform public.admin_move_booking(
  (select id from public.coach_bookings where email = 'book-fedor@example.com' and status = 'active'),
  pg_temp.msk(8, '11:00')); end $$;
do $$ begin perform public.admin_move_booking(
  (select id from public.coach_bookings where email = 'book-fedor@example.com' and status = 'active'),
  pg_temp.msk(6, '11:00')); end $$;
select pg_temp.as_super();
do $$
begin
  assert (select count(*) from public.telegram_outbox
          where email = 'book-fedor@example.com' and kind = 'session_reminder' and status = 'pending') = 2,
    'a session moved away and back lost its reminders';
  assert not exists (select 1 from public.telegram_outbox
                     where email = 'book-fedor@example.com' and kind = 'session_reminder'
                       and status = 'pending'
                       and (params ->> 'starts_at')::timestamptz <> pg_temp.msk(6, '11:00')),
    'a reminder for the day it was moved away to is pending';
  assert (select count(*) from public.telegram_outbox
          where email = 'book-fedor@example.com' and kind = 'session_moved' and status = 'pending') = 1,
    'two contradictory move messages are waiting';
  assert (select (params ->> 'starts_at')::timestamptz from public.telegram_outbox
          where email = 'book-fedor@example.com' and kind = 'session_moved' and status = 'pending')
         = pg_temp.msk(6, '11:00'), 'the waiting move message names the final time';
end $$;

-- A new room link reaches the sessions already booked.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com');
do $$ begin perform public.admin_save_coach('sergey', p_room_url => 'https://example.com/room-sergey-2'); end $$;
select pg_temp.as_super();
do $$
begin
  assert (select join_url from public.coach_bookings where email = 'book-clara@example.com' and status = 'active')
         = 'https://example.com/room-sergey-2', 'the new link reached a booked session';
  assert (select room_url from public.coaches where id = 'sergey') = 'https://example.com/room-sergey-2',
    'the coach has the new link';
  -- And the messages already queued for it: the trigger does not fire on a link.
  assert exists (select 1 from public.telegram_outbox
                 where email = 'book-clara@example.com' and status = 'pending'
                   and kind in ('session_confirmed', 'session_reminder', 'session_moved')),
    'Clara has messages waiting';
  assert not exists (select 1 from public.telegram_outbox
                     where email = 'book-clara@example.com' and status = 'pending'
                       and kind in ('session_confirmed', 'session_reminder', 'session_moved')
                       and params ->> 'join_url' is distinct from 'https://example.com/room-sergey-2'),
    'a waiting message still points to the old room';
end $$;

-- --- a slot cannot be kept by picking it again ------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f9', 'book-hana@example.com');
do $$
declare
  v_first record;
  v_again record;
begin
  select * into v_first from public.hold_slot('sergey', 'half', pg_temp.msk(4, '16:30'));
  assert v_first.id is not null, 'Hana holds 16:30';
  select * into v_again from public.hold_slot('sergey', 'half', pg_temp.msk(4, '16:30'));
  assert v_again.id = v_first.id and v_again.hold_expires_at = v_first.hold_expires_at,
    'the same pick made a new hold';
end $$;
select pg_temp.as_super();
-- Nineteen minutes on.
update public.coach_bookings
   set created_at = now() - interval '19 minutes', hold_expires_at = now() + interval '1 minute'
 where email = 'book-hana@example.com' and status = 'pending';
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f9', 'book-hana@example.com');
do $$
declare v_row record;
begin
  -- The same start as another length: what is left of the first hold, not a fresh 20 minutes.
  select * into v_row from public.hold_slot('sergey', 'hour', pg_temp.msk(4, '16:00'));
  assert v_row.id is not null, 'Hana moves to another start';
  select * into v_row from public.hold_slot('sergey', 'half', pg_temp.msk(4, '16:30'));
  assert v_row.id is not null, 'Hana comes back to 16:30';
  assert v_row.hold_expires_at <= now() + interval '2 minutes',
    'switching away and back refreshed the hold: ' || v_row.hold_expires_at::text;
end $$;
select pg_temp.as_super();
-- It ran out.
update public.coach_bookings
   set created_at = created_at - interval '2 minutes', hold_expires_at = now() - interval '1 second'
 where email = 'book-hana@example.com' and starts_at = pg_temp.msk(4, '16:30');
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f9', 'book-hana@example.com');
do $$
begin
  assert not exists (select 1 from public.hold_slot('sergey', 'half', pg_temp.msk(4, '16:30'))),
    'Hana held 16:30 again straight after her hold ran out';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000055b2', 'book-boris@example.com');
do $$
begin
  assert exists (select 1 from public.hold_slot('sergey', 'half', pg_temp.msk(4, '16:30'))),
    'somebody else cannot take the slot Hana let go';
  perform public.release_hold();
end $$;
select pg_temp.as_super();
-- Twice the hold time later, it is anybody's again, Hana's too.
update public.coach_bookings set created_at = now() - interval '41 minutes'
 where email = 'book-hana@example.com' and starts_at = pg_temp.msk(4, '16:30');
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f9', 'book-hana@example.com');
do $$
declare v_row record;
begin
  select * into v_row from public.hold_slot('sergey', 'half', pg_temp.msk(4, '16:30'));
  assert v_row.hold_expires_at > now() + interval '19 minutes', 'a fresh hold after the window';
  perform public.release_hold();
end $$;
select pg_temp.as_super();

-- --- a claimed session payment that books nothing stays in the owner's view ----------------
select pg_temp.as_service();
do $$
begin
  perform public.record_payment('book-hana-other@example.com', 2500, 'BOOK-9', now(), 'session', false, 'prodamus', 'RUB');
  assert public.apply_session_payment('book-hana-other@example.com', 'BOOK-9', 'half') is null,
    'a payment with no hold booked something';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000055f9', 'book-hana@example.com');
do $$
begin
  assert public.claim_payment('BOOK-9') = 'linked', 'a claim with no hold still links the address';
  assert public.claim_payment('BOOK-9') = 'not_found', 'the payment was claimed twice';
end $$;
select pg_temp.as_super();
do $$
declare v_pay public.payments%rowtype;
begin
  select * into v_pay from public.payments where provider_ref = 'BOOK-9';
  assert v_pay.claimed_by = '00000000-0000-0000-0000-0000000055f9', 'the claim is recorded';
  assert not v_pay.applied, 'a claim that booked nothing marked the payment applied';
  assert (select params ->> 'email' from public.admin_outbox
          where dedupe_key = 'session_claim_unmatched:' || v_pay.id::text) = 'book-hana@example.com',
    'the owner was not told which account claimed it';
end $$;

-- --- Google rows stay valid, and they are Sergey's busy time -------------------------
select pg_temp.as_service();
do $$
begin
  perform public.apply_coach_booking('book-google@example.com', 'gcal:book-probe', 'gcal:book-probe',
    pg_temp.msk(4, '15:00'), pg_temp.msk(4, '16:00'), 'Europe/Moscow', 'https://meet.google.com/abc',
    null, null, null, null, null, null, 'google_calendar');
end $$;
select pg_temp.as_super();
do $$
begin
  assert (select coach_id from public.coach_bookings where external_id = 'gcal:book-probe') is null,
    'a Google row has no coach';
  assert not exists (select 1 from public.available_slots('sergey', 'half', pg_temp.msk(4, '00:00'),
                       pg_temp.msk(5, '00:00')) where starts_at in (pg_temp.msk(4, '15:00'), pg_temp.msk(4, '15:30'))),
    'a Google booking blocks Sergey''s time';
  assert exists (select 1 from public.admin_outbox
                 where kind = 'session_booked' and params ->> 'email' = 'book-google@example.com'),
    'a Google insert still reaches the channel';
end $$;
-- Nor does the admin put a session on top of one.
select pg_temp.as_user('00000000-0000-0000-0000-0000000055e5', 'book-admin@example.com');
do $$
begin
  perform public.admin_move_booking(
    (select id from public.coach_bookings where email = 'book-fedor@example.com' and status = 'active'),
    pg_temp.msk(4, '15:30'));
  assert false, 'the admin moved a session onto a Google booking';
exception when others then
  assert sqlerrm = 'slot_taken', 'slot_taken, got ' || sqlerrm;
end $$;
select pg_temp.as_super();

-- --- clean up -----------------------------------------------------------------------------
do $$
begin
  delete from public.coach_bookings where email like 'book-%';
  delete from public.telegram_outbox where email like 'book-%';
  delete from public.admin_outbox where params ->> 'email' like 'book-%';
  delete from public.payments where provider_ref like 'BOOK-%' or email like 'book-%';
  delete from public.payment_emails where email like 'book-%';
  delete from public.coach_availability;
  delete from public.coach_availability_exceptions;
  update public.coaches set room_url = null;
  delete from public.feature_flags where user_id = '00000000-0000-0000-0000-0000000055d4';
  delete from public.admins where email = 'book-admin@example.com';
  delete from public.order_throttle where bucket like 'hold:00000000-0000-0000-0000-000000005%'
                                       or bucket like 'move:00000000-0000-0000-0000-000000005%';
end $$;

select 'ALL TESTS PASSED';
