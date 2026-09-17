-- =============================================================================
-- Google Calendar bookings: the claim 0014 makes about itself, tested.
--
-- 0014_coach_bookings.sql says it is provider-neutral — that a second ingestion path is "a new
-- caller, never a migration". This file is that claim under load: every value
-- supabase/functions/google-calendar-sync/ actually produces, written through the same two
-- service-role functions, on the schema as merged. If anything here needed a column that does not
-- exist or a constraint that refuses a real Google value, this file is where it fails.
--
-- Run after 10_smoke.sql on the same database, with 0014_coach_bookings.sql applied. Independent
-- of 60_coach_bookings.sql: it makes its own people and counts only its own rows.
--
-- WHAT GOOGLE GIVES US AND WHAT IT DOES NOT
-- -----------------------------------------
--   external_id        'gcal:' + the event id. Unique per calendar, and the idempotency key.
--   external_event_id  the same id, or the series id for an instance of a recurring event.
--   join_url           hangoutLink, i.e. the Meet link. https by construction.
--   location_text      the event's free-form `location`, when there is no conference.
--   timezone           start.timeZone, or the calendar's own zone.
--   cancel_url,
--   reschedule_url     null. Google has no per-booking cancel or reschedule link in its API; the
--                      booker's own links are in the invitation mail and nowhere else. The column
--                      is nullable, the app already renders the button only when the url is there.
--
-- A GOOGLE RESCHEDULE IS NOT A CALENDLY RESCHEDULE
-- ------------------------------------------------
-- Calendly cancels one invitee and creates another, so 0014 has `previous_external_id` to move the
-- row. Google moves the event itself: same id, new times. So the poll passes the same external id
-- with a new start, and the upsert half of apply_coach_booking() moves the row on its own. Proved
-- below, because "the reschedule path we do not use still does the right thing" is exactly the
-- kind of assumption that is wrong.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

create or replace function pg_temp.as_user(p_id uuid, p_email text, p_role text default 'authenticated')
returns void language plpgsql as $$
begin
  -- `sub` is what matters: current_email() resolves through auth.uid(), never through the claim.
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

select pg_temp.as_super();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000063', 'gcal.lena@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000064', 'gcal.igor@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000065', 'gcal.coach@example.com', '{}')
on conflict (id) do nothing;
insert into public.admins (email) values ('gcal.coach@example.com') on conflict do nothing;
grant select on public.coach_bookings to service_role;

-- A booking, exactly as the poll writes one ------------------------------------------------------
select pg_temp.as_service();
do $$
declare
  v_first uuid;
  v_again uuid;
  v_row   public.coach_bookings%rowtype;
  v_count int;
