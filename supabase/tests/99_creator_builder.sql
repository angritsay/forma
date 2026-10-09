-- =============================================================================
-- Creators build their own courses (0065): the builder's tables and buckets, scoped to the creator.
-- Run on a database with every migration applied; it can follow the other suites, and it removes
-- what it created before it ends.
--
-- What this can get wrong:
--   * a creator reads or writes another creator's or Forma's drafts, days, workouts or files;
--   * a creator publishes, changes `creator_id`, `status`, `sort_order`, or prices a course out of
--     bounds, or takes a course id that is already a course (`start`) or a path word (`custom`);
--   * a day of theirs plays somebody else's workout, or moves to another course;
--   * a course waiting for review, or ever published, can still be changed by its creator — or a
--     workout such a course plays can;
--   * a paused or merely applied creator writes; anon reaches anything;
--   * an upload lands outside `creators/<own id>/`, or a buyer of one creator's course reads a clip
--     another creator filed under that course's id;
--   * the owner loses anything: publishing, handing back, editing a creator's course.
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
create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', false);
  set role anon;
end $$;
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{}', false);
end $$;
-- p_code is a server word (the message) or a SQLSTATE: 42501 covers both a row-level-security
-- refusal and the guard's `forbidden_field`.
create or replace function pg_temp.expect_error(p_sql text, p_code text) returns void
language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected % from: %', p_code, p_sql;
exception when others then
  if sqlerrm <> p_code and sqlstate <> p_code then
    raise exception 'expected %, got % (%) from: %', p_code, sqlerrm, sqlstate, p_sql;
  end if;
end $$;
-- How many rows a statement touched: RLS turns a write on a row you may not see into zero rows.
create or replace function pg_temp.touched(p_sql text) returns int
language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;
create or replace function pg_temp.structure() returns jsonb language sql immutable as $$
  select jsonb_build_object('sections', jsonb_build_array(jsonb_build_object(
    'kind', 'main', 'format', 'circuit', 'sets', 3, 'restBetweenRoundsSec', 60,
    'items', jsonb_build_array(jsonb_build_object(
      'exerciseId', 'cb_move', 'unit', 'seconds', 'target', 45, 'restAfterSec', 15))
  )));
$$;
grant execute on function pg_temp.expect_error(text, text) to public;
grant execute on function pg_temp.touched(text) to public;
grant execute on function pg_temp.structure() to public;

select pg_temp.as_super();

insert into public.admins (email) values ('cb-admin@example.com') on conflict (email) do nothing;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000065000', 'cb-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000650a1', 'cb-ann@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000650b2', 'cb-ben@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000650c3', 'cb-pat@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000650d4', 'cb-amy@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000650e5', 'cb-buyer@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000650f6', 'cb-other@example.com', '{}')
on conflict (id) do nothing;

insert into public.creators (id, slug, name, owner_email, status, approved_at) values
  ('00000000-0000-0000-0000-00000065c0a1', 'cb-ann', 'Ann', 'cb-ann@example.com', 'active', now()),
  ('00000000-0000-0000-0000-00000065c0b2', 'cb-ben', 'Ben', 'cb-ben@example.com', 'active', now()),
  ('00000000-0000-0000-0000-00000065c0c3', 'cb-pat', 'Pat', 'cb-pat@example.com', 'paused', now()),
  ('00000000-0000-0000-0000-00000065c0d4', 'cb-amy', 'Amy', 'cb-amy@example.com', 'applied', null)
on conflict (id) do nothing;

-- Forma's own draft and workout, Ben's draft, Pat's (paused) course, and a file of Forma's.
insert into public.custom_workouts (id, short_id, title, structure) values
  ('00000000-0000-0000-0000-00000065f001', 'cb_forma_w', 'Forma flow', pg_temp.structure());
insert into public.admin_courses (id, slug_id, content) values
  ('00000000-0000-0000-0000-00000065a001', 'cb_forma', '{}');
insert into public.admin_courses (id, slug_id, creator_id) values
  ('00000000-0000-0000-0000-00000065b001', 'cb_ben1', '00000000-0000-0000-0000-00000065c0b2'),
  ('00000000-0000-0000-0000-00000065c001', 'cb_pat1', '00000000-0000-0000-0000-00000065c0c3');
