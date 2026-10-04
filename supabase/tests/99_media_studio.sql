-- =============================================================================
-- «Студия» (0060): the raw bucket, the clip tables, the admin RPCs and the render queue.
--
-- Run after the other suites on the same database, with 0060_media_studio.sql and
-- 0061_studio_flow.sql applied (the last section covers 0061: play mode, still frame, auto pass).
--
-- What this can get wrong:
--   * somebody who is not an admin reads or writes footage, clips or sources — through storage,
--     the tables or any of the RPCs — or anybody but the service role drives the worker's queue;
--   * a crop or a span the renderer cannot honour is stored;
--   * an unlabelled clip is queued, a clip is edited while it renders, a rendered clip that
--     changes still reads as done;
--   * two worker runs take the same clip: a clip another transaction holds must be skipped, not
--     waited for, and a claimed clip stays out of the next claim until its lease runs out;
--   * a run that died never gives its clip back, or gives it back forever (the attempt cap);
--   * a run whose lease was taken over finishes the clip anyway;
--   * done does not point the exercise at the clip, or overwrites an English recording.
--
-- The skip-locked check needs a second connection (`dblink`), so the rows it looks at are
-- committed; everything created is removed at the end.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

create extension if not exists dblink;

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

select pg_temp.as_super();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000060b2', 'ms-user@example.com', '{}')
on conflict (id) do nothing;
insert into public.admins (email) values ('ms-admin@example.com') on conflict do nothing;

insert into public.exercises (id, name_ru, video_en) values
  ('ms_squat', 'Присед (студия)', null),
  ('ms_press', 'Жим (студия)', 'storage:videos/shared/ms_press.en.mp4')
on conflict (id) do update set video_ru = null, video_en = excluded.video_en;

-- --- the bucket ---------------------------------------------------------------------------------
do $$ begin
  assert (select public = false and file_size_limit = 524288000 and allowed_mime_types = array['video/*']
            from storage.buckets where id = 'raw'), 'raw: private, 500 MB, video only';
end $$;

-- A run that stopped halfway leaves its rows; start from none.
delete from storage.objects where bucket_id = 'raw' and name like 'ms-src/%';
delete from public.media_sources where id = '00000000-0000-0000-0000-000000006005';
insert into storage.objects (bucket_id, name) values ('raw', 'ms-src/ms-clip.mp4');

select pg_temp.as_user('00000000-0000-0000-0000-0000000060b2', 'ms-user@example.com');
do $$ begin
  assert not exists (select 1 from storage.objects where bucket_id = 'raw'),
    'a signed-in non-admin sees no raw footage';
  begin
    insert into storage.objects (bucket_id, name) values ('raw', 'ms-src/hack.mp4');
    raise exception 'a non-admin uploaded raw footage';
  exception when insufficient_privilege then null;
  end;
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000060b2', 'ms-user@example.com', 'anon');
do $$ begin
  assert not exists (select 1 from storage.objects where bucket_id = 'raw'), 'anon sees no raw footage';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com');
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'raw') = 1, 'the admin sees raw footage';
  insert into storage.objects (bucket_id, name) values ('raw', 'ms-src/second.mp4');
  delete from storage.objects where bucket_id = 'raw' and name = 'ms-src/second.mp4';
end $$;

-- --- the admin side -----------------------------------------------------------------------------
do $$
declare
  v_src uuid;
  v     jsonb;
