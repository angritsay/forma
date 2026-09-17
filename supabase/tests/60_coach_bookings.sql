-- =============================================================================
-- Coach bookings (0014): ingestion, idempotency, reschedule, cancellation, and the RLS that
-- decides who may read a booking.
--
-- Run after 10_smoke.sql on the same database, with 0014_coach_bookings.sql applied.
--
-- The point of most of this file is the last section. A booking row is filed under an email
-- address that anybody can type into Calendly's form, so the question "who can read this row" is
-- the whole security model: the person whose confirmed address it is, and the coach. Nobody else,
-- and no signed-in user may write one at all.
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
  ('00000000-0000-0000-0000-000000000060', 'lena.booking@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000061', 'igor.booking@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000062', 'coach.booking@example.com', '{}')
on conflict (id) do nothing;
insert into public.admins (email) values ('coach.booking@example.com') on conflict do nothing;
grant select on public.coach_bookings to service_role;

-- Ingestion ------------------------------------------------------------------------
select pg_temp.as_service();
do $$
declare
  v_first  uuid;
  v_again  uuid;
  v_moved  uuid;
  v_row    public.coach_bookings%rowtype;
  v_count  int;
begin
  v_first := public.apply_coach_booking(
    ' Lena.Booking@Example.com ',
    'https://api.calendly.com/scheduled_events/EV1/invitees/IN1',
    'https://api.calendly.com/scheduled_events/EV1',
    '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z',
    'Europe/Moscow',
    'https://example.com/j/1',
    'zoom_conference', null,
    'https://calendly.com/cancellations/IN1',
    'https://calendly.com/reschedulings/IN1',
    'Персональная тренировка', null, 'calendly_webhook');
  assert v_first is not null, 'a booking is recorded';

  select * into v_row from public.coach_bookings where id = v_first;
  assert v_row.email = 'lena.booking@example.com', 'the address is normalised like every other one';
  assert v_row.status = 'active', 'a new booking is active';
  assert v_row.join_url = 'https://example.com/j/1', 'the join link is kept';

  -- The same delivery again: Calendly retries, and a retry must not make a second session.
  v_again := public.apply_coach_booking(
    'lena.booking@example.com',
    'https://api.calendly.com/scheduled_events/EV1/invitees/IN1',
    'https://api.calendly.com/scheduled_events/EV1',
    '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z',
    'Europe/Moscow', 'https://example.com/j/1', 'zoom_conference', null, null, null, null, null,
    'calendly_webhook');
  assert v_again = v_first, 'a repeated delivery writes the same row';
  select count(*) into v_count from public.coach_bookings where email = 'lena.booking@example.com';
  assert v_count = 1, 'still one booking, got ' || v_count;

  -- A reschedule: a new invitee that names the one it replaces. One session, moved.
  v_moved := public.apply_coach_booking(
    'lena.booking@example.com',
    'https://api.calendly.com/scheduled_events/EV2/invitees/IN2',
    'https://api.calendly.com/scheduled_events/EV2',
    '2026-03-12T10:00:00Z', '2026-03-12T10:30:00Z',
    'Europe/Moscow', 'https://example.com/j/2', 'zoom_conference', null, null, null, null,
    'https://api.calendly.com/scheduled_events/EV1/invitees/IN1', 'calendly_webhook');
  assert v_moved = v_first, 'a reschedule moves the existing row, not a new one';
  select count(*) into v_count from public.coach_bookings where email = 'lena.booking@example.com';
  assert v_count = 1, 'a reschedule never adds a second booking, got ' || v_count;

  select * into v_row from public.coach_bookings where id = v_first;
  assert v_row.starts_at = '2026-03-12T10:00:00Z', 'the new time won';
  assert v_row.external_id like '%IN2', 'the row now carries the new booking id';
  assert v_row.previous_external_id like '%IN1', 'and remembers the one it replaced';
  assert v_row.status = 'active', 'a rescheduled session is still on';

  -- A reschedule whose first half we never saw: recorded on its own rather than lost.
  perform public.apply_coach_booking(
    'igor.booking@example.com',
    'https://api.calendly.com/scheduled_events/EV9/invitees/IN9',
    'https://api.calendly.com/scheduled_events/EV9',
    '2026-03-20T10:00:00Z', '2026-03-20T11:00:00Z',
    null, null, null, null, null, null, null,
    'https://api.calendly.com/scheduled_events/EV8/invitees/IN8', 'calendly_webhook');
  select count(*) into v_count from public.coach_bookings where email = 'igor.booking@example.com';
  assert v_count = 1, 'an unknown predecessor still records the booking, got ' || v_count;
end $$;