insert into storage.objects (bucket_id, name) values
  ('videos', 'start/cb_forma_clip.mp4'),
  ('images', 'creators/00000000-0000-0000-0000-00000065c0b2/ben.jpg');

-- -----------------------------------------------------------------------------
-- 1. An open creator creates a course of their own — and nothing else.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000650a1', 'cb-ann@example.com');

do $$ begin
  assert public.my_creator_id() = '00000000-0000-0000-0000-00000065c0a1', 'ann is a creator';
  assert public.my_open_creator_id() = '00000000-0000-0000-0000-00000065c0a1', 'and open';
end $$;

insert into public.admin_courses (id, slug_id, creator_id, price_rub, content)
values ('00000000-0000-0000-0000-00000065a0a1', 'cb_ann1', '00000000-0000-0000-0000-00000065c0a1',
        1990, '{"name":{"ru":"Йога Анны","en":"Ann''s yoga"}}');

do $$
declare r record;
begin
  select * into r from public.admin_courses where id = '00000000-0000-0000-0000-00000065a0a1';
  assert r.status = 'draft' and r.author_id = '00000000-0000-0000-0000-0000000650a1'
     and r.review_requested_at is null, format('ann''s draft: %s', r);
  -- She sees her own course, and none of the other drafts.
  assert (select count(*) from public.admin_courses where slug_id like 'cb\_%') = 1,
    'ann sees only her own draft';
end $$;

-- Somebody else's creator id, none, or a state she may not set.
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id)
  values ('cb_x1', '00000000-0000-0000-0000-00000065c0b2')$$, '42501');
select pg_temp.expect_error($$insert into public.admin_courses (slug_id) values ('cb_x2')$$, '42501');
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id, status)
  values ('cb_x3', '00000000-0000-0000-0000-00000065c0a1', 'published')$$, '42501');
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id, published_at)
  values ('cb_x4', '00000000-0000-0000-0000-00000065c0a1', now())$$, '42501');
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id, sort_order)
  values ('cb_x5', '00000000-0000-0000-0000-00000065c0a1', -100)$$, '42501');
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id, review_requested_at)
  values ('cb_x6', '00000000-0000-0000-0000-00000065c0a1', now())$$, '42501');
-- A course id that is already a course, or a word the paths use.
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id)
  values ('start', '00000000-0000-0000-0000-00000065c0a1')$$, 'slug_taken');
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id)
  values ('custom', '00000000-0000-0000-0000-00000065c0a1')$$, 'slug_taken');
select pg_temp.expect_error($$update public.admin_courses set slug_id = 'shared'
  where id = '00000000-0000-0000-0000-00000065a0a1'$$, 'slug_taken');
-- Prices out of bounds.
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id, price_rub)
  values ('cb_x7', '00000000-0000-0000-0000-00000065c0a1', 1000000)$$, 'price_out_of_range');
select pg_temp.expect_error($$update public.admin_courses set price_usd = 5000
  where id = '00000000-0000-0000-0000-00000065a0a1'$$, 'price_out_of_range');