begin
  v_src := public.admin_media_save_source('00000000-0000-0000-0000-000000006005', 'Тренировка 3 окт',
                                          'IMG_0001.MOV', 1800);
  assert v_src = '00000000-0000-0000-0000-000000006005', 'the client-picked source id is kept';
  -- Saving again only changes what is passed.
  perform public.admin_media_save_source(v_src, 'Тренировка 3 октября');
  assert (select title = 'Тренировка 3 октября' and file_name = 'IMG_0001.MOV' and duration_s = 1800
            from public.media_sources where id = v_src), 'a partial save keeps the rest';

  v := public.admin_media_add_clip('00000000-0000-0000-0000-0000000060c1', v_src,
         '00000000-0000-0000-0000-000000006005/00000000-0000-0000-0000-0000000060c1.mp4',
         0.4, 10, 25, 'ms_squat', '{"x":0.1,"y":0,"w":0.8,"h":1}');
  assert v ->> 'status' = 'draft' and v ->> 'exercise_name' = 'Присед (студия)'
         and (v ->> 'exercise_has_video')::boolean = false, 'a new clip is a labelled draft';

  -- An unlabelled one.
  perform public.admin_media_add_clip('00000000-0000-0000-0000-0000000060c2', v_src,
            '00000000-0000-0000-0000-000000006005/00000000-0000-0000-0000-0000000060c2.mov',
            0, 30, 40);
  -- A resumed upload re-registers the same id: the timing moves, the label stays.
  v := public.admin_media_add_clip('00000000-0000-0000-0000-0000000060c1', v_src,
         '00000000-0000-0000-0000-000000006005/00000000-0000-0000-0000-0000000060c1.mp4',
         0.6, 10.2, 25);
  assert (v ->> 'start_s')::numeric = 10.2 and v ->> 'exercise_id' = 'ms_squat',
    're-adding updates the span and keeps the label';

  assert jsonb_array_length(public.admin_media_clips(v_src)) = 2, 'both clips listed';
  assert (select (s ->> 'clips')::int from jsonb_array_elements(public.admin_media_sources()) s
           where s ->> 'id' = v_src::text) = 2, 'the source counts its clips';

  -- What the renderer could not honour is refused.
  begin
    perform public.admin_media_add_clip(gen_random_uuid(), v_src, '../etc/passwd.mp4', 0, 1, 2);
    raise exception 'a path with .. was accepted';
  exception when others then assert sqlerrm = 'invalid_raw_path', sqlerrm; end;
  begin
    perform public.admin_media_add_clip(gen_random_uuid(), v_src, 'a/b.mp4', 0, 5, 5);
    raise exception 'an empty span was accepted';
  exception when others then assert sqlerrm = 'invalid_span', sqlerrm; end;
  begin
    perform public.admin_media_add_clip(gen_random_uuid(), v_src, 'a/b.mp4', 0, 1, 2, 'no_such_exercise');
    raise exception 'an unknown exercise was accepted';
  exception when others then assert sqlerrm = 'unknown_exercise', sqlerrm; end;
  begin
    perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c1',
              '{"crop":{"x":0.5,"y":0,"w":0.8,"h":1}}');
    raise exception 'a crop outside the frame was accepted';
  exception when others then assert sqlerrm = 'invalid_crop', sqlerrm; end;
  -- A crop missing a side is refused everywhere, not read as valid (a null check passes `if not`).
  assert public.media_crop_valid('{"x":0,"y":0,"w":0.5}') = false, 'a crop without h is not valid';
  assert public.media_crop_valid('{"x":0,"y":0,"w":0.5,"h":"1"}') = false, 'a string side is not valid';
  begin
    perform public.admin_media_add_clip(gen_random_uuid(), v_src, 'a/b.mp4', 0, 1, 2, null, '{"x":0.1}');
    raise exception 'add accepted a crop without w, h and y';
  exception when others then assert sqlerrm = 'invalid_crop', sqlerrm; end;
  begin
    perform public.admin_media_paste(array['00000000-0000-0000-0000-0000000060c1']::uuid[], null,
                                     '{"x":0,"y":0}', false, true);
    raise exception 'paste accepted a crop without w and h';
  exception when others then assert sqlerrm = 'invalid_crop', sqlerrm; end;
  begin
    perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c1', '{"grade":[1,2]}');
    raise exception 'a grade that is not an object was accepted';
  exception when others then assert sqlerrm = 'invalid_grade', sqlerrm; end;

  -- Save: only the keys passed change.
  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c1',
         '{"grade":{"exposure":0.5},"grade_version":1}');
  assert v -> 'grade' = '{"exposure":0.5}' and v -> 'crop' = '{"x":0.1,"y":0,"w":0.8,"h":1}',
    'a grade save keeps the crop';
  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c1', '{"crop":null}');
  assert v -> 'crop' = 'null'::jsonb and v -> 'grade' = '{"exposure":0.5}', 'crop cleared, grade kept';

  -- Paste the grade onto both; the one that already has it does not count.
  assert public.admin_media_paste(array['00000000-0000-0000-0000-0000000060c1',
                                        '00000000-0000-0000-0000-0000000060c2']::uuid[],
                                  '{"exposure":0.5}') = 1, 'paste changes only the clip without it';
  assert (select grade = '{"exposure":0.5}' from public.media_clips
           where id = '00000000-0000-0000-0000-0000000060c2'), 'the grade was pasted';
  assert public.admin_media_paste(array['00000000-0000-0000-0000-0000000060c2']::uuid[], null,
                                  '{"x":0,"y":0.25,"w":1,"h":0.5}', false, true) = 1, 'crop pasted alone';
  assert (select grade = '{"exposure":0.5}' and crop = '{"x":0,"y":0.25,"w":1,"h":0.5}'
            from public.media_clips where id = '00000000-0000-0000-0000-0000000060c2'),
    'pasting the crop leaves the grade';

  -- Queue: the unlabelled clip stays a draft.
  assert public.admin_media_queue(array['00000000-0000-0000-0000-0000000060c1',
                                        '00000000-0000-0000-0000-0000000060c2']::uuid[]) = 1,
    'only the labelled clip is queued';
  assert (select status from public.media_clips where id = '00000000-0000-0000-0000-0000000060c2') = 'draft',
    'an unlabelled clip is not queued';
  perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c2', '{"exercise_id":"ms_press"}');
  assert public.admin_media_queue(array['00000000-0000-0000-0000-0000000060c2']::uuid[]) = 1,
    'labelled, it queues';