begin
  v_first := public.apply_coach_booking(
    'Lena@Example.com',                                   -- the guest on the calendar event
    'gcal:6f8h2k1m9p4q7r3s5t0v2w',                        -- 'gcal:' + event id
    'gcal:6f8h2k1m9p4q7r3s5t0v2w',                        -- a single event is its own session
    '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z',
    'Europe/Moscow',                                      -- start.timeZone
    'https://meet.google.com/aaa-bbbb-ccc',               -- hangoutLink
    'google_conference', null,
    null, null,                                           -- Google has no cancel/reschedule url
    'Персональная тренировка 60 минут',                   -- summary
    null,                                                 -- never a predecessor: see the header
    'google_calendar');
  assert v_first is not null, 'a Google booking is recorded with no migration';

  select * into v_row from public.coach_bookings where id = v_first;
  assert v_row.email = 'lena@example.com', 'the address is normalised like every other one';
  assert v_row.source = 'google_calendar', 'the source passes the shape check unchanged';
  assert v_row.join_url = 'https://meet.google.com/aaa-bbbb-ccc', 'the Meet link is the join link';
  assert v_row.cancel_url is null and v_row.reschedule_url is null,
    'Google gives no cancel or reschedule link, and the columns accept that';
  assert v_row.status = 'active', 'a new booking is active';

  -- The poll runs every few minutes. Every run sees the same event again.
  v_again := public.apply_coach_booking(
    'lena@example.com', 'gcal:6f8h2k1m9p4q7r3s5t0v2w', 'gcal:6f8h2k1m9p4q7r3s5t0v2w',
    '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z', 'Europe/Moscow',
    'https://meet.google.com/aaa-bbbb-ccc', 'google_conference', null, null, null,
    'Персональная тренировка 60 минут', null, 'google_calendar');
  assert v_again = v_first, 'polling twice writes the same row';
  select count(*) into v_count from public.coach_bookings where email = 'lena@example.com';
  assert v_count = 1, 'and never a second session, got ' || v_count;

  -- A reschedule in Google: the same event, moved. No predecessor id, because there is no
  -- predecessor — the event kept its id.
  perform public.apply_coach_booking(
    'lena@example.com', 'gcal:6f8h2k1m9p4q7r3s5t0v2w', 'gcal:6f8h2k1m9p4q7r3s5t0v2w',
    '2026-03-12T10:00:00Z', '2026-03-12T10:30:00Z', 'Europe/Moscow',
    'https://meet.google.com/aaa-bbbb-ccc', 'google_conference', null, null, null,
    'Персональная тренировка 30 минут', null, 'google_calendar');
  select count(*) into v_count from public.coach_bookings where email = 'lena@example.com';
  assert v_count = 1, 'a reschedule moves the row rather than adding one, got ' || v_count;
  select * into v_row from public.coach_bookings where id = v_first;
  assert v_row.starts_at = '2026-03-12T10:00:00Z', 'the new time won';
  assert v_row.ends_at = '2026-03-12T10:30:00Z', 'and the new length with it';
  assert v_row.event_name = 'Персональная тренировка 30 минут', 'and the new title';

  -- A booking in a room rather than on Meet: text, not a link.
  perform public.apply_coach_booking(
    'gcal.igor@example.com', 'gcal:p1q2r3s4t5u6v7w8x9y0z1', 'gcal:p1q2r3s4t5u6v7w8x9y0z1',
    '2026-03-20T10:00:00Z', '2026-03-20T11:00:00Z', 'Asia/Novosibirsk',
    null, 'physical', 'Зал на Ленина, 5', null, null, 'Тренировка', null, 'google_calendar');
  select * into v_row from public.coach_bookings where external_id = 'gcal:p1q2r3s4t5u6v7w8x9y0z1';
  assert v_row.join_url is null and v_row.location_text = 'Зал на Ленина, 5',
    'a physical location is kept as text';

  -- An instance of a recurring event points at its series, and is still its own booking.
  perform public.apply_coach_booking(
    'gcal.igor@example.com', 'gcal:series77_20260401T060000Z', 'gcal:series77',
    '2026-04-01T06:00:00Z', '2026-04-01T07:00:00Z', 'Europe/Moscow',
    'https://meet.google.com/ddd-eeee-fff', 'google_conference', null, null, null,
    'Тренировка', null, 'google_calendar');
  select count(*) into v_count from public.coach_bookings where email = 'gcal.igor@example.com';
  assert v_count = 2, 'the instance is a booking of its own, got ' || v_count;
end $$;

-- What the schema still refuses, with Google values --------------------------------------------
do $$ declare v_err text; begin
  -- A Meet link is https or it is not a link. `hangoutLink` is https by construction, but the
  -- column is the thing that guarantees nothing else ever reaches an anchor in the app.
  begin
    perform public.apply_coach_booking('x@example.com', 'gcal:bad1', 'gcal:bad1',
      '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z', null, 'javascript:alert(1)',
      null, null, null, null, null, null, 'google_calendar');
    raise exception 'should have failed';
  exception when check_violation then
    null;
  end;

  -- Google allows an event id of up to 1024 characters; the column stops at 400. The sync refuses
  -- such an event before it gets here — this is the backstop, and it is real.
  begin
    perform public.apply_coach_booking('x@example.com', 'gcal:' || repeat('a', 400), 'gcal:x',
      '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z', null, null, null, null, null, null, null,
      null, 'google_calendar');
    raise exception 'should have failed';
  exception when check_violation then
    null;
  end;

  -- The zone comes from Google, but the column is what keeps junk out of Intl on the client.
  begin
    perform public.apply_coach_booking('x@example.com', 'gcal:bad2', 'gcal:bad2',
      '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z', '../../etc/passwd',
      null, null, null, null, null, null, null, 'google_calendar');
    raise exception 'should have failed';
  exception when check_violation then
    null;
  end;
