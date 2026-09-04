-- =============================================================================
-- Smoke tests for the Forma schema: triggers, RLS, RPCs, leaderboard, storage policies.
-- Requires supabase/tests/00_shim.sql + the four migrations (see 00_shim.sql header).
-- Runs as a superuser and impersonates anon / authenticated users the way PostgREST does.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

-- Helper: impersonate a user the way PostgREST does.
create or replace function pg_temp.as_user(p_id uuid, p_email text, p_role text default 'authenticated')
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', p_role)::text, false);
  execute format('set role %I', p_role);
end $$;
create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', false);
  set role anon;
end $$;
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;
-- Helper: the request headers PostgREST exposes to create_order() (client IP).
create or replace function pg_temp.from_ip(p_ip text) returns void language plpgsql as $$
begin
  perform set_config('request.headers',
    case when p_ip is null then '' else json_build_object('x-forwarded-for', p_ip)::text end,
    false);
end $$;

-- Users ------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'Ann@Example.com', '{"name": "  Ann  "}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com', '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'coach@example.com', '{"full_name": "Coach"}'),
  ('00000000-0000-0000-0000-00000000000d', 'long@example.com',
   json_build_object('name', repeat('x', 500))::jsonb);

insert into public.admins (email) values ('COACH@example.com');

do $$ begin
  -- trigger created profiles, trimmed name, full_name fallback
  assert (select count(*) from public.profiles) = 4, 'profiles created by trigger';
  assert (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Ann', 'name trimmed';
  assert (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') is null, 'no name → null';
  assert (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'Coach', 'full_name fallback';
  assert (select length(avatar_seed) from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 8, 'avatar seed 8 hex chars';
  -- client-controlled signup metadata is clamped, not stored whole
  assert (select length(display_name) from public.profiles where id = '00000000-0000-0000-0000-00000000000d') = 60,
    'signup name clamped to 60';
  -- email change sync
  update auth.users set email = 'ann2@example.com' where id = '00000000-0000-0000-0000-00000000000a';
  assert (select email::text from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'ann2@example.com', 'email synced';
  update auth.users set email = 'ann@example.com' where id = '00000000-0000-0000-0000-00000000000a';
  raise notice 'OK profiles + triggers';
end $$;

-- The generated catalogue must be loaded (0004_content_seed.sql).
do $$ begin
  assert (select count(*) from public.courses) >= 5, 'courses seeded';
  assert (select count(*) from public.workouts where course_id = 'start') > 0, 'workouts seeded';
  assert (select base_points from public.workouts where course_id = 'start' and id = 'w_squat_push_1') = 100,
    'base points come from content';
  raise notice 'OK content seed';
end $$;

-- Anonymous orders --------------------------------------------------------------
select pg_temp.as_anon();
do $$
declare v1 uuid; v2 uuid; v_err text;
begin
  v1 := public.create_order('  Ann@Example.com ', 'start', 'en', 'landing');
  v2 := public.create_order('ann@example.com', 'start', 'ru', 'course_page');
  assert v1 = v2, 'upsert returns the same id';
  -- validation
  begin
    perform public.create_order('not-an-email', 'start');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_email', 'invalid_email raised, got ' || v_err;
    assert sqlstate = 'P0001', 'P0001 code';
  end;
  begin
    perform public.create_order('ann@example.com', 'Bad Course');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_course', 'invalid_course raised';
  end;
  -- a well-shaped id that is not a real course is rejected too (allowlist)
  begin
    perform public.create_order('ann@example.com', 'not_a_course');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_course', 'unknown course rejected, got ' || v_err;
  end;
  -- anon cannot read purchases at all
  begin
    perform * from public.purchases;
    raise exception 'anon read should fail';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform * from public.my_entitlements;
    raise exception 'anon view read should fail';
  exception when insufficient_privilege then
    null;
  end;
  -- anon has no EXECUTE on anything but create_order (the default Supabase grant
  -- is revoked explicitly, so these fail at the grant, not at an internal guard).
  begin
    perform public.get_leaderboard('week');
    raise exception 'anon leaderboard should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.get_my_totals();
    raise exception 'anon totals should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.is_admin();
    raise exception 'anon is_admin should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.steps_points(9000);
    raise exception 'anon steps_points should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_add_purchase('x@example.com', 'start');
    raise exception 'anon admin rpc should fail';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK anonymous create_order + no reads';
end $$;

-- abuse guard: 10 pending orders
select pg_temp.as_super();
do $$ begin
  assert (select count(*) from public.purchases where course_id = 'not_a_course') = 0, 'no junk row created';
  assert (select count(*) from public.purchases) = 1, 'only ann''s order exists';
end $$;
insert into public.purchases (email, course_id)
  select 'spam@example.com', 'c' || g from generate_series(1, 10) g;
select pg_temp.as_anon();
do $$ declare v_err text; begin
  begin
    perform public.create_order('spam@example.com', 'start');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'too_many_pending', 'abuse guard';
  end;
  raise notice 'OK abuse guard';
end $$;

-- Entitlements + admin -----------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'ann@example.com');
do $$ begin
  assert (select count(*) from public.my_entitlements) = 0, 'pending is not an entitlement';
  -- customers have no read on purchases at all (it carries the coach's note/source)
  assert (select count(*) from public.purchases) = 0, 'owner cannot read purchases';
  assert not public.is_admin(), 'ann is not admin';
  -- non-admin cannot flip status directly
  update public.purchases set status = 'active';
  assert not exists (select 1 from public.purchases where status = 'active'), 'RLS blocks owner update';
  begin
    perform public.admin_set_purchase_status(gen_random_uuid(), 'active');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_add_purchase('ann@example.com', 'engine');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  -- helper functions are not part of the API surface
  begin
    perform public.steps_points(9000);
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.normalize_email('ann@example.com');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK non-admin restrictions';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ declare v_id uuid; v_err text; begin
  assert public.is_admin(), 'coach is admin (case-insensitive)';
  assert (select count(*) from public.admins) = 1, 'admin can read admins';
  assert (select count(*) from public.purchases) = 11, 'admin sees all purchases';
  select id into v_id from public.purchases where email = 'ann@example.com' and course_id = 'start';
  perform public.admin_set_purchase_status(v_id, 'active');
  assert (select status from public.purchases where id = v_id) = 'active';
  assert (select activated_at from public.purchases where id = v_id) is not null, 'activated_at stamped';
  begin
    perform public.admin_set_purchase_status(v_id, 'weird');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_status';
  end;
  begin
    perform public.admin_set_purchase_status(gen_random_uuid(), 'active');
    raise exception 'should have failed';
  exception when no_data_found then null;
  end;
  -- admin_add_purchase and create_order share one email validator
  begin
    perform public.admin_add_purchase('nope@@example.com', 'engine');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_email', 'shared validator, got ' || v_err;
  end;
  perform public.admin_add_purchase('Bob@Example.com', 'kettlebell', ' gift ');
  assert (select status from public.purchases where email = 'bob@example.com' and course_id = 'kettlebell') = 'active';
  assert (select note from public.purchases where email = 'bob@example.com' and course_id = 'kettlebell') = 'gift';
  -- ann gets a second course, so the course filter on the leaderboard has something to filter
  perform public.admin_add_purchase('ann@example.com', 'engine');
  raise notice 'OK admin RPCs';
end $$;

-- An active row is never touched by a new anonymous order; refunded → pending again
select pg_temp.as_super();
create temporary table active_before as
  select id, status, source, locale from public.purchases
  where email = 'ann@example.com' and course_id = 'start';
grant select on active_before to anon, authenticated;
select pg_temp.as_anon();
do $$
declare v_id uuid;
begin
  v_id := public.create_order('ann@example.com', 'start', 'en', 'hijack');
  assert v_id = (select id from active_before), 'same id returned for an active purchase';
  raise notice 'OK re-order';
end $$;
select pg_temp.as_super();
do $$ declare r record; begin
  select status, source, locale into r
  from public.purchases where email = 'ann@example.com' and course_id = 'start';
  assert r.status = 'active', 'active kept';
  assert r.source = 'course_page', 'active row source not overwritten';
  assert r.locale = 'ru', 'active row locale not overwritten';
  update public.purchases set status = 'refunded' where email = 'bob@example.com' and course_id = 'kettlebell';
end $$;
select pg_temp.as_anon();
select public.create_order('bob@example.com', 'kettlebell');
select pg_temp.as_super();
do $$ begin
  assert (select status from public.purchases where email = 'bob@example.com' and course_id = 'kettlebell') = 'pending',
    'refunded → pending';
  raise notice 'OK status transitions';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'ann@example.com');
do $$ begin
  assert (select count(*) from public.my_entitlements) = 2, 'ann entitled to start + engine';
  assert (select count(*) from public.my_entitlements where course_id = 'start') = 1;
  -- the view exposes exactly two columns; the coach's note is not one of them
  assert (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'my_entitlements') = 2, 'view is course_id + activated_at';
  raise notice 'OK my_entitlements';
end $$;

-- Profiles as owner --------------------------------------------------------------
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'own profile only';
  update public.profiles set display_name = 'Annie', locale = 'en', fitness_level = 2, fitness_index = 55,
    training_profile = '{"ageBand":"25-34"}', onboarded_at = now();
  assert (select display_name from public.profiles) = 'Annie';
  assert (select updated_at > created_at from public.profiles), 'updated_at bumped';
  begin
    update public.profiles set email = 'hacker@example.com';
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set locale = 'de';
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  -- size limits: the leaderboard relays these fields to everyone
  begin
    update public.profiles set display_name = repeat('a', 61);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set avatar_seed = repeat('a', 65);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set avatar_seed = 'drop table';
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set training_profile = jsonb_build_object('junk', repeat('a', 9000));
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  -- fallback insert must be own id + own email
  begin
    insert into public.profiles (id, email) values ('00000000-0000-0000-0000-0000000000ff', 'ann@example.com');
    raise exception 'should have failed';
  exception when others then
    assert sqlstate = '42501', 'RLS insert check, got ' || sqlstate;
  end;
  raise notice 'OK profiles RLS + column grants';
end $$;

-- daily_logs points trigger + write window ----------------------------------------
do $$ begin
  insert into public.daily_logs (user_id, local_date, steps, points) values
    ('00000000-0000-0000-0000-00000000000a', current_date - 6, 6999, 999),
    ('00000000-0000-0000-0000-00000000000a', current_date - 5, 7000, 0),
    ('00000000-0000-0000-0000-00000000000a', current_date - 4, 8000, 0),
    ('00000000-0000-0000-0000-00000000000a', current_date - 3, 8999, 0),
    ('00000000-0000-0000-0000-00000000000a', current_date - 2, 13000, 0),
    ('00000000-0000-0000-0000-00000000000a', current_date - 1, 40000, 0);
  assert (select points from public.daily_logs where local_date = current_date - 6) = 0, '6999 → 0';
  assert (select points from public.daily_logs where local_date = current_date - 5) = 30, '7000 → 30';
  assert (select points from public.daily_logs where local_date = current_date - 4) = 35, '8000 → 35';
  assert (select points from public.daily_logs where local_date = current_date - 3) = 35, '8999 → 35';
  assert (select points from public.daily_logs where local_date = current_date - 2) = 60, '13000 → 60';
  assert (select points from public.daily_logs where local_date = current_date - 1) = 60, '40000 → cap 60';
  -- upsert path keeps trigger
  insert into public.daily_logs (user_id, local_date, steps, points)
    values ('00000000-0000-0000-0000-00000000000a', current_date - 6, 9000, 999)
    on conflict (user_id, local_date) do update set steps = excluded.steps, points = excluded.points;
  assert (select points from public.daily_logs where local_date = current_date - 6) = 40, 'upsert recomputed';
  begin
    insert into public.daily_logs (user_id, local_date, steps) values ('00000000-0000-0000-0000-00000000000b', current_date, 100);
    raise exception 'should have failed';
  exception when others then assert sqlstate = '42501', 'cannot log for another user';
  end;
  begin
    insert into public.daily_logs (user_id, local_date, steps) values ('00000000-0000-0000-0000-00000000000a', current_date, 100001);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  -- write window: no backfilling older than a week, no filling the future
  begin
    insert into public.daily_logs (user_id, local_date, steps) values ('00000000-0000-0000-0000-00000000000a', current_date - 8, 20000);
    raise exception 'should have failed';
  exception when others then assert sqlstate = '42501', 'backfill blocked, got ' || sqlstate;
  end;
  begin
    insert into public.daily_logs (user_id, local_date, steps) values ('00000000-0000-0000-0000-00000000000a', current_date + 2, 20000);
    raise exception 'should have failed';
  exception when others then assert sqlstate = '42501', 'future log blocked, got ' || sqlstate;
  end;
  -- tomorrow is allowed (time zones ahead of the server)
  insert into public.daily_logs (user_id, local_date, steps) values ('00000000-0000-0000-0000-00000000000a', current_date + 1, 1000);
  delete from public.daily_logs where local_date = current_date + 1;
  -- and an existing row cannot be moved out of the window either
  begin
    update public.daily_logs set local_date = current_date - 30 where local_date = current_date - 1;
    raise exception 'should have failed';
  exception when others then
    assert sqlstate = '42501', 'moving a log out of the window blocked, got ' || sqlstate;
  end;
  assert (select count(*) from public.daily_logs) = 6, 'six step days';
  raise notice 'OK daily_logs';
end $$;

-- course state, sessions, benchmarks -----------------------------------------------
do $$ declare v_sid uuid; v_err text; begin
  insert into public.user_course_state (user_id, course_id, scale) values ('00000000-0000-0000-0000-00000000000a', 'start', 1.05)
    on conflict (user_id, course_id) do update set scale = excluded.scale;
  insert into public.user_course_state (user_id, course_id, current_node_index, completed_node_ids)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 2, '{n1,n2}')
    on conflict (user_id, course_id) do update set current_node_index = excluded.current_node_index, completed_node_ids = excluded.completed_node_ids;
  assert (select scale from public.user_course_state) = 1.05, 'partial upsert keeps scale';
  assert (select completed_node_ids from public.user_course_state) = '{n1,n2}'::text[];
  begin
    update public.user_course_state set completed_node_ids = array(select 'n' || g from generate_series(1, 501) g);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    update public.user_course_state set completed_node_ids = array[repeat('n', 5000)];
    raise exception 'should have failed';
  exception when check_violation then null;
  end;

  -- session for a course ann does not own
  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, local_date)
      values ('00000000-0000-0000-0000-00000000000a', 'kettlebell', 'n1', 'w_test', current_date);
    raise exception 'should have failed';
  exception when others then assert sqlstate = '42501', 'session without entitlement blocked, got ' || sqlstate;
  end;

  -- started_at / completed_at always come from the server clock
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed,
                                       started_at, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 'n1', 'w_squat_push_1', 'normal', 1.0,
            '{"workoutId":"w_squat_push_1"}', timestamptz '2000-01-01', current_date)
    returning id into v_sid;
  assert (select started_at from public.workout_sessions where id = v_sid) > now() - interval '1 minute',
    'started_at stamped by the server';
  update public.workout_sessions set results = '[]', rpe = 6, feeling = 'ok', completion = 0.95, points = 120,
    duration_sec = 900, calories = 110, completed_at = timestamptz '2000-01-01' where id = v_sid;
  assert (select completed_at from public.workout_sessions where id = v_sid) > now() - interval '1 minute',
    'completed_at stamped by the server';
  assert (select points from public.workout_sessions where id = v_sid) = 120, 'points within the ceiling are kept';
  -- a completed session never moves to another day / week, or to another course
  update public.workout_sessions set completed_at = now() - interval '30 days' where id = v_sid;
  assert (select completed_at from public.workout_sessions where id = v_sid) > now() - interval '1 minute',
    'completed_at never moves';
  update public.workout_sessions set course_id = 'kettlebell', node_id = 'n99', workout_id = 'w_test'
    where id = v_sid;
  assert (select course_id from public.workout_sessions where id = v_sid) = 'start',
    'a session cannot be moved to another course';
  assert (select node_id from public.workout_sessions where id = v_sid) = 'n1', 'node frozen';

  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, completed_at, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'engine', 'n1', 'w_test', 80, now(), current_date);
  -- unfinished session must not count anywhere; its points are clamped to the workout ceiling
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 'n2', 'w_squat_push_2', 400, current_date);
  assert (select points from public.workout_sessions where node_id = 'n2') = 120,
    'points clamped to base 100 × 1.0 × streak 1.2';
  -- difficulty raises the ceiling, an unknown workout id lowers it
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, points, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 'n3', 'w_squat_push_3', 'harder', 999, current_date);
  assert (select points from public.workout_sessions where node_id = 'n3') = 150,
    'harder: 100 × 1.25 × 1.2 = 150';
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 'n4', 'w_not_in_catalogue', 999, current_date);
  assert (select points from public.workout_sessions where node_id = 'n4') = 72,
    'unknown workout: minimum base 60 × 1.2 = 72';
  update public.workout_sessions set points = 999 where id = v_sid;
  assert (select points from public.workout_sessions where id = v_sid) = 120, 'update is clamped too';

  -- local_date must be within a day of the server date
  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, local_date)
      values ('00000000-0000-0000-0000-00000000000a', 'start', 'n5', 'w_emom_12', current_date - 5);
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_local_date', 'backdated session blocked, got ' || v_err;
  end;
  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, local_date)
      values ('00000000-0000-0000-0000-00000000000a', 'start', 'n5', 'w_emom_12', current_date + 5);
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_local_date', 'future session blocked, got ' || v_err;
  end;

  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, local_date)
      values ('00000000-0000-0000-0000-00000000000b', 'start', 'n1', 'w_squat_push_1', current_date);
    raise exception 'should have failed';
  exception when others then assert sqlstate = '42501', 'session for another user blocked';
  end;
  begin
    update public.workout_sessions set rpe = 11 where id = v_sid;
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, local_date, prescribed)
      values ('00000000-0000-0000-0000-00000000000a', 'start', 'n6', 'w_emom_12', current_date,
              jsonb_build_object('junk', repeat('a', 70000)));
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, local_date, duration_sec)
      values ('00000000-0000-0000-0000-00000000000a', 'start', 'n6', 'w_emom_12', current_date, 999999);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;

  insert into public.benchmarks (user_id, key, value, unit) values
    ('00000000-0000-0000-0000-00000000000a', 'pushups_max', 20, 'reps'),
    ('00000000-0000-0000-0000-00000000000a', 'pushups_max', 25, 'reps');
  begin
    insert into public.benchmarks (user_id, key, value, unit) values ('00000000-0000-0000-0000-00000000000a', 'Bad Key', 1, 'reps');
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    insert into public.benchmarks (user_id, key, value, unit) values ('00000000-0000-0000-0000-00000000000a', 'pushups_max', 1, repeat('u', 20));
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    insert into public.benchmarks (user_id, key, value, unit) values ('00000000-0000-0000-0000-00000000000a', 'pushups_max', 1e9, 'reps');
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  raise notice 'OK course state / sessions / benchmarks';
end $$;