end $$;
-- Committed: the claim below runs against another connection's lock.

-- --- nobody but an admin, nobody but the service role -------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000060b2', 'ms-user@example.com');
do $$
declare
  v_ok boolean;
begin
  begin
    perform public.admin_media_sources();
    raise exception 'a non-admin listed sources';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_media_clips(null);
    raise exception 'a non-admin listed clips';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_media_save_source(null, 'x');
    raise exception 'a non-admin saved a source';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_media_add_clip(gen_random_uuid(), '00000000-0000-0000-0000-000000006005',
                                        'a/b.mp4', 0, 1, 2);
    raise exception 'a non-admin added a clip';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c1', '{}');
    raise exception 'a non-admin saved a clip';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_media_paste(array['00000000-0000-0000-0000-0000000060c1']::uuid[], '{}');
    raise exception 'a non-admin pasted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_media_queue(array['00000000-0000-0000-0000-0000000060c1']::uuid[]);
    raise exception 'a non-admin queued';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_media_retry(array['00000000-0000-0000-0000-0000000060c1']::uuid[]);
    raise exception 'a non-admin retried';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_media_delete_clip('00000000-0000-0000-0000-0000000060c1');
    raise exception 'a non-admin deleted';
  exception when insufficient_privilege then null; end;
  -- The tables themselves: no rows to read, no writing at all.
  assert not exists (select 1 from public.media_clips), 'a non-admin sees no clips';
  assert not exists (select 1 from public.media_sources), 'a non-admin sees no sources';
  begin
    update public.media_clips set status = 'queued';
    raise exception 'a non-admin updated media_clips';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.media_sources (title) values ('x');
    raise exception 'a non-admin inserted a source';
  exception when insufficient_privilege then null; end;
  -- The worker's functions.
  begin
    perform public.media_render_claim(1);
    raise exception 'a signed-in user claimed a render';
  exception when insufficient_privilege then null; end;
  begin
    v_ok := public.media_render_done('00000000-0000-0000-0000-0000000060c1', 1);
    raise exception 'a signed-in user finished a render';
  exception when insufficient_privilege then null; end;
  begin
    v_ok := public.media_render_failed('00000000-0000-0000-0000-0000000060c1', 1, 'x');
    raise exception 'a signed-in user failed a render';
  exception when insufficient_privilege then null; end;
end $$;

