-- =============================================================================
-- Course builder (0008): drafts, day constraints, publish validation, RLS.
-- Run after 10_smoke.sql on the same database — it reuses that file's admin (coach@example.com)
-- and creates its own customer. It deliberately does *not* borrow 10_smoke's ann@example.com:
-- that file deletes her account before it ends, and current_email() then returns nothing, so
-- every entitlement check here would quietly read false.
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
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;

-- A workout structure in the shape the builder writes (src/lib/training/customWorkout.ts).
create or replace function pg_temp.structure(p_exercise text) returns jsonb language sql immutable as $$
  select jsonb_build_object('sections', jsonb_build_array(jsonb_build_object(
    'kind', 'main', 'format', 'circuit', 'sets', 3, 'restBetweenRoundsSec', 60,
    'items', jsonb_build_array(jsonb_build_object(
      'exerciseId', p_exercise, 'unit', 'seconds', 'target', 45, 'restAfterSec', 15))
  )));
$$;

select pg_temp.as_super();
insert into auth.users (id, email, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000030', 'yogi@example.com', '{}')
on conflict (id) do nothing;

-- Draft creation ------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ declare v_course uuid; v_w1 uuid; v_w2 uuid; v_err text; begin
  insert into public.admin_courses (slug_id, sort_order, level, weeks, sessions_per_week, content)
  values ('yoga', 10, 1, 4, 3, '{"name":{"ru":"Йога","en":"Yoga"}}'::jsonb)
  returning id into v_course;

  insert into public.custom_workouts (short_id, title, structure, points)
  values ('y_flow_a', 'Flow A', pg_temp.structure('child_pose'), 120) returning id into v_w1;
  insert into public.custom_workouts (short_id, title, structure, points)
  values ('y_flow_b', 'Flow B', pg_temp.structure('cat_cow'), 90) returning id into v_w2;

  -- A course thinner than CourseSchema allows cannot be published.
  begin
    perform public.admin_publish_course(v_course);
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'course_too_short', 'publish refuses a 0-day course, got ' || v_err;
  end;

  -- A training day must carry a workout...
  begin
    insert into public.admin_course_days (course_id, node_id, week, day, kind)
    values (v_course, 'd_bad', 1, 6, 'workout');
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  -- ...and a rest day must not.
  begin
    insert into public.admin_course_days (course_id, node_id, week, day, kind, custom_workout_id)
    values (v_course, 'd_bad', 1, 7, 'rest', v_w1);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;

  insert into public.admin_course_days (course_id, node_id, week, day, kind, custom_workout_id, content) values
    (v_course, 'd1', 1, 1, 'workout', v_w1, '{"title":{"ru":"День 1","en":"Day 1"}}'::jsonb),
    (v_course, 'd2', 1, 2, 'rest',    null, '{"title":{"ru":"Отдых","en":"Rest"}}'::jsonb),
    -- d3 reuses w1 on purpose: the publish insert into public.workouts must survive a workout
    -- that appears on more than one day (one ON CONFLICT cannot touch a row twice).
    (v_course, 'd3', 1, 3, 'workout', v_w1, '{"title":{"ru":"День 3","en":"Day 3"}}'::jsonb),
    (v_course, 'd4', 1, 4, 'test',    v_w2, '{"title":{"ru":"Тест","en":"Test"}}'::jsonb);

  -- One day per calendar slot.
  begin
    insert into public.admin_course_days (course_id, node_id, week, day, kind)
    values (v_course, 'd5', 1, 1, 'milestone');
    raise exception 'should have failed';
  exception when unique_violation then null;
  end;

  raise notice 'OK draft + day constraints';
end $$;

-- A draft is invisible to everyone but the admin -----------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000030', 'yogi@example.com');
do $$ begin
  assert (select count(*) from public.admin_courses where slug_id = 'yoga') = 0,
    'a draft course is not readable by a customer';
  assert (select count(*) from public.admin_course_days) = 0,
    'the days of a draft are not readable either';
  raise notice 'OK draft is private';
end $$;

-- Publish validation: an empty workout blocks it -----------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ declare v_course uuid; v_err text; begin
  select id into v_course from public.admin_courses where slug_id = 'yoga';
  update public.custom_workouts set structure = '{"sections":[]}'::jsonb where short_id = 'y_flow_b';
  begin
    perform public.admin_publish_course(v_course);
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'course_has_empty_days', 'publish refuses an empty workout, got ' || v_err;
  end;
  update public.custom_workouts set structure = pg_temp.structure('cat_cow') where short_id = 'y_flow_b';

  perform public.admin_publish_course(v_course);
  assert (select status from public.admin_courses where id = v_course) = 'published', 'status flipped';
  assert (select published_at from public.admin_courses where id = v_course) is not null, 'published_at stamped';

  -- The rows the rest of the database keys off.
  assert (select count(*) from public.courses where id = 'yoga') = 1, 'course id allowlisted';
  assert (select count(*) from public.workouts where course_id = 'yoga') = 2,
    'one workouts row per distinct workout, not per day';
  assert (select base_points from public.workouts where course_id = 'yoga' and id = 'y_flow_a') = 120,
    'base_points taken from the workout';
  -- 90 sits inside the 60..250 range WorkoutSchema allows, so it survives the clamp untouched.
  assert (select base_points from public.workouts where course_id = 'yoga' and id = 'y_flow_b') = 90,
    'a workout''s own points carry through when they are already in range';

  -- The clamp itself: the coach's own estimate can be anything custom_workouts allows (0..375),
  -- but base_points must land inside the range the content model and the scoring trigger expect.
  update public.custom_workouts set points = 10 where short_id = 'y_flow_b';
  perform public.admin_publish_course(v_course);
  assert (select base_points from public.workouts where course_id = 'yoga' and id = 'y_flow_b') = 60,
    'points below the floor are raised to 60';
  update public.custom_workouts set points = 375 where short_id = 'y_flow_b';
  perform public.admin_publish_course(v_course);
  assert (select base_points from public.workouts where course_id = 'yoga' and id = 'y_flow_b') = 250,
    'points above the ceiling are cut to 250';
  update public.custom_workouts set points = null where short_id = 'y_flow_b';
  perform public.admin_publish_course(v_course);
  assert (select base_points from public.workouts where course_id = 'yoga' and id = 'y_flow_b') = 100,
    'a workout with no estimate gets the default 100';

  -- slug_id is frozen once published: renaming it would orphan purchases and history.
  begin
    update public.admin_courses set slug_id = 'yoga2' where id = v_course;
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err like 'slug_id is fixed%', 'slug frozen after publish, got ' || v_err;
  end;

  raise notice 'OK publish';
end $$;

-- What a customer sees once it is published ----------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000030', 'yogi@example.com');
do $$ begin
  assert (select count(*) from public.admin_courses where slug_id = 'yoga') = 1,
    'a published course is in the catalogue';
  assert (select count(*) from public.admin_course_days) = 4, 'its days are readable';
  -- ...but not the workouts themselves: this customer has not bought the course.
  assert (select count(*) from public.custom_workouts) = 0,
    'the workouts of a course you do not own stay hidden';
  raise notice 'OK published course is catalogue-visible';
end $$;

select pg_temp.as_super();
insert into public.purchases (email, course_id, status, activated_at)
values ('yogi@example.com', 'yoga', 'active', now());

select pg_temp.as_user('00000000-0000-0000-0000-000000000030', 'yogi@example.com');
do $$ begin
  assert public.has_entitlement('yoga'), 'the customer owns the course now';
  assert (select count(*) from public.custom_workouts) = 2,
    'an entitled customer reads the course workouts';
  raise notice 'OK entitlement opens the workouts';
end $$;

-- Unpublishing takes it off the catalogue without breaking anyone's history --------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ declare v_course uuid; begin
  select id into v_course from public.admin_courses where slug_id = 'yoga';
  perform public.admin_unpublish_course(v_course);
  assert (select status from public.admin_courses where id = v_course) = 'draft', 'back to draft';
  assert (select count(*) from public.courses where id = 'yoga') = 1,
    'the allowlist row stays, so existing owners keep their entitlement';
  assert (select count(*) from public.workouts where course_id = 'yoga') = 2,
    'and their sessions keep scoring';
  raise notice 'OK unpublish';
end $$;

-- A customer cannot publish -------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000030', 'yogi@example.com');
do $$ declare v_err text; begin
  begin
    perform public.admin_publish_course('00000000-0000-0000-0000-000000000000');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'forbidden', 'publish is admin-only, got ' || v_err;
  end;
  begin
    insert into public.admin_courses (slug_id) values ('sneaky');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK write is admin-only';
end $$;

-- An admin-authored exercise survives a re-seed ------------------------------------
--
-- 0007_exercise_seed.sql is regenerated from content/exercises and re-applied whenever the library
-- changes. A pose written in the admin panel is not owned by those files, so the generated upsert
-- carries `where is_custom = false`. This takes the id of a *seeded* exercise — the worst case —
-- edits it as if by hand, re-runs the real migration and checks the edit is still there.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ begin
  insert into public.exercises (id, name_ru, unit, is_custom)
  values ('child_pose', 'Поза ребёнка (моя версия)', 'seconds', true)
  on conflict (id) do update
    set name_ru = excluded.name_ru, is_custom = true;
  insert into public.exercises (id, name_ru, unit, is_custom, video_ru)
  values ('yoga_downward_dog', 'Собака мордой вниз', 'seconds', true,
          'storage:videos/yoga/downward_dog.ru.mp4');
end $$;

select pg_temp.as_super();
\i supabase/migrations/0007_exercise_seed.sql

do $$ begin
  assert (select name_ru from public.exercises where id = 'child_pose') = 'Поза ребёнка (моя версия)',
    'a hand-edited exercise is not overwritten by the generated seed';
  assert (select count(*) from public.exercises where id = 'yoga_downward_dog') = 1,
    'a pose that exists only in the admin panel survives a re-seed';
  assert (select name_ru from public.exercises where id = 'air_squat') = 'Приседания',
    'and an ordinary seeded exercise is still re-seeded normally';
  raise notice 'OK re-seed leaves admin-authored exercises alone';
end $$;

select pg_temp.as_super();
\echo ''
\echo 'COURSE BUILDER TESTS PASSED'
\echo ''