end $$;

-- Cancellation: both of the ways Google has of telling us ---------------------------------------
do $$
declare
  v_row    public.coach_bookings%rowtype;
  v_id     uuid;
  v_count  int;
  v_gone   text[];
begin
  -- 1. The event came back with status 'cancelled'.
  v_id := public.cancel_coach_booking('gcal:p1q2r3s4t5u6v7w8x9y0z1', 'cancelled in google calendar');
  assert v_id is not null, 'the cancellation found the booking';
  select * into v_row from public.coach_bookings where id = v_id;
  assert v_row.status = 'cancelled', 'the booking is cancelled';
  select count(*) into v_count from public.coach_bookings where id = v_id;
  assert v_count = 1, 'a cancellation never deletes the row';

  -- The next poll still sees the cancelled event (showDeleted=true) and cancels it again.
  assert public.cancel_coach_booking('gcal:p1q2r3s4t5u6v7w8x9y0z1') is not null,
    'cancelling twice is not an error';
  select * into v_row from public.coach_bookings where id = v_id;
  assert v_row.status = 'cancelled', 'and does not change anything';

  -- The poll after that no longer sees the event at all, and re-applies nothing. But a *booking*
  -- that Google somehow serves again must not come back to life.
  perform public.apply_coach_booking(
    'gcal.igor@example.com', 'gcal:p1q2r3s4t5u6v7w8x9y0z1', 'gcal:p1q2r3s4t5u6v7w8x9y0z1',
    '2026-03-20T10:00:00Z', '2026-03-20T11:00:00Z', null, null, null, null, null, null, null,
    null, 'google_calendar');
  select * into v_row from public.coach_bookings where id = v_id;
  assert v_row.status = 'cancelled', 'a replayed booking does not resurrect a cancellation';

  -- 2. The event simply stopped being there. This is the query index.ts makes to find out —
  -- everything active in the window, and then whatever the poll did not see gets cancelled.
  select array_agg(external_id order by external_id) into v_gone
    from public.coach_bookings
   where source = 'google_calendar'
     and status = 'active'
     and ends_at > '2026-03-01T00:00:00Z'
     and starts_at < '2026-05-01T00:00:00Z';
  assert v_gone = array['gcal:6f8h2k1m9p4q7r3s5t0v2w', 'gcal:series77_20260401T060000Z'],
    'the reconciliation query sees exactly the live Google bookings, got ' || v_gone::text;

  -- Say the poll listed the whole window and saw only the first of them.
  assert public.cancel_coach_booking('gcal:series77_20260401T060000Z', 'no longer on the calendar')
         is not null, 'a vanished booking is cancelled';
  select count(*) into v_count from public.coach_bookings
   where source = 'google_calendar' and status = 'active';
  assert v_count = 1, 'one Google booking is left standing, got ' || v_count;

  -- A cancellation for an event we never recorded — every ordinary meeting the coach deletes — is
  -- not an error to retry. This is the common case, not the edge case.
  assert public.cancel_coach_booking('gcal:the-coachs-dentist') is null,
    'an unknown event cancels to null';
end $$;

-- Who may read a Google booking ------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000063', 'gcal.lena@example.com');
do $$ declare v_count int; begin
  -- The booking above was filed under lena@example.com; this person's confirmed address is
  -- gcal.lena@example.com. Different address, so nothing — which is the point.
  select count(*) into v_count from public.coach_bookings where email = 'lena@example.com';
  assert v_count = 0, 'a booking for another address is invisible, got ' || v_count;
