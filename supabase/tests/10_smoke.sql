-- =============================================================================
-- Smoke tests for the Forma schema: triggers, RLS, RPCs, leaderboard, storage policies.
-- Requires supabase/tests/00_shim.sql + the three migrations (see 00_shim.sql header).
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

-- Users ------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'Ann@Example.com', '{"name": "  Ann  "}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com', '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'coach@example.com', '{"full_name": "Coach"}');

insert into public.admins (email) values ('COACH@example.com');

do $$ begin
  -- trigger created profiles, trimmed name, full_name fallback
  assert (select count(*) from public.profiles) = 3, 'profiles created by trigger';
  assert (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Ann', 'name trimmed';
  assert (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') is null, 'no name → null';
  assert (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'Coach', 'full_name fallback';
  assert (select length(avatar_seed) from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 8, 'avatar seed 8 hex chars';
  -- email change sync
  update auth.users set email = 'ann2@example.com' where id = '00000000-0000-0000-0000-00000000000a';
  assert (select email::text from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'ann2@example.com', 'email synced';
  update auth.users set email = 'ann@example.com' where id = '00000000-0000-0000-0000-00000000000a';
  raise notice 'OK profiles + triggers';
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
  begin
    perform public.get_leaderboard('week');
    raise exception 'anon leaderboard should fail';
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'OK anonymous create_order + no reads';
end $$;

-- abuse guard: 10 pending orders
select pg_temp.as_super();
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
  assert (select count(*) from public.purchases) = 1, 'ann sees her own row only';
  assert (select course_id from public.purchases) = 'start';
  assert not public.is_admin(), 'ann is not admin';
  -- non-admin cannot flip status directly
  update public.purchases set status = 'active';
  assert (select status from public.purchases) = 'pending', 'RLS blocks owner update';
  begin
    perform public.admin_set_purchase_status((select id from public.purchases), 'active');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_add_purchase('ann@example.com', 'pro');
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
  perform public.admin_add_purchase('Bob@Example.com', 'pro', ' gift ');
  assert (select status from public.purchases where email = 'bob@example.com' and course_id = 'pro') = 'active';
  assert (select note from public.purchases where email = 'bob@example.com' and course_id = 'pro') = 'gift';
  raise notice 'OK admin RPCs';
end $$;

-- active row never downgraded by a new anonymous order; refunded → pending again
select pg_temp.as_anon();
do $$ begin
  perform public.create_order('ann@example.com', 'start');
  raise notice 'OK re-order';
end $$;
select pg_temp.as_super();
do $$ begin
  assert (select status from public.purchases where email = 'ann@example.com' and course_id = 'start') = 'active', 'active kept';
  update public.purchases set status = 'refunded' where email = 'bob@example.com' and course_id = 'pro';
end $$;
select pg_temp.as_anon();
select public.create_order('bob@example.com', 'pro');
select pg_temp.as_super();
do $$ begin
  assert (select status from public.purchases where email = 'bob@example.com' and course_id = 'pro') = 'pending', 'refunded → pending';
  raise notice 'OK status transitions';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'ann@example.com');
do $$ begin
  assert (select count(*) from public.my_entitlements) = 1, 'ann now entitled';
  assert (select course_id from public.my_entitlements) = 'start';
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
  -- fallback insert must be own id + own email
  begin
    insert into public.profiles (id, email) values ('00000000-0000-0000-0000-0000000000ff', 'ann@example.com');
    raise exception 'should have failed';
  exception when others then
    assert sqlstate = '42501', 'RLS insert check, got ' || sqlstate;
  end;
  raise notice 'OK profiles RLS + column grants';
end $$;

-- daily_logs points trigger -------------------------------------------------------
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
  raise notice 'OK daily_logs';
end $$;

-- course state, sessions, benchmarks -----------------------------------------------
do $$ declare v_sid uuid; begin
  insert into public.user_course_state (user_id, course_id, scale) values ('00000000-0000-0000-0000-00000000000a', 'start', 1.05)
    on conflict (user_id, course_id) do update set scale = excluded.scale;
  insert into public.user_course_state (user_id, course_id, current_node_index, completed_node_ids)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 2, '{n1,n2}')
    on conflict (user_id, course_id) do update set current_node_index = excluded.current_node_index, completed_node_ids = excluded.completed_node_ids;
  assert (select scale from public.user_course_state) = 1.05, 'partial upsert keeps scale';
  assert (select completed_node_ids from public.user_course_state) = '{n1,n2}'::text[];

  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 'n1', 'w1', 'normal', 1.0, '{"workoutId":"w1"}', current_date)
    returning id into v_sid;
  update public.workout_sessions set results = '[]', rpe = 6, feeling = 'ok', completion = 0.95, points = 120,
    duration_sec = 900, calories = 110, completed_at = now() where id = v_sid;
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, completed_at, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'pro', 'n1', 'w1', 80, now(), current_date);
  -- unfinished session must not count anywhere (points within the 0..500 cap)
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, local_date)
    values ('00000000-0000-0000-0000-00000000000a', 'start', 'n2', 'w2', 400, current_date);
  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, local_date)
      values ('00000000-0000-0000-0000-00000000000a', 'start', 'n3', 'w3', 999, current_date);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, local_date)
      values ('00000000-0000-0000-0000-00000000000b', 'start', 'n1', 'w1', current_date);
    raise exception 'should have failed';
  exception when others then assert sqlstate = '42501', 'session for another user blocked';
  end;
  begin
    update public.workout_sessions set points = 501 where id = v_sid;
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    update public.workout_sessions set rpe = 11 where id = v_sid;
    raise exception 'should have failed';
  exception when check_violation then null;
  end;

  insert into public.benchmarks (user_id, key, value, unit) values
    ('00000000-0000-0000-0000-00000000000a', 'pushups_max', 20, 'reps'),
    ('00000000-0000-0000-0000-00000000000a', 'pushups_max', 25, 'reps');
  begin
    insert into public.benchmarks (user_id, key, value, unit) values ('00000000-0000-0000-0000-00000000000a', 'Bad Key', 1, 'x');
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
  select * into r from public.get_leaderboard('all', 'pro') where is_me;
  assert r.points = 80;
  -- week: sessions completed now are in this week; daily logs partially
  select * into r from public.get_leaderboard('week') where is_me;
  assert r.points >= 200, 'week includes this-week sessions';
  -- no emails anywhere in the output
  assert not exists (select 1 from public.get_leaderboard('all') where display_name like '%@%');
  raise notice 'OK totals + leaderboard (ann)';
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
  raise notice 'OK leaderboard (bob) + isolation';
end $$;

-- Storage policies -----------------------------------------------------------------------
select pg_temp.as_super();
insert into storage.objects (bucket_id, name) values
  ('videos', 'start/air_squat.ru.mp4'),
  ('videos', 'shared/burpee.en.mp4'),
  ('videos', 'pro/snatch.ru.mp4');
do $$ begin
  assert (select count(*) from storage.buckets where id = 'videos' and public = false) = 1, 'private bucket';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'ann@example.com');
do $$ begin
  assert (select count(*) from storage.objects) = 2, 'ann sees start + shared';
  assert not exists (select 1 from storage.objects where name like 'pro/%'), 'pro hidden';
  begin
    insert into storage.objects (bucket_id, name) values ('videos', 'start/hack.mp4');
    raise exception 'should have failed';
  exception when others then assert sqlstate = '42501', 'non-admin upload blocked';
  end;
  raise notice 'OK storage (ann)';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', 'bob@example.com');
do $$ begin
  assert (select count(*) from storage.objects) = 1, 'bob (pending pro) sees shared only';
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
  assert (select count(*) from public.purchases where email = 'ann@example.com') = 1, 'purchases survive (by email)';
  raise notice 'OK cascade';
end $$;

\echo ALL TESTS PASSED