-- What the ingestion path refuses ----------------------------------------------------
do $$ declare v_err text; begin
  begin
    perform public.apply_coach_booking('x@example.com', 'uri', 'ev',
      '2026-03-11T07:00:00Z', '2026-03-11T06:00:00Z');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_times', 'a session cannot end before it starts, got ' || v_err;
  end;
  begin
    perform public.apply_coach_booking('x@example.com', '  ', 'ev',
      '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_external_id', 'a booking needs the provider''s id, got ' || v_err;
  end;
  begin
    perform public.apply_coach_booking('x@example.com', 'uri2', 'ev',
      '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z', null, null, null, null, null, null, null,
      null, 'Not A Source');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_source', 'a source is a slug, not free text, got ' || v_err;
  end;
  -- A link that is not https never reaches the column, so it can never reach an anchor.
  begin
    perform public.apply_coach_booking('x@example.com', 'uri3', 'ev',
      '2026-03-11T06:00:00Z', '2026-03-11T07:00:00Z', null, 'javascript:alert(1)');
    raise exception 'should have failed';
  exception when check_violation then
    null;
  end;
end $$;

-- Cancellation ----------------------------------------------------------------------
do $$
declare
  v_id     uuid;
  v_row    public.coach_bookings%rowtype;
  v_count  int;
begin
  v_id := public.cancel_coach_booking(
    'https://api.calendly.com/scheduled_events/EV9/invitees/IN9', 'заболел');
  assert v_id is not null, 'the cancellation found the booking';

  select * into v_row from public.coach_bookings where id = v_id;
  assert v_row.status = 'cancelled', 'the booking is cancelled';
  assert v_row.cancel_reason = 'заболел', 'the reason is kept';
  select count(*) into v_count from public.coach_bookings where id = v_id;
  assert v_count = 1, 'a cancellation never deletes the row';

  -- A cancellation for something we never recorded is not an error to retry.
  assert public.cancel_coach_booking('https://api.calendly.com/scheduled_events/ZZ/invitees/ZZ')
         is null, 'an unknown booking cancels to null';

  -- A repeated `invitee.created` must not bring a cancelled session back to life.
  perform public.apply_coach_booking(
    'igor.booking@example.com',
    'https://api.calendly.com/scheduled_events/EV9/invitees/IN9',
    'https://api.calendly.com/scheduled_events/EV9',
    '2026-03-20T10:00:00Z', '2026-03-20T11:00:00Z');
  select * into v_row from public.coach_bookings where id = v_id;
  assert v_row.status = 'cancelled', 'a replayed booking does not resurrect a cancellation';
end $$;

-- Who may read a booking --------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000060', 'lena.booking@example.com');
do $$ declare v_count int; begin
  select count(*) into v_count from public.my_coach_bookings;
  assert v_count = 1, 'a signed-in person sees their own booking, got ' || v_count;

  select count(*) into v_count from public.coach_bookings;
  assert v_count = 1, 'and through the table, still only their own, got ' || v_count;

  select count(*) into v_count from public.coach_bookings
   where email = 'igor.booking@example.com';
  assert v_count = 0, 'somebody else''s booking is invisible, got ' || v_count;
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-000000000061', 'igor.booking@example.com');
do $$ declare v_count int; begin
  select count(*) into v_count from public.my_coach_bookings;
  assert v_count = 1, 'the other person sees exactly their own, got ' || v_count;
  select count(*) into v_count from public.coach_bookings
   where email = 'lena.booking@example.com';
  assert v_count = 0, 'and not the first person''s, got ' || v_count;
end $$;

-- A confirmed address is the only identity. A row filed under an address nobody holds is inert.
select pg_temp.as_super();
do $$ begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', false);
  perform public.apply_coach_booking('stranger@example.com',
    'https://api.calendly.com/scheduled_events/EVX/invitees/INX',
    'https://api.calendly.com/scheduled_events/EVX',
    '2026-04-01T06:00:00Z', '2026-04-01T07:00:00Z');
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000060', 'stranger@example.com');
do $$ declare v_count int; begin
  -- The claim says stranger@example.com; auth.uid() says otherwise, and auth.uid() decides.
  select count(*) into v_count from public.coach_bookings where email = 'stranger@example.com';
  assert v_count = 0, 'claiming an address in the JWT does not grant its bookings, got ' || v_count;
end $$;

-- The coach sees everything.
select pg_temp.as_user('00000000-0000-0000-0000-000000000062', 'coach.booking@example.com');
do $$ declare v_count int; begin
  select count(*) into v_count from public.coach_bookings;
  assert v_count >= 3, 'the coach reads every booking, got ' || v_count;
end $$;

-- Nobody signed in may write a booking, not even their own -----------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000060', 'lena.booking@example.com');
do $$ declare v_err text; v_count int; begin
  begin
    insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at)
    values ('lena.booking@example.com', 'forged', 'ev',
            '2026-05-01T06:00:00Z', '2026-05-01T07:00:00Z');
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;
  end;

  -- An update finds no row it is allowed to touch: the read policy is select-only.
  update public.coach_bookings set starts_at = '2030-01-01T00:00:00Z';
  get diagnostics v_count = row_count;
  assert v_count = 0, 'a signed-in person cannot move their own booking, got ' || v_count;

  delete from public.coach_bookings;
  get diagnostics v_count = row_count;
  assert v_count = 0, 'nor delete it, got ' || v_count;

  -- And the ingestion functions are not theirs to call.
  begin
    perform public.apply_coach_booking('lena.booking@example.com', 'forged2', 'ev',
      '2026-05-01T06:00:00Z', '2026-05-01T07:00:00Z');
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public.cancel_coach_booking('https://api.calendly.com/scheduled_events/EV2/invitees/IN2');
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;
  end;
end $$;

select pg_temp.as_super();
\echo 'ALL TESTS PASSED'