-- Even an admin cannot drive the worker's queue from the app.
select pg_temp.as_user('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com');
do $$ begin
  begin
    perform public.media_render_claim(1);
    raise exception 'an admin session claimed a render';
  exception when insufficient_privilege then null; end;
  begin
    update public.media_clips set status = 'done';
    raise exception 'an admin session updated media_clips directly';
  exception when insufficient_privilege then null; end;
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000060b2', 'ms-user@example.com', 'anon');
do $$ begin
  begin
    perform public.admin_media_sources();
    raise exception 'anon listed sources';
  exception when insufficient_privilege then null; end;
end $$;

-- --- claim: a clip held by another run is skipped, not waited for --------------------------------
select pg_temp.as_super();
select dblink_connect('ms_other', 'dbname=' || current_database());
select dblink_exec('ms_other', 'begin');
select * from dblink('ms_other',
  $q$select id::text from public.media_clips where id = '00000000-0000-0000-0000-0000000060c1' for update$q$)
  as t(id text);
select pg_temp.as_service();

set lock_timeout = '3s';
do $$
declare
  v_ids uuid[];
  r     record;
begin
  assert public.media_render_pending() >= 2, 'both queued clips are pending';
  select array_agg(c.id) into v_ids from public.media_render_claim(20) c
   where c.id::text like '00000000-0000-0000-0000-0000000060c%';
  assert v_ids = array['00000000-0000-0000-0000-0000000060c2']::uuid[],
    'the claim must skip the clip another run holds, got ' || coalesce(v_ids::text, 'null');
  select * into r from public.media_clips where id = '00000000-0000-0000-0000-0000000060c2';
  assert r.status = 'rendering' and r.attempts = 1 and r.claimed_until > now() + interval '25 minutes',
    'a claimed clip is rendering, attempt 1, with its lease';
  assert (select status from public.media_clips where id = '00000000-0000-0000-0000-0000000060c1') = 'queued',
    'the skipped clip is untouched';
  assert not exists (select 1 from public.media_render_claim(20) c
                      where c.id = '00000000-0000-0000-0000-0000000060c2'),
    'a leased clip is not claimed twice';
end $$;
reset lock_timeout;

select pg_temp.as_super();
select dblink_exec('ms_other', 'rollback');
select dblink_disconnect('ms_other');

-- --- editing while rendering is refused -----------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com');
do $$ begin
  begin
    perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c2', '{"crop":null}');
    raise exception 'a rendering clip was edited';
  exception when others then assert sqlerrm = 'clip_busy', sqlerrm; end;
  assert public.admin_media_paste(array['00000000-0000-0000-0000-0000000060c2']::uuid[],
                                  '{"exposure":1}') = 0, 'paste skips a rendering clip';
  begin
    perform public.admin_media_delete_clip('00000000-0000-0000-0000-0000000060c2');
    raise exception 'a rendering clip was deleted';
  exception when others then assert sqlerrm = 'clip_busy', sqlerrm; end;
end $$;

-- --- done, failed, the lease, the attempt cap ----------------------------------------------------
select pg_temp.as_service();
do $$
declare
  r record;