-- totals + leaderboard -----------------------------------------------------------------
do $$ declare r record; n int; begin
  select * into r from public.get_my_totals();
  assert r.workouts = 2, 'two completed workouts, got ' || r.workouts;
  assert r.minutes = 15, 'minutes = 900/60, got ' || r.minutes;
  -- daily points: 40+30+35+35+60+60 = 260 ; sessions 120+80 = 200
  assert r.points = 460, 'totals points, got ' || r.points;

  -- global all-time: ann 460, is_me
  select count(*) into n from public.get_leaderboard('all');
  assert n >= 1;
  select * into r from public.get_leaderboard('all') where is_me;
  assert r.points = 460 and r.rank = 1 and r.display_name = 'Annie', 'all-time global row';
  -- course filter excludes step points
  select * into r from public.get_leaderboard('all', 'start') where is_me;
  assert r.points = 120, 'course-only points, got ' || r.points;
  select * into r from public.get_leaderboard('all', 'engine') where is_me;
  assert r.points = 80;
  -- week: sessions completed now are in this week; daily logs partially
  select * into r from public.get_leaderboard('week') where is_me;
  assert r.points >= 200, 'week includes this-week sessions';
  -- no emails anywhere in the output
  assert not exists (select 1 from public.get_leaderboard('all') where display_name like '%@%');
  raise notice 'OK totals + leaderboard (ann)';