end $$;

select pg_temp.as_super();
do $$ begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', false);
  perform public.apply_coach_booking(
    'GCal.Lena@Example.com', 'gcal:h7j9k2l4m6n8p0q2r4s6', 'gcal:h7j9k2l4m6n8p0q2r4s6',
    '2026-06-01T06:00:00Z', '2026-06-01T07:00:00Z', 'Europe/Moscow',
    'https://meet.google.com/ggg-hhhh-iii', 'google_conference', null, null, null,
    'Персональная тренировка 60 минут', null, 'google_calendar');
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-000000000063', 'gcal.lena@example.com');
do $$ declare v_count int; v_url text; begin
  select count(*) into v_count from public.my_coach_bookings where status = 'active';
  assert v_count = 1, 'the person who booked sees their own session, got ' || v_count;

  select join_url into v_url from public.my_coach_bookings where status = 'active';
  assert v_url = 'https://meet.google.com/ggg-hhhh-iii', 'and the link to join it';

  select count(*) into v_count from public.coach_bookings
   where external_id = 'gcal:6f8h2k1m9p4q7r3s5t0v2w';
  assert v_count = 0, 'and nobody else''s, got ' || v_count;
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-000000000064', 'gcal.igor@example.com');
do $$ declare v_count int; begin
  select count(*) into v_count from public.coach_bookings
   where external_id = 'gcal:h7j9k2l4m6n8p0q2r4s6';
  assert v_count = 0, 'the other person cannot see it either, got ' || v_count;
end $$;

-- A booking filed under an address nobody holds is inert, and claiming it changes nothing.
select pg_temp.as_super();
do $$ begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', false);
  perform public.apply_coach_booking(
    'walked-in@example.com', 'gcal:z9y8x7w6v5u4t3s2r1q0', 'gcal:z9y8x7w6v5u4t3s2r1q0',
    '2026-06-02T06:00:00Z', '2026-06-02T07:00:00Z', null, null, null, null, null, null, null,
    null, 'google_calendar');
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000063', 'walked-in@example.com');
do $$ declare v_count int; begin
  -- The claim says walked-in@example.com; auth.uid() says otherwise, and auth.uid() decides.
  select count(*) into v_count from public.coach_bookings where email = 'walked-in@example.com';
  assert v_count = 0, 'typing an address into the JWT does not grant its bookings, got ' || v_count;
end $$;

-- The coach reads every booking, whichever scheduler made it.
select pg_temp.as_user('00000000-0000-0000-0000-000000000065', 'gcal.coach@example.com');
do $$ declare v_count int; begin
  select count(*) into v_count from public.coach_bookings where source = 'google_calendar';
  assert v_count >= 5, 'the coach reads every Google booking, got ' || v_count;
end $$;

-- Nobody signed in may run the sync's writes, or forge a Google booking -------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000063', 'gcal.lena@example.com');
do $$ declare v_count int; begin
  begin
    insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at, source)
    values ('gcal.lena@example.com', 'gcal:forged', 'gcal:forged',
            '2026-07-01T06:00:00Z', '2026-07-01T07:00:00Z', 'google_calendar');
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;
  end;

  update public.coach_bookings set starts_at = '2030-01-01T00:00:00Z'
   where external_id = 'gcal:h7j9k2l4m6n8p0q2r4s6';
  get diagnostics v_count = row_count;
  assert v_count = 0, 'a signed-in person cannot move their own booking, got ' || v_count;

  begin
    perform public.apply_coach_booking('gcal.lena@example.com', 'gcal:forged2', 'gcal:forged2',
      '2026-07-01T06:00:00Z', '2026-07-01T07:00:00Z', null, null, null, null, null, null, null,
      null, 'google_calendar');
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public.cancel_coach_booking('gcal:h7j9k2l4m6n8p0q2r4s6');
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;
  end;
end $$;

select pg_temp.as_super();
\echo 'ALL TESTS PASSED'