-- Her own fields she edits; the protected ones she does not.
do $$ begin
  assert pg_temp.touched($q$update public.admin_courses set price_rub = 2490, weeks = 6,
    content = '{"name":{"ru":"Йога","en":"Yoga"}}' where id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 1,
    'ann edits her draft';
end $$;
select pg_temp.expect_error($$update public.admin_courses set creator_id = '00000000-0000-0000-0000-00000065c0b2'
  where id = '00000000-0000-0000-0000-00000065a0a1'$$, '42501');
select pg_temp.expect_error($$update public.admin_courses set creator_id = null
  where id = '00000000-0000-0000-0000-00000065a0a1'$$, '42501');
select pg_temp.expect_error($$update public.admin_courses set status = 'published'
  where id = '00000000-0000-0000-0000-00000065a0a1'$$, '42501');
select pg_temp.expect_error($$update public.admin_courses set sort_order = -5
  where id = '00000000-0000-0000-0000-00000065a0a1'$$, '42501');
select pg_temp.expect_error($$update public.admin_courses set review_requested_at = now()
  where id = '00000000-0000-0000-0000-00000065a0a1'$$, '42501');
select pg_temp.expect_error($$update public.admin_courses set published_at = now()
  where id = '00000000-0000-0000-0000-00000065a0a1'$$, '42501');
-- Publishing is the owner's.
select pg_temp.expect_error($$select public.admin_publish_course('00000000-0000-0000-0000-00000065a0a1')$$, 'forbidden');
select pg_temp.expect_error($$select public.admin_return_course('00000000-0000-0000-0000-00000065a0a1')$$, 'forbidden');

-- Ben's and Forma's drafts: invisible, and every write touches nothing.
do $$ begin
  assert (select count(*) from public.admin_courses where id in (
    '00000000-0000-0000-0000-00000065b001', '00000000-0000-0000-0000-00000065a001')) = 0,
    'ann cannot read other drafts';
  assert pg_temp.touched($q$update public.admin_courses set price_rub = 1
    where id in ('00000000-0000-0000-0000-00000065b001', '00000000-0000-0000-0000-00000065a001')$q$) = 0,
    'ann cannot update other drafts';
  assert pg_temp.touched($q$delete from public.admin_courses
    where id in ('00000000-0000-0000-0000-00000065b001', '00000000-0000-0000-0000-00000065a001')$q$) = 0,
    'ann cannot delete other drafts';
end $$;
select pg_temp.expect_error($$select public.creator_request_review('00000000-0000-0000-0000-00000065b001')$$, 'course_not_found');
select pg_temp.expect_error($$select public.creator_request_review('00000000-0000-0000-0000-00000065a001')$$, 'course_not_found');

-- -----------------------------------------------------------------------------
-- 2. Workouts and days.
-- -----------------------------------------------------------------------------
insert into public.custom_workouts (id, short_id, title, structure, creator_id) values
  ('00000000-0000-0000-0000-00000065f0a1', 'cb_ann_w1', 'Ann flow', pg_temp.structure(),
   '00000000-0000-0000-0000-00000065c0a1');

do $$ begin
  assert (select author_id from public.custom_workouts where id = '00000000-0000-0000-0000-00000065f0a1')
    = '00000000-0000-0000-0000-0000000650a1', 'the database writes who saved it';
  assert (select count(*) from public.custom_workouts where short_id like 'cb\_%') = 1,
    'ann reads her own workout and not Forma''s';
end $$;

select pg_temp.expect_error($$insert into public.custom_workouts (short_id, title, structure)
  values ('cb_x_w1', 'x', '{"sections":[]}')$$, '42501');
select pg_temp.expect_error($$insert into public.custom_workouts (short_id, title, structure, creator_id)
  values ('cb_x_w2', 'x', '{"sections":[]}', '00000000-0000-0000-0000-00000065c0b2')$$, '42501');
select pg_temp.expect_error($$insert into public.custom_workouts (short_id, title, structure, creator_id, share_token)
  values ('cb_x_w3', 'x', '{"sections":[]}', '00000000-0000-0000-0000-00000065c0a1', 'abcdefghijklmnopqrstu')$$, '42501');
select pg_temp.expect_error($$insert into public.custom_workouts (short_id, title, structure, creator_id, author_slug)
  values ('cb_x_w4', 'x', '{"sections":[]}', '00000000-0000-0000-0000-00000065c0a1', 'nikita')$$, '42501');
select pg_temp.expect_error($$update public.custom_workouts set creator_id = null
  where id = '00000000-0000-0000-0000-00000065f0a1'$$, '42501');
select pg_temp.expect_error($$update public.custom_workouts set short_id = 'cb_renamed'
  where id = '00000000-0000-0000-0000-00000065f0a1'$$, '42501');
do $$ begin
  assert pg_temp.touched($q$update public.custom_workouts set title = 'x'
    where id = '00000000-0000-0000-0000-00000065f001'$q$) = 0, 'ann cannot edit Forma''s workout';
  assert pg_temp.touched($q$delete from public.custom_workouts
    where id = '00000000-0000-0000-0000-00000065f001'$q$) = 0, 'nor delete it';
end $$;

-- Exercises stay the owner's.
select pg_temp.expect_error($$insert into public.exercises (id, name_ru) values ('cb_new_move', 'Новое')$$, '42501');
do $$ begin
  assert pg_temp.touched($q$update public.exercises set name_ru = 'x'$q$) = 0, 'exercises are read-only';
end $$;

-- One day so far: too short to send.
insert into public.admin_course_days (course_id, node_id, week, day, kind, custom_workout_id, content)
values ('00000000-0000-0000-0000-00000065a0a1', 'd1', 1, 1, 'workout',
        '00000000-0000-0000-0000-00000065f0a1', '{"title":{"ru":"День 1","en":"Day 1"}}');
select pg_temp.expect_error($$select public.creator_request_review('00000000-0000-0000-0000-00000065a0a1')$$, 'course_too_short');

-- A day that plays Forma's workout, a day in Ben's course, a day moved to Ben's course.
select pg_temp.expect_error($$insert into public.admin_course_days (course_id, node_id, week, day, kind, custom_workout_id)
  values ('00000000-0000-0000-0000-00000065a0a1', 'd9', 2, 1, 'workout', '00000000-0000-0000-0000-00000065f001')$$, '42501');
select pg_temp.expect_error($$insert into public.admin_course_days (course_id, node_id, week, day, kind)
  values ('00000000-0000-0000-0000-00000065b001', 'd1', 1, 1, 'rest')$$, '42501');
select pg_temp.expect_error($$update public.admin_course_days set course_id = '00000000-0000-0000-0000-00000065b001'
  where course_id = '00000000-0000-0000-0000-00000065a0a1'$$, '42501');
select pg_temp.expect_error($$update public.admin_course_days set custom_workout_id = '00000000-0000-0000-0000-00000065f001'
  where course_id = '00000000-0000-0000-0000-00000065a0a1'$$, '42501');

insert into public.admin_course_days (course_id, node_id, week, day, kind, custom_workout_id) values
  ('00000000-0000-0000-0000-00000065a0a1', 'd2', 1, 2, 'rest', null),
  ('00000000-0000-0000-0000-00000065a0a1', 'd3', 1, 3, 'workout', '00000000-0000-0000-0000-00000065f0a1'),
  ('00000000-0000-0000-0000-00000065a0a1', 'd4', 1, 4, 'milestone', null);

-- Ben, on Ann's days and workout: nothing to see, nothing touched.
select pg_temp.as_user('00000000-0000-0000-0000-0000000650b2', 'cb-ben@example.com');
do $$ begin
  assert (select count(*) from public.admin_course_days
          where course_id = '00000000-0000-0000-0000-00000065a0a1') = 0, 'ben cannot read ann''s days';
  assert (select count(*) from public.custom_workouts
          where id = '00000000-0000-0000-0000-00000065f0a1') = 0, 'nor her workout';
  assert pg_temp.touched($q$update public.admin_course_days set content = '{}'
    where course_id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 0, 'nor change her days';
  assert pg_temp.touched($q$delete from public.admin_course_days
    where course_id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 0, 'nor delete them';
  assert pg_temp.touched($q$update public.custom_workouts set title = 'x'
    where id = '00000000-0000-0000-0000-00000065f0a1'$q$) = 0, 'nor change her workout';
end $$;
-- His own day may not play her workout either.
select pg_temp.expect_error($$insert into public.admin_course_days (course_id, node_id, week, day, kind, custom_workout_id)
  values ('00000000-0000-0000-0000-00000065b001', 'd1', 1, 1, 'workout', '00000000-0000-0000-0000-00000065f0a1')$$, '42501');
select pg_temp.expect_error($$select public.creator_request_review('00000000-0000-0000-0000-00000065a0a1')$$, 'course_not_found');

-- -----------------------------------------------------------------------------
-- 3. Review: the draft freezes, can be withdrawn, handed back, and only the owner publishes.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000650a1', 'cb-ann@example.com');
do $$ begin
  assert public.creator_request_review('00000000-0000-0000-0000-00000065a0a1') is not null, 'sent';
  assert (select review_requested_at from public.admin_courses
          where id = '00000000-0000-0000-0000-00000065a0a1') is not null, 'waiting';
  assert pg_temp.touched($q$update public.admin_courses set price_rub = 1
    where id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 0, 'frozen while in review';
  assert pg_temp.touched($q$update public.admin_course_days set content = '{}'
    where course_id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 0, 'days frozen too';
  assert pg_temp.touched($q$update public.custom_workouts set title = 'changed'
    where id = '00000000-0000-0000-0000-00000065f0a1'$q$) = 0, 'and the workouts it plays';
  assert pg_temp.touched($q$delete from public.admin_courses
    where id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 0, 'and it cannot be deleted';
end $$;
select pg_temp.expect_error($$insert into public.admin_course_days (course_id, node_id, week, day, kind)
  values ('00000000-0000-0000-0000-00000065a0a1', 'd5', 1, 5, 'rest')$$, '42501');

-- Withdrawn: editable again; sent again.
select public.creator_withdraw_review('00000000-0000-0000-0000-00000065a0a1');
do $$ begin
  assert pg_temp.touched($q$update public.admin_courses set price_rub = 2990
    where id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 1, 'editable after withdrawing';
  assert public.creator_request_review('00000000-0000-0000-0000-00000065a0a1') is not null, 'sent again';
end $$;

-- The owner sees it waiting, hands it back, and later publishes it.
select pg_temp.as_user('00000000-0000-0000-0000-000000065000', 'cb-admin@example.com');
do $$ begin
  assert (select review_requested_at from public.admin_courses
          where id = '00000000-0000-0000-0000-00000065a0a1') is not null, 'owner sees the request';
end $$;
select public.admin_return_course('00000000-0000-0000-0000-00000065a0a1');
do $$ begin
  assert (select review_requested_at from public.admin_courses
          where id = '00000000-0000-0000-0000-00000065a0a1') is null, 'handed back';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000650a1', 'cb-ann@example.com');
select public.creator_request_review('00000000-0000-0000-0000-00000065a0a1');

select pg_temp.as_user('00000000-0000-0000-0000-000000065000', 'cb-admin@example.com');
select public.admin_publish_course('00000000-0000-0000-0000-00000065a0a1');
do $$
declare r record;
begin
  select * into r from public.admin_courses where id = '00000000-0000-0000-0000-00000065a0a1';
  assert r.status = 'published' and r.published_at is not null and r.review_requested_at is null
     and r.creator_id = '00000000-0000-0000-0000-00000065c0a1', format('published: %s', r);
  -- The owner keeps every power over a creator's course, bounds included.
  assert pg_temp.touched($q$update public.admin_courses set price_rub = 500000, sort_order = 7
    where id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 1, 'owner edits a creator course';
  update public.admin_courses set price_rub = 2990 where id = '00000000-0000-0000-0000-00000065a0a1';
end $$;

-- Published: read-only for Ann, even after an unpublish.
select pg_temp.as_user('00000000-0000-0000-0000-0000000650a1', 'cb-ann@example.com');
do $$ begin
  assert (select count(*) from public.admin_courses where id = '00000000-0000-0000-0000-00000065a0a1') = 1,
    'ann still reads her published course';
  assert pg_temp.touched($q$update public.admin_courses set price_rub = 1
    where id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 0, 'published is read-only';
  assert pg_temp.touched($q$update public.custom_workouts set title = 'changed'
    where id = '00000000-0000-0000-0000-00000065f0a1'$q$) = 0, 'and its workouts';
  assert pg_temp.touched($q$delete from public.admin_course_days
    where course_id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 0, 'and its days';
end $$;
select pg_temp.expect_error($$select public.creator_request_review('00000000-0000-0000-0000-00000065a0a1')$$, 'already_published');
select pg_temp.expect_error($$select public.admin_unpublish_course('00000000-0000-0000-0000-00000065a0a1')$$, 'forbidden');

select pg_temp.as_user('00000000-0000-0000-0000-000000065000', 'cb-admin@example.com');
select public.admin_unpublish_course('00000000-0000-0000-0000-00000065a0a1');
select pg_temp.as_user('00000000-0000-0000-0000-0000000650a1', 'cb-ann@example.com');
do $$ begin
  assert pg_temp.touched($q$update public.admin_courses set price_rub = 1
    where id = '00000000-0000-0000-0000-00000065a0a1'$q$) = 0, 'once published, stays read-only';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000065000', 'cb-admin@example.com');
select public.admin_publish_course('00000000-0000-0000-0000-00000065a0a1');

-- -----------------------------------------------------------------------------
-- 4. Paused, applied, anon.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000650c3', 'cb-pat@example.com');
do $$ begin
  assert public.my_creator_id() is not null and public.my_open_creator_id() is null, 'pat is paused';
  assert (select count(*) from public.admin_courses where id = '00000000-0000-0000-0000-00000065c001') = 1,
    'a paused creator reads their course';
  assert pg_temp.touched($q$update public.admin_courses set price_rub = 1
    where id = '00000000-0000-0000-0000-00000065c001'$q$) = 0, 'but does not edit it';
  assert pg_temp.touched($q$delete from public.admin_courses
    where id = '00000000-0000-0000-0000-00000065c001'$q$) = 0, 'nor delete it';
end $$;
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id)
  values ('cb_pat2', '00000000-0000-0000-0000-00000065c0c3')$$, '42501');
select pg_temp.expect_error($$insert into public.admin_course_days (course_id, node_id, week, day, kind)
  values ('00000000-0000-0000-0000-00000065c001', 'd1', 1, 1, 'rest')$$, '42501');
select pg_temp.expect_error($$insert into public.custom_workouts (short_id, title, structure, creator_id)
  values ('cb_pat_w', 'x', '{"sections":[]}', '00000000-0000-0000-0000-00000065c0c3')$$, '42501');
select pg_temp.expect_error($$select public.creator_request_review('00000000-0000-0000-0000-00000065c001')$$, 'creator_paused');

select pg_temp.as_user('00000000-0000-0000-0000-0000000650d4', 'cb-amy@example.com');
do $$ begin
  assert public.my_creator_id() is null, 'an applicant is not a creator yet';
end $$;
select pg_temp.expect_error($$insert into public.admin_courses (slug_id, creator_id)
  values ('cb_amy1', '00000000-0000-0000-0000-00000065c0d4')$$, '42501');

select pg_temp.as_anon();
-- Anon reads published courses for the sales pages (0010), and no draft, no workout, no write.
do $$ begin
  assert (select count(*) from public.admin_courses where slug_id like 'cb\_%') = 1,
    'anon sees the published course only';
end $$;
select pg_temp.expect_error($$select count(*) from public.custom_workouts$$, '42501');
select pg_temp.expect_error($$update public.admin_courses set price_rub = 1$$, '42501');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name)
  values ('images', 'creators/00000000-0000-0000-0000-00000065c0a1/anon.jpg')$$, '42501');
select pg_temp.expect_error($$select public.creator_request_review('00000000-0000-0000-0000-00000065a0a1')$$, '42501');
select pg_temp.expect_error($$select public.my_creator_id()$$, '42501');

-- -----------------------------------------------------------------------------
-- 5. Storage: writes only under creators/<own id>/; clips read by the right buyers.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000650a1', 'cb-ann@example.com');
insert into storage.objects (bucket_id, name) values
  ('images', 'creators/00000000-0000-0000-0000-00000065c0a1/courses/cb_ann1/cover.jpg'),
  ('videos', 'creators/00000000-0000-0000-0000-00000065c0a1/cb_ann1/intro.ru.mp4'),
  ('audio',  'creators/00000000-0000-0000-0000-00000065c0a1/cb_ann1/name.ru.m4a');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name)
  values ('images', 'creators/00000000-0000-0000-0000-00000065c0b2/x.jpg')$$, '42501');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name)
  values ('videos', 'cb_ann1/intro.ru.mp4')$$, '42501');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name)
  values ('images', 'courses/cb_ann1/cover.jpg')$$, '42501');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name)
  values ('images', 'creators/00000000-0000-0000-0000-00000065c0a1/../../exercises/x.jpg')$$, '42501');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name)
  values ('proofs', 'creators/00000000-0000-0000-0000-00000065c0a1/x.jpg')$$, '42501');