end $$;

-- repeating a node halves the ceiling; at most 4 completed sessions per day
do $$ declare v_err text; begin
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, completed_at, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 'n1', 'w_squat_push_1', 120, now(), current_date);
  assert (select count(*) from public.workout_sessions where node_id = 'n1' and points = 60) = 1,
    'repeat of a completed node: 100 × 0.5 × 1.2 = 60';
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, completed_at, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 'n7', 'w_emom_12', 100, now(), current_date);
  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, completed_at, local_date)
      values ('00000000-0000-0000-0000-00000000000a', 'start', 'n8', 'w_emom_12', 100, now(), current_date);
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'too_many_sessions_today', 'daily session cap, got ' || v_err;
  end;
  delete from public.workout_sessions where node_id in ('n7') or (node_id = 'n1' and points = 60);
  assert (select count(*) from public.workout_sessions where completed_at is not null) = 2, 'back to two completed';
  raise notice 'OK session ceiling + daily cap';
end $$;

-- bob: no points yet → still gets his own row, last place
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', 'bob@example.com');
do $$ declare r record; v_err text; begin
  select * into r from public.get_leaderboard('all') where is_me;
  assert r.points = 0 and r.rank = 2, 'bob appended with rank 2, got ' || r.rank;
  assert r.display_name = 'Athlete 0000', 'fallback name, got ' || r.display_name;
  assert (select count(*) from public.get_leaderboard('all', null, 1)) = 2, 'limit 1 + own row';
  begin
    perform public.get_leaderboard('month');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_period';
  end;
  -- bob sees none of ann's data
  assert (select count(*) from public.workout_sessions) = 0;
  assert (select count(*) from public.daily_logs) = 0;
  assert (select count(*) from public.benchmarks) = 0;
  assert (select count(*) from public.user_course_state) = 0;
  assert (select count(*) from public.profiles) = 1;
  assert (select count(*) from public.my_entitlements) = 0, 'refunded → not entitled';
  raise notice 'OK leaderboard (bob) + isolation';
