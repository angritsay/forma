-- =============================================================================
-- Step screenshots (0012): the column, and the storage rule that decides who may touch the file.
--
-- Run after 10_smoke.sql on the same database — it reuses that file's admin (coach@example.com)
-- and creates its own two athletes, because the smoke suite deletes Ann on its way out to prove
-- the cascade.
--
-- The point under test is the one that matters: a screenshot is the athlete's own, the coach can
-- see it, and nobody else can — not even another athlete who knows the path.
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

\set ann '00000000-0000-0000-0000-000000000061'
\set bob '00000000-0000-0000-0000-000000000062'
\set coach '00000000-0000-0000-0000-00000000000c'

select pg_temp.as_super();
insert into auth.users (id, email, raw_user_meta_data) values
  (:'ann', 'walker@example.com', '{}'),
  (:'bob', 'other@example.com', '{}')
on conflict (id) do nothing;

-- A day with a screenshot -----------------------------------------------------
select pg_temp.as_user(:'ann', 'walker@example.com');
do $$ begin
  insert into public.daily_logs (user_id, local_date, steps, proof_path)
  values (auth.uid(), current_date, 9000,
          'storage:proofs/steps/' || auth.uid() || '/' || current_date || '.jpg')
  on conflict (user_id, local_date) do update
    set steps = excluded.steps, proof_path = excluded.proof_path;

  assert (select proof_path from public.daily_logs
          where user_id = auth.uid() and local_date = current_date) like 'storage:proofs/steps/%',
    'the screenshot is filed against the day';
  -- The picture changes nothing about the score: points still come from the steps. 9000 is two
  -- thousand over the 7000 goal, so 30 + 2×5 (steps_points is not callable from here on purpose).
  assert (select points from public.daily_logs
          where user_id = auth.uid() and local_date = current_date) = 40,
    'points are still derived from steps alone';
  raise notice 'OK a day carries a screenshot without affecting its points';
end $$;

-- Taking it off again is just clearing the column.
do $$ begin
  update public.daily_logs set proof_path = null
  where user_id = auth.uid() and local_date = current_date;
  assert (select proof_path from public.daily_logs
          where user_id = auth.uid() and local_date = current_date) is null;
  raise notice 'OK a screenshot can be taken off';
end $$;

-- A path that is not a path is refused by the length rule at the extremes.
do $$ begin
  begin
    update public.daily_logs set proof_path = repeat('x', 401)
    where user_id = auth.uid() and local_date = current_date;
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  raise notice 'OK proof_path is bounded';
end $$;

-- Who owns which object -------------------------------------------------------
do $$ begin
  assert public.owns_step_proof_path('steps/' || auth.uid() || '/2026-09-12.jpg'),
    'my own folder is mine';
  assert not public.owns_step_proof_path('steps/00000000-0000-0000-0000-000000000062/x.jpg'),
    'somebody else''s folder is not';
  -- A marathon proof lives in the same bucket under a different shape; this rule must not claim it.
  assert not public.owns_step_proof_path(
    '11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/t.jpg'),
    'a marathon path is not a steps path';
  assert not public.owns_step_proof_path('steps/not-a-uuid/x.jpg'), 'a broken id is not an owner';
  assert not public.owns_step_proof_path('steps'), 'a bare prefix owns nothing';
  assert not public.owns_step_proof_path(''), 'and neither does nothing';
  raise notice 'OK the storage predicate';
end $$;

-- The object itself ------------------------------------------------------------
select pg_temp.as_super();
do $$ begin
  -- The bucket exists whether or not the marathon migration ever ran.
  assert exists (select 1 from storage.buckets where id = 'proofs' and public = false),
    'a private proofs bucket';
end $$;

select pg_temp.as_user(:'ann', 'walker@example.com');
do $$ declare v_name text := 'steps/' || auth.uid() || '/2026-09-12.jpg'; begin
  insert into storage.objects (bucket_id, name, owner) values ('proofs', v_name, auth.uid());
  assert (select count(*) from storage.objects where name = v_name) = 1, 'I can upload my own';

  -- And into somebody else's folder, I cannot.
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('proofs', 'steps/00000000-0000-0000-0000-000000000062/sneak.jpg', auth.uid());
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK an athlete writes only into their own folder';
end $$;

-- Another athlete cannot read it even knowing the path.
select pg_temp.as_user(:'bob', 'other@example.com');
do $$ begin
  assert (select count(*) from storage.objects
          where bucket_id = 'proofs'
            and name = 'steps/00000000-0000-0000-0000-000000000061/2026-09-12.jpg') = 0,
    'somebody else''s screenshot is invisible';
  raise notice 'OK a screenshot is private to its owner';
end $$;

-- The coach sees every proof in the bucket: that is what makes it proof.
select pg_temp.as_user(:'coach', 'coach@example.com');
do $$ begin
  assert (select count(*) from storage.objects
          where bucket_id = 'proofs'
            and name = 'steps/00000000-0000-0000-0000-000000000061/2026-09-12.jpg') = 1,
    'the coach reads it';
  raise notice 'OK the coach sees the proof';
end $$;

select pg_temp.as_super();
\echo STEP PROOF TESTS PASSED