do $$ begin
  assert pg_temp.touched($q$update storage.objects set name = name || '.x'
    where name in ('start/cb_forma_clip.mp4', 'creators/00000000-0000-0000-0000-00000065c0b2/ben.jpg')$q$) = 0,
    'ann cannot overwrite outside her prefix';
  assert pg_temp.touched($q$delete from storage.objects
    where name in ('start/cb_forma_clip.mp4', 'creators/00000000-0000-0000-0000-00000065c0b2/ben.jpg')$q$) = 0,
    'nor delete outside it';
  assert pg_temp.touched($q$update storage.objects set owner = null
    where name = 'creators/00000000-0000-0000-0000-00000065c0a1/cb_ann1/intro.ru.mp4'$q$) = 1,
    'she overwrites her own clip';
  assert (select count(*) from storage.objects
          where bucket_id = 'videos' and name like 'creators/%') = 1, 'and reads it';
end $$;
select pg_temp.expect_error($$update storage.objects set name = 'creators/00000000-0000-0000-0000-00000065c0b2/stolen.mp4'
  where name = 'creators/00000000-0000-0000-0000-00000065c0a1/cb_ann1/intro.ru.mp4'$$, '42501');

-- Ben files a clip under Ann's course id, in his own prefix.
select pg_temp.as_user('00000000-0000-0000-0000-0000000650b2', 'cb-ben@example.com');
insert into storage.objects (bucket_id, name) values
  ('videos', 'creators/00000000-0000-0000-0000-00000065c0b2/cb_ann1/fake.mp4');