begin
  -- Released by the other run: c1 is this run's now.
  select * into r from public.media_render_claim(1) c;
  assert r.id = '00000000-0000-0000-0000-0000000060c1' and r.attempt = 1
         and r.exercise_id = 'ms_squat' and r.raw_offset_s = 0.6 and r.has_video_en = false,
    'the released clip is claimed whole';

  -- A stale attempt cannot finish it.
  assert public.media_render_done(r.id, 7) = false, 'a wrong attempt does not finish the clip';
  assert public.media_render_done(r.id, 1, true) = true, 'done';
  assert (select video_ru = 'storage:videos/shared/ms_squat.ru.mp4'
                 and video_en = 'storage:videos/shared/ms_squat.en.mp4'
            from public.exercises where id = 'ms_squat'), 'the exercise points at the clip, both languages';
  assert (select status = 'done' and rendered_at is not null and claimed_until is null
            from public.media_clips where id = r.id), 'the clip is done';
  assert public.media_render_done(r.id, 1) = false, 'done twice is a no-op';

  -- c2 (ms_press, has English): a failure goes back to the queue while attempts remain.
  assert public.media_render_failed('00000000-0000-0000-0000-0000000060c2', 1, 'ffmpeg: boom') = true,
    'failed accepted';
  assert (select status = 'queued' and error = 'ffmpeg: boom' and attempts = 1
            from public.media_clips where id = '00000000-0000-0000-0000-0000000060c2'),
    'requeued with the error';

  -- Attempt 2: the run dies (its lease runs out) and the next claim takes the clip as attempt 3.
  select * into r from public.media_render_claim(1) c;
  assert r.id = '00000000-0000-0000-0000-0000000060c2' and r.attempt = 2 and r.has_video_en,
    'attempt 2, and the worker is told English exists';
  update public.media_clips set claimed_until = now() - interval '1 second' where id = r.id;
  assert public.media_render_pending() >= 1, 'a dead run''s clip is pending again';
  select * into r from public.media_render_claim(1) c;
  assert r.id = '00000000-0000-0000-0000-0000000060c2' and r.attempt = 3, 'taken over as attempt 3';
  assert public.media_render_failed(r.id, 2, 'late') = false, 'the overtaken run cannot touch it';

  -- Attempt 3 dies too: no attempts left, so the next claim marks it failed instead.
  update public.media_clips set claimed_until = now() - interval '1 second' where id = r.id;
  assert not exists (select 1 from public.media_render_claim(5) c where c.id = r.id),
    'no fourth attempt';
  assert (select status = 'failed' and error = 'ffmpeg: boom' and claimed_until is null
            from public.media_clips where id = r.id), 'failed, keeping the last real error';
end $$;

-- The admin retries it; a final failure stops at once.
select pg_temp.as_user('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com');
do $$ begin
  assert public.admin_media_retry(array['00000000-0000-0000-0000-0000000060c2',
                                        '00000000-0000-0000-0000-0000000060c1']::uuid[]) = 1,
    'retry takes the failed clip only';
  assert (select status = 'queued' and attempts = 0 and error is null
            from public.media_clips where id = '00000000-0000-0000-0000-0000000060c2'), 'fresh attempts';
end $$;

select pg_temp.as_service();
do $$
declare
  r record;
begin
  select * into r from public.media_render_claim(1) c;
  assert r.id = '00000000-0000-0000-0000-0000000060c2' and r.attempt = 1, 'claimed again';
  assert public.media_render_failed(r.id, 1, 'raw_missing', true) = true, 'final failure';
  assert (select status from public.media_clips where id = r.id) = 'failed', 'final means failed now';

  -- English that was there is never replaced by the Russian clip.
  update public.media_clips set status = 'rendering', attempts = 1 where id = r.id;
  assert public.media_render_done(r.id, 1, true), 'done';
  assert (select video_ru = 'storage:videos/shared/ms_press.ru.mp4'
                 and video_en = 'storage:videos/shared/ms_press.en.mp4'
            from public.exercises where id = 'ms_press'), 'video_en kept';
end $$;

-- A rendered clip that changes goes back to draft.
select pg_temp.as_user('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com');
do $$
declare
  v jsonb;
begin
  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c1', '{"grade":{"exposure":1}}');
  assert v ->> 'status' = 'draft' and (v ->> 'exercise_has_video')::boolean,
    'a changed done clip is a draft again, and the exercise has a video';
  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c2', '{"grade":{"exposure":0.5}}');
  assert v ->> 'status' = 'done', 'an unchanged save leaves a done clip done';
  assert public.admin_media_queue(array['00000000-0000-0000-0000-0000000060c1']::uuid[]) = 1,
    'the regraded clip queues again';
end $$;

-- A re-render refreshes the English copy the studio itself wrote (ms_squat had none before).
select pg_temp.as_service();
do $$
declare
  r record;
begin
  select * into r from public.media_render_claim(1) c;
  assert r.id = '00000000-0000-0000-0000-0000000060c1' and r.has_video_en = false,
    'the studio''s own English copy is the worker''s to refresh';
  -- The run dies; the admin may now change or delete the clip without waiting for the next run.
  update public.media_clips set claimed_until = now() - interval '1 second' where id = r.id;
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com');
do $$
declare
  v jsonb;