end $$;

-- Verified email only ---------------------------------------------------------------------
-- The JWT `email` claim is never trusted: identity comes from auth.users, and only
-- for a confirmed, live, unbanned user.
select pg_temp.as_super();
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000e', 'ghost@example.com', null);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000e', 'coach@example.com');
do $$ begin
  assert public.current_email() is null, 'unconfirmed email is nobody';
  assert not public.is_admin(), 'a JWT claiming the coach address is not the coach';
  assert (select count(*) from public.purchases) = 0, 'no admin read';
  assert (select count(*) from public.my_entitlements) = 0, 'no entitlements';
  raise notice 'OK unconfirmed email';
end $$;

select pg_temp.as_super();
update auth.users set banned_until = now() + interval '1 day' where id = '00000000-0000-0000-0000-00000000000c';
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ begin
  assert not public.is_admin(), 'a banned admin is not an admin';
  raise notice 'OK banned user';
end $$;
select pg_temp.as_super();
update auth.users set banned_until = null where id = '00000000-0000-0000-0000-00000000000c';

-- Per-IP throttle on the anonymous RPC -----------------------------------------------------
select pg_temp.as_anon();
-- Only the last hop of x-forwarded-for is trustworthy; the first entry is whatever
-- the client sent, so the bucket must be 70.41.3.18, not 203.0.113.7.
select pg_temp.from_ip('203.0.113.7, 70.41.3.18');
do $$ declare v_err text; i int; begin
  -- 30 orders per IP per hour are allowed; every further attempt is refused,
  -- including from a fresh email address.
  for i in 1..30 loop
    perform public.create_order('throttle' || i || '@example.com', 'start');
  end loop;
  for i in 31..32 loop
    begin
      perform public.create_order('throttle' || i || '@example.com', 'start');
      raise exception 'should have failed';
    exception when others then
      get stacked diagnostics v_err = message_text;
      assert v_err = 'too_many_orders', 'per-IP throttle, got ' || v_err;
    end;
  end loop;
  raise notice 'OK per-IP throttle';