do $$ begin
  assert (select count(*) from storage.objects
          where name = 'creators/00000000-0000-0000-0000-00000065c0a1/cb_ann1/intro.ru.mp4') = 0,
    'ben cannot read ann''s clip';
end $$;

-- A buyer of Ann's course reads her clip and not Ben's file under the same course id.
select pg_temp.as_super();
insert into public.purchases (email, course_id, status, activated_at)
values ('cb-buyer@example.com', 'cb_ann1', 'active', now());
select pg_temp.as_user('00000000-0000-0000-0000-0000000650e5', 'cb-buyer@example.com');
do $$ begin
  assert (select count(*) from storage.objects
          where name = 'creators/00000000-0000-0000-0000-00000065c0a1/cb_ann1/intro.ru.mp4') = 1,
    'the buyer reads the clip';
  assert (select count(*) from storage.objects
          where name = 'creators/00000000-0000-0000-0000-00000065c0b2/cb_ann1/fake.mp4') = 0,
    'but not another creator''s file under that course id';
end $$;
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name)
  values ('videos', 'creators/00000000-0000-0000-0000-00000065c0a1/cb_ann1/x.mp4')$$, '42501');

select pg_temp.as_user('00000000-0000-0000-0000-0000000650f6', 'cb-other@example.com');
do $$ begin
  assert (select count(*) from storage.objects
          where bucket_id in ('videos', 'audio') and name like 'creators/%') = 0,
    'somebody who did not buy reads no clip';