begin
  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c1', '{"grade":{"exposure":0.25}}');
  assert v ->> 'status' = 'rendering', 'a dead run''s clip can be edited and stays in line';
  -- Unlabelled, it could never be claimed: it goes back to draft instead of waiting forever.
  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c1', '{"exercise_id":null}');
  assert v ->> 'status' = 'draft', 'an unlabelled queued clip is a draft';
  assert (select not en_from_studio from public.media_clips
           where id = '00000000-0000-0000-0000-0000000060c1'),
    'relabelled: the old exercise''s English copy is no longer the studio''s';
  perform public.admin_media_delete_clip('00000000-0000-0000-0000-0000000060c1');
  assert not exists (select 1 from public.media_clips where id = '00000000-0000-0000-0000-0000000060c1'),
    'deleted';
end $$;

select pg_temp.as_service();
do $$ begin
  assert public.media_en_writable('ms_squat') = false,
    'with no clip owning it, the English copy is left alone';
  assert public.media_en_writable('ms_press') = false, 'a recording the studio did not write is kept';
end $$;

-- --- 0061: play mode, still frame, the auto pass --------------------------------------------------
select pg_temp.as_super();
insert into public.exercises (id, name_ru, unit) values ('ms_plank', 'Планка (студия)', 'seconds')
on conflict (id) do update set video_ru = null, video_en = null, video_mode = 'loop', unit = 'seconds';

select pg_temp.as_user('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com');
do $$
declare
  v jsonb;
begin
  v := public.admin_media_add_clip('00000000-0000-0000-0000-0000000060c3',
         '00000000-0000-0000-0000-000000006005',
         '00000000-0000-0000-0000-000000006005/00000000-0000-0000-0000-0000000060c3.mp4',
         0, 100, 110, 'ms_plank');
  assert v ->> 'play_mode' = 'loop' and (v ->> 'auto_enhance')::boolean
         and v -> 'still_at_s' = 'null'::jsonb and v -> 'auto_params' = 'null'::jsonb,
    'a new clip loops, with the auto pass on and no still frame';
  assert v ->> 'exercise_unit' = 'seconds', 'the clip carries its exercise''s unit for the preview';

  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c3',
         '{"play_mode":"still","still_at_s":2.5}');
  assert v ->> 'play_mode' = 'still' and (v ->> 'still_at_s')::numeric = 2.5, 'a still frame is saved';
  begin
    perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c3', '{"still_at_s":10.5}');
    raise exception 'a still frame past the clip''s end was accepted';
  exception when others then assert sqlerrm = 'invalid_still', sqlerrm; end;
  begin
    perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c3', '{"still_at_s":"1"}');
    raise exception 'a string still frame was accepted';
  exception when others then assert sqlerrm = 'invalid_still', sqlerrm; end;
  begin
    perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c3', '{"play_mode":"bounce"}');
    raise exception 'an unknown play mode was accepted';
  exception when others then assert sqlerrm = 'invalid_play_mode', sqlerrm; end;
  begin
    perform public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c3', '{"auto_enhance":"yes"}');
    raise exception 'a non-boolean auto switch was accepted';
  exception when others then assert sqlerrm = 'invalid_patch', sqlerrm; end;

  -- A resumed upload with a shorter span forgets a frame that is no longer inside it.
  v := public.admin_media_add_clip('00000000-0000-0000-0000-0000000060c3',
         '00000000-0000-0000-0000-000000006005',
         '00000000-0000-0000-0000-000000006005/00000000-0000-0000-0000-0000000060c3.mp4',
         0, 100, 102);
  assert v -> 'still_at_s' = 'null'::jsonb and v ->> 'play_mode' = 'still',
    'the frame outside the new span is forgotten, the mode kept';
  v := public.admin_media_add_clip('00000000-0000-0000-0000-0000000060c3',
         '00000000-0000-0000-0000-000000006005',
         '00000000-0000-0000-0000-000000006005/00000000-0000-0000-0000-0000000060c3.mp4',
         0, 100, 110);
  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c3',
         '{"play_mode":"once","still_at_s":null}');
  assert v ->> 'play_mode' = 'once' and v -> 'still_at_s' = 'null'::jsonb, 'once, no frame';

  -- Paste the auto switch alone; a clip that already has it does not count.
  assert public.admin_media_paste(array['00000000-0000-0000-0000-0000000060c3']::uuid[], null, null,
                                  false, false, 1, false) = 1, 'auto switched off by a paste';
  assert public.admin_media_paste(array['00000000-0000-0000-0000-0000000060c3']::uuid[], null, null,
                                  false, false, 1, false) = 0, 'the same paste again changes nothing';
  assert (select not auto_enhance and grade is null from public.media_clips
           where id = '00000000-0000-0000-0000-0000000060c3'), 'only the switch was pasted';
  assert public.admin_media_paste(array['00000000-0000-0000-0000-0000000060c3']::uuid[],
                                  '{"exposure":0.25}', null, true, false, 1, true) = 1,
    'grade and switch pasted together';
  assert (select auto_enhance and grade = '{"exposure":0.25}' from public.media_clips
           where id = '00000000-0000-0000-0000-0000000060c3'), 'both halves landed';
  assert public.admin_media_queue(array['00000000-0000-0000-0000-0000000060c3']::uuid[]) = 1, 'queued';