end $$;
select pg_temp.from_ip(null);
select pg_temp.as_super();
do $$ begin
  assert (select count(*) from public.order_throttle where bucket = '203.0.113.7') = 0,
    'a client-supplied forwarded-for entry cannot pick the bucket';
  assert (select hits from public.order_throttle where bucket = '70.41.3.18') = 30,
    'the rejected calls roll their own increments back';
  assert exists (select 1 from public.order_throttle where bucket = 'global'), 'headerless calls share a bucket';
  raise notice 'OK throttle buckets';
end $$;

-- Storage policies -----------------------------------------------------------------------
insert into storage.objects (bucket_id, name) values
  ('videos', 'start/air_squat.ru.mp4'),
  ('videos', 'shared/burpee.en.mp4'),
  ('videos', 'kettlebell/snatch.ru.mp4');
do $$ begin
  assert (select count(*) from storage.buckets where id = 'videos' and public = false) = 1, 'private bucket';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'ann@example.com');
do $$ begin
  assert (select count(*) from storage.objects) = 2, 'ann sees start + shared';
  assert not exists (select 1 from storage.objects where name like 'kettlebell/%'), 'kettlebell hidden';
  begin
    insert into storage.objects (bucket_id, name) values ('videos', 'start/hack.mp4');
    raise exception 'should have failed';
  exception when others then assert sqlstate = '42501', 'non-admin upload blocked';
  end;
  raise notice 'OK storage (ann)';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', 'bob@example.com');
do $$ begin
  assert (select count(*) from storage.objects) = 1, 'bob (pending kettlebell) sees shared only';
  raise notice 'OK storage (bob)';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ begin
  assert (select count(*) from storage.objects) = 3, 'admin sees all';
  insert into storage.objects (bucket_id, name) values ('videos', 'start/new.mp4');
  delete from storage.objects where name = 'start/new.mp4';
  raise notice 'OK storage (admin)';
end $$;

select pg_temp.as_anon();
do $$ begin
  assert (select count(*) from storage.objects) = 0, 'anon sees nothing';
  raise notice 'OK storage (anon)';
end $$;

select pg_temp.as_super();
-- Cascade: deleting the auth user removes everything
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 0;
  assert (select count(*) from public.workout_sessions where user_id = '00000000-0000-0000-0000-00000000000a') = 0;
  assert (select count(*) from public.purchases where email = 'ann@example.com') = 2, 'purchases survive (by email)';
  raise notice 'OK cascade';
end $$;

\echo ALL TESTS PASSED