end $$;

-- A paused creator still reads her prefix and writes nothing in it.
select pg_temp.as_super();
update public.creators set status = 'paused' where id = '00000000-0000-0000-0000-00000065c0a1';
select pg_temp.as_user('00000000-0000-0000-0000-0000000650a1', 'cb-ann@example.com');
do $$ begin
  assert (select count(*) from storage.objects
          where bucket_id = 'videos' and name like 'creators/00000000-0000-0000-0000-00000065c0a1/%') = 1,
    'paused: still reads her clips';
  assert pg_temp.touched($q$delete from storage.objects
    where name like 'creators/00000000-0000-0000-0000-00000065c0a1/%'$q$) = 0, 'paused: deletes nothing';
end $$;
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name)
  values ('images', 'creators/00000000-0000-0000-0000-00000065c0a1/new.jpg')$$, '42501');

-- -----------------------------------------------------------------------------
-- Clean up, so the suites after this one see the database as they expect it.
-- -----------------------------------------------------------------------------
select pg_temp.as_super();
delete from storage.objects where name like 'creators/00000000-0000-0000-0000-00000065%'
  or name = 'start/cb_forma_clip.mp4';
delete from public.purchases where email = 'cb-buyer@example.com';
delete from public.admin_courses where slug_id like 'cb\_%';
delete from public.workouts where course_id like 'cb\_%';
delete from public.courses where id like 'cb\_%';
delete from public.custom_workouts where short_id like 'cb\_%';
delete from public.creators where slug like 'cb-%';
delete from public.admins where email = 'cb-admin@example.com';

select 'ok 99_creator_builder';