end $$;

select pg_temp.as_service();
do $$
declare
  r record;
begin
  select * into r from public.media_render_claim(5) c
   where c.id = '00000000-0000-0000-0000-0000000060c3';
  assert r.play_mode = 'once' and r.still_at_s is null and r.auto_enhance,
    'the worker is told the play mode, the frame and the auto switch';
  assert public.media_render_done(r.id, r.attempt, false,
           '{"v":1,"lo":[0.02,0.02,0.02],"hi":[0.95,0.95,0.95]}') = true, 'done with the auto values';
  assert (select auto_params ->> 'v' = '1' from public.media_clips where id = r.id),
    'the computed auto values are kept on the clip';
  assert (select video_mode = 'fit' from public.exercises where id = 'ms_plank'),
    'once → the exercise holds its last frame (fit)';
end $$;

-- Back to a still: a changed done clip is a draft; rendered again, the exercise loops.
select pg_temp.as_user('00000000-0000-0000-0000-0000000060a1', 'ms-admin@example.com');
do $$
declare
  v jsonb;
begin
  v := public.admin_media_save_clip('00000000-0000-0000-0000-0000000060c3', '{"play_mode":"still"}');
  assert v ->> 'status' = 'draft', 'a new play mode makes a done clip a draft';
  perform public.admin_media_queue(array['00000000-0000-0000-0000-0000000060c3']::uuid[]);
end $$;

select pg_temp.as_service();
do $$
declare
  r record;
begin
  select * into r from public.media_render_claim(5) c
   where c.id = '00000000-0000-0000-0000-0000000060c3';
  assert r.play_mode = 'still', 'claimed as a still';
  -- Anything but a small object is not kept as the auto values.
  assert public.media_render_done(r.id, r.attempt, false, '[1,2,3]') = true, 'done';
  assert (select auto_params is null from public.media_clips where id = r.id),
    'auto values that are not an object are dropped';
  assert (select video_mode = 'loop' from public.exercises where id = 'ms_plank'), 'still → loop';
  assert public.media_video_mode('loop') = 'loop' and public.media_video_mode('once') = 'fit'
         and public.media_video_mode('still') = 'loop', 'the play mode mapping';
end $$;

-- --- clean up -------------------------------------------------------------------------------------
select pg_temp.as_super();
delete from public.media_sources where id = '00000000-0000-0000-0000-000000006005';
delete from storage.objects where bucket_id = 'raw' and name like 'ms-src/%';
delete from public.exercises where id in ('ms_squat', 'ms_press', 'ms_plank');
delete from public.admins where email = 'ms-admin@example.com';

\echo 99_media_studio: ALL TESTS PASSED
