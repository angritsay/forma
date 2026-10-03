-- =============================================================================
-- 0060 — «Студия»: a filmed workout cut into exercise clips, graded, rendered by a worker.
--
-- The owner films a whole workout on a tripod. In the admin she marks one piece per exercise,
-- labels it, frames it (crop) and grades it (colour); a worker in GitHub Actions
-- (`media-render.yml` → `scripts/media/render-clips.mjs`) encodes each piece into the exercise's
-- clip, still and loop. The phone never encodes: it only cuts the long file by stream copy and
-- uploads the pieces here.
--
--   1. Bucket `raw` — private, admins only (read and write), video/* up to 500 MB a file. The
--      pieces as uploaded: `raw/<source_id>/<clip_id>.<ext>`.
--   2. `media_sources` — one filmed video, as the admin picked it.
--   3. `media_clips` — one piece of it: which exercise, where it starts and ends, crop, grade,
--      and where it is in the render queue:
--        draft → queued → rendering → done
--                   ↑         ↓
--                   └─ (attempt < 3) ─ failed
--      `raw_offset_s` is where the exercise starts inside the uploaded piece: the phone cuts at
--      the keyframe before `start_s` (stream copy cannot cut anywhere else) plus a little pad, so
--      the piece runs from `start_s − raw_offset_s` in the source. The worker trims exactly from
--      `raw_offset_s` for `end_s − start_s` seconds.
--   4. Admin RPCs: list sources and clips, save a source, add a clip, save a clip (label, crop,
--      grade), paste a grade and/or crop onto many, queue, retry, delete. Each checks is_admin().
--   5. Worker RPCs (service role only): claim a batch with a lease (`for update skip locked`, the
--      way 0059 claims the outbox), done (writes the exercise's video_ru/video_en) and failed
--      (requeues until the third attempt). A finished call carries the attempt it claimed, so a
--      run whose lease ran out and was taken over cannot overwrite the run that took it.
--
-- Requires 0001 (is_admin, set_updated_at), 0003 (storage), 0006 (exercises). Not destructive.
-- Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Bucket `raw`: private, admin-only, video/* up to 500 MB.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('raw', 'raw', false, 524288000, array['video/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Unlike `videos`, nobody but an admin reads these: they are unedited footage, not lessons.
drop policy if exists "raw: admin select" on storage.objects;
create policy "raw: admin select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'raw' and public.is_admin());

drop policy if exists "raw: admin insert" on storage.objects;
create policy "raw: admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'raw' and public.is_admin());

drop policy if exists "raw: admin update" on storage.objects;
create policy "raw: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'raw' and public.is_admin())
  with check (bucket_id = 'raw' and public.is_admin());

drop policy if exists "raw: admin delete" on storage.objects;
create policy "raw: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'raw' and public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. Tables.
-- -----------------------------------------------------------------------------
create table if not exists public.media_sources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '' check (char_length(title) <= 200),
  file_name   text check (file_name is null or char_length(file_name) <= 300),
  duration_s  numeric check (duration_s is null or (duration_s >= 0 and duration_s <= 86400)),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

comment on table public.media_sources is
  'A filmed video the admin cut into clips in «Студия» (0060). The file itself never leaves her device; only its pieces are uploaded (media_clips.raw_path).';

create table if not exists public.media_clips (
  id             uuid primary key default gen_random_uuid(),
  source_id      uuid not null references public.media_sources (id) on delete cascade,
  exercise_id    text references public.exercises (id) on delete set null,
  raw_path       text not null
                 check (raw_path ~ '^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*\.[A-Za-z0-9]{2,5}$'),
  raw_offset_s   numeric not null default 0 check (raw_offset_s >= 0 and raw_offset_s <= 60),
  start_s        numeric not null check (start_s >= 0),
  end_s          numeric not null,
  crop           jsonb,
  grade          jsonb,
  grade_version  int not null default 1 check (grade_version between 1 and 1000),
  status         text not null default 'draft'
                 check (status in ('draft', 'queued', 'rendering', 'done', 'failed')),
  error          text check (error is null or char_length(error) <= 500),
  attempts       int not null default 0 check (attempts >= 0),
  claimed_until  timestamptz,
  rendered_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint media_clips_span check (end_s > start_s and end_s - start_s <= 600),
  constraint media_clips_crop_shape check (crop is null or jsonb_typeof(crop) = 'object'),
  constraint media_clips_grade_shape check (
    grade is null or (jsonb_typeof(grade) = 'object' and octet_length(grade::text) <= 16384)
  )
);

comment on table public.media_clips is
  'One exercise cut out of a media_sources video (0060): label, crop, grade and render status. Rendered by scripts/media/render-clips.mjs into videos/shared/<exercise>.ru.mp4, its still and loop.';
comment on column public.media_clips.raw_offset_s is
  'Seconds into the uploaded piece where start_s is: the piece starts at the keyframe before start_s. The worker trims from here.';
comment on column public.media_clips.crop is
  'Normalised crop {x,y,w,h} in 0..1 of the displayed frame (src/lib/media/crop.ts). Null — the whole frame.';
comment on column public.media_clips.grade is
  'Colour grade parameters (src/lib/media/grade.ts GradeParams). Null — no grade.';
comment on column public.media_clips.grade_version is
  'Version of the grade math the parameters were made for (GRADE_VERSION). The worker refuses one it does not know.';
comment on column public.media_clips.claimed_until is
  'A worker run is rendering this clip until then (lease). A run that dies leaves it to the next one.';

create index if not exists media_clips_source_idx on public.media_clips (source_id, start_s);
create index if not exists media_clips_queue_idx on public.media_clips (status, updated_at)
  where status in ('queued', 'rendering');

drop trigger if exists media_clips_touch on public.media_clips;
create trigger media_clips_touch
  before update on public.media_clips
  for each row execute function public.set_updated_at();

alter table public.media_sources enable row level security;
alter table public.media_clips enable row level security;

-- Admins may read the rows directly (a status poll is one select); every write goes through the
-- functions below, which check what a plain update could not.
drop policy if exists "media_sources: admins" on public.media_sources;
drop policy if exists "media_sources: admins read" on public.media_sources;
create policy "media_sources: admins read"
  on public.media_sources for select
  to authenticated
  using (public.is_admin());

drop policy if exists "media_clips: admins" on public.media_clips;
drop policy if exists "media_clips: admins read" on public.media_clips;
create policy "media_clips: admins read"
  on public.media_clips for select
  to authenticated
  using (public.is_admin());

revoke all on public.media_sources, public.media_clips from anon, authenticated;
grant select on public.media_sources, public.media_clips to authenticated;
grant select, insert, update, delete on public.media_sources, public.media_clips to service_role;

-- -----------------------------------------------------------------------------
-- 3. Helpers.
-- -----------------------------------------------------------------------------

/* How many times a clip is tried before it stays `failed` until the admin retries it. */
create or replace function public.media_render_max_attempts()
returns int
language sql
immutable
set search_path = pg_catalog, public, extensions
as $$ select 3 $$;

revoke execute on function public.media_render_max_attempts() from public, anon;
grant execute on function public.media_render_max_attempts() to authenticated, service_role;

/*
 * A crop as stored: {x,y,w,h} finite numbers inside 0..1, at least 5% a side, inside the frame.
 * Null passes (the whole frame). The client clamps the same way (src/lib/media/crop.ts); this is
 * the check, not the clamp, so a bad crop is refused rather than silently changed.
 */
create or replace function public.media_crop_valid(p_crop jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog, public, extensions
as $$
declare
  v_x numeric; v_y numeric; v_w numeric; v_h numeric;
begin
  if p_crop is null then return true; end if;
  if jsonb_typeof(p_crop) <> 'object' then return false; end if;
  if jsonb_typeof(p_crop -> 'x') <> 'number' or jsonb_typeof(p_crop -> 'y') <> 'number'
     or jsonb_typeof(p_crop -> 'w') <> 'number' or jsonb_typeof(p_crop -> 'h') <> 'number' then
    return false;
  end if;
  v_x := (p_crop ->> 'x')::numeric; v_y := (p_crop ->> 'y')::numeric;
  v_w := (p_crop ->> 'w')::numeric; v_h := (p_crop ->> 'h')::numeric;
  return v_x >= 0 and v_y >= 0 and v_w >= 0.05 and v_h >= 0.05
     and v_x + v_w <= 1.000001 and v_y + v_h <= 1.000001;
end;
$$;

revoke execute on function public.media_crop_valid(jsonb) from public, anon;
grant execute on function public.media_crop_valid(jsonb) to authenticated, service_role;

/* One clip as the admin screens read it (snake_case; src/lib/api/mediaStudio.ts maps it). */
create or replace function public.media_clip_json(p_clip public.media_clips)
returns jsonb
language sql
stable
set search_path = pg_catalog, public, extensions
as $$
  select jsonb_build_object(
    'id', p_clip.id,
    'source_id', p_clip.source_id,
    'exercise_id', p_clip.exercise_id,
    'exercise_name', e.name_ru,
    'exercise_has_video', nullif(btrim(e.video_ru), '') is not null,
    'raw_path', p_clip.raw_path,
    'raw_offset_s', p_clip.raw_offset_s,
    'start_s', p_clip.start_s,
    'end_s', p_clip.end_s,
    'crop', p_clip.crop,
    'grade', p_clip.grade,
    'grade_version', p_clip.grade_version,
    'status', p_clip.status,
    'error', p_clip.error,
    'attempts', p_clip.attempts,
    'rendered_at', p_clip.rendered_at,
    'created_at', p_clip.created_at,
    'updated_at', p_clip.updated_at
  )
  from (select 1) one
  left join public.exercises e on e.id = p_clip.exercise_id;
$$;

revoke execute on function public.media_clip_json(public.media_clips) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Admin RPCs.
-- -----------------------------------------------------------------------------

/* Sources, newest first, with how many of their clips are in each state. */
create or replace function public.admin_media_sources()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', s.id,
             'title', s.title,
             'file_name', s.file_name,
             'duration_s', s.duration_s,
             'created_at', s.created_at,
             'clips', coalesce(c.total, 0),
             'done', coalesce(c.done, 0),
             'queued', coalesce(c.queued, 0),
             'failed', coalesce(c.failed, 0)
           ) order by s.created_at desc, s.id)
    from public.media_sources s
    left join lateral (
      select count(*) as total,
             count(*) filter (where m.status = 'done') as done,
             count(*) filter (where m.status in ('queued', 'rendering')) as queued,
             count(*) filter (where m.status = 'failed') as failed
      from public.media_clips m where m.source_id = s.id
    ) c on true
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.admin_media_sources() from public, anon;
grant execute on function public.admin_media_sources() to authenticated;

/*
 * Create a source (p_id null, or an id not seen yet — the client may pick it up front) or update
 * its title. Null leaves a field as it is. Answers the id.
 */
create or replace function public.admin_media_save_source(
  p_id         uuid default null,
  p_title      text default null,
  p_file_name  text default null,
  p_duration_s numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_title is not null and char_length(btrim(p_title)) > 200 then
    raise exception 'invalid_title' using errcode = 'P0001';
  end if;
  if p_duration_s is not null and (p_duration_s < 0 or p_duration_s > 86400) then
    raise exception 'invalid_duration' using errcode = 'P0001';
  end if;
  insert into public.media_sources (id, title, file_name, duration_s, created_by)
  values (v_id, coalesce(btrim(p_title), ''), left(nullif(btrim(p_file_name), ''), 300),
          p_duration_s, auth.uid())
  on conflict (id) do update
    set title = coalesce(btrim(p_title), media_sources.title),
        file_name = coalesce(left(nullif(btrim(p_file_name), ''), 300), media_sources.file_name),
        duration_s = coalesce(p_duration_s, media_sources.duration_s);
  return v_id;
end;
$$;

revoke execute on function public.admin_media_save_source(uuid, text, text, numeric) from public, anon;
grant execute on function public.admin_media_save_source(uuid, text, text, numeric) to authenticated;

/* Clips of one source (or of every source when null), in source order. */
create or replace function public.admin_media_clips(p_source_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(public.media_clip_json(c) order by c.source_id, c.start_s, c.id)
    from public.media_clips c
    where p_source_id is null or c.source_id = p_source_id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.admin_media_clips(uuid) from public, anon;
grant execute on function public.admin_media_clips(uuid) to authenticated;

/*
 * Register an uploaded piece. The client picks the id before uploading (it is part of the raw
 * path), so a resumed upload calls this again with the same id: a draft or failed clip gets the
 * new timing, anything further along is left alone and answered as it is.
 */
create or replace function public.admin_media_add_clip(
  p_id           uuid,
  p_source_id    uuid,
  p_raw_path     text,
  p_raw_offset_s numeric,
  p_start_s      numeric,
  p_end_s        numeric,
  p_exercise_id  text default null,
  p_crop         jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_clip public.media_clips%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_id is null then
    raise exception 'invalid_id' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.media_sources where id = p_source_id) then
    raise exception 'unknown_source' using errcode = 'P0001';
  end if;
  if p_raw_path is null
     or p_raw_path !~ '^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*\.[A-Za-z0-9]{2,5}$' then
    raise exception 'invalid_raw_path' using errcode = 'P0001';
  end if;
  if p_start_s is null or p_end_s is null or p_start_s < 0 or p_end_s <= p_start_s
     or p_end_s - p_start_s > 600
     or coalesce(p_raw_offset_s, 0) < 0 or coalesce(p_raw_offset_s, 0) > 60 then
    raise exception 'invalid_span' using errcode = 'P0001';
  end if;
  if p_exercise_id is not null and not exists (select 1 from public.exercises where id = p_exercise_id) then
    raise exception 'unknown_exercise' using errcode = 'P0001';
  end if;
  if not public.media_crop_valid(p_crop) then
    raise exception 'invalid_crop' using errcode = 'P0001';
  end if;

  insert into public.media_clips as m
    (id, source_id, exercise_id, raw_path, raw_offset_s, start_s, end_s, crop)
  values (p_id, p_source_id, p_exercise_id, p_raw_path, coalesce(p_raw_offset_s, 0),
          p_start_s, p_end_s, p_crop)
  on conflict (id) do update
    set raw_path = excluded.raw_path,
        raw_offset_s = excluded.raw_offset_s,
        start_s = excluded.start_s,
        end_s = excluded.end_s,
        exercise_id = coalesce(excluded.exercise_id, m.exercise_id),
        crop = coalesce(excluded.crop, m.crop)
    where m.status in ('draft', 'failed') and m.source_id = excluded.source_id;

  select * into v_clip from public.media_clips where id = p_id;
  if v_clip.source_id is distinct from p_source_id then
    raise exception 'clip_conflict' using errcode = 'P0001';
  end if;
  return public.media_clip_json(v_clip);
end;
$$;

revoke execute on function public.admin_media_add_clip(uuid, uuid, text, numeric, numeric, numeric, text, jsonb) from public, anon;
grant execute on function public.admin_media_add_clip(uuid, uuid, text, numeric, numeric, numeric, text, jsonb) to authenticated;

/*
 * Save what the admin edits on a clip. `p_patch` carries only the keys being changed:
 *   exercise_id (text or null), crop (object or null), grade (object or null), grade_version (int).
 * A clip being rendered is refused (`clip_busy`). A rendered clip that changes goes back to draft:
 * what is in the library no longer matches it until it is queued again.
 */
create or replace function public.admin_media_save_clip(p_id uuid, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_old public.media_clips%rowtype;
  v_new public.media_clips%rowtype;
  v_ex  text;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'invalid_patch' using errcode = 'P0001';
  end if;
  select * into v_old from public.media_clips where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if v_old.status = 'rendering' then
    raise exception 'clip_busy' using errcode = 'P0001';
  end if;

  v_new := v_old;
  if p_patch ? 'exercise_id' then
    v_ex := nullif(p_patch ->> 'exercise_id', '');
    if v_ex is not null and not exists (select 1 from public.exercises where id = v_ex) then
      raise exception 'unknown_exercise' using errcode = 'P0001';
    end if;
    v_new.exercise_id := v_ex;
  end if;
  if p_patch ? 'crop' then
    if jsonb_typeof(p_patch -> 'crop') = 'null' then
      v_new.crop := null;
    elsif public.media_crop_valid(p_patch -> 'crop') then
      v_new.crop := p_patch -> 'crop';
    else
      raise exception 'invalid_crop' using errcode = 'P0001';
    end if;
  end if;
  if p_patch ? 'grade' then
    if jsonb_typeof(p_patch -> 'grade') = 'null' then
      v_new.grade := null;
    elsif jsonb_typeof(p_patch -> 'grade') = 'object'
          and octet_length((p_patch -> 'grade')::text) <= 16384 then
      v_new.grade := p_patch -> 'grade';
    else
      raise exception 'invalid_grade' using errcode = 'P0001';
    end if;
  end if;
  if p_patch ? 'grade_version' then
    if jsonb_typeof(p_patch -> 'grade_version') <> 'number'
       or (p_patch ->> 'grade_version')::numeric not between 1 and 1000 then
      raise exception 'invalid_grade' using errcode = 'P0001';
    end if;
    v_new.grade_version := (p_patch ->> 'grade_version')::numeric::int;
  end if;

  update public.media_clips c
     set exercise_id = v_new.exercise_id,
         crop = v_new.crop,
         grade = v_new.grade,
         grade_version = v_new.grade_version,
         status = case
                    when c.status = 'done'
                         and (v_new.exercise_id, v_new.crop, v_new.grade, v_new.grade_version)
                             is distinct from (v_old.exercise_id, v_old.crop, v_old.grade, v_old.grade_version)
                      then 'draft'
                    else c.status
                  end
   where c.id = p_id
  returning * into v_new;
  return public.media_clip_json(v_new);
end;
$$;

revoke execute on function public.admin_media_save_clip(uuid, jsonb) from public, anon;
grant execute on function public.admin_media_save_clip(uuid, jsonb) to authenticated;

/*
 * Paste a copied grade and/or crop onto many clips at once. `p_with_grade` / `p_with_crop` say
 * which halves are pasted (null values clear them). Clips being rendered are skipped; rendered
 * clips that change go back to draft, as in save. Answers how many clips were changed.
 */
create or replace function public.admin_media_paste(
  p_ids           uuid[],
  p_grade         jsonb default null,
  p_crop          jsonb default null,
  p_with_grade    boolean default true,
  p_with_crop     boolean default false,
  p_grade_version int default 1
)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_n int;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_ids), 0) = 0 then
    return 0;
  end if;
  if cardinality(p_ids) > 500 then
    raise exception 'too_many' using errcode = 'P0001';
  end if;
  if coalesce(p_with_grade, false) and p_grade is not null
     and (jsonb_typeof(p_grade) <> 'object' or octet_length(p_grade::text) > 16384) then
    raise exception 'invalid_grade' using errcode = 'P0001';
  end if;
  if coalesce(p_with_grade, false) and coalesce(p_grade_version, 0) not between 1 and 1000 then
    raise exception 'invalid_grade' using errcode = 'P0001';
  end if;
  if coalesce(p_with_crop, false) and not public.media_crop_valid(p_crop) then
    raise exception 'invalid_crop' using errcode = 'P0001';
  end if;
  if not coalesce(p_with_grade, false) and not coalesce(p_with_crop, false) then
    return 0;
  end if;

  with changed as (
    update public.media_clips c
       set grade = case when p_with_grade then p_grade else c.grade end,
           grade_version = case when p_with_grade then p_grade_version else c.grade_version end,
           crop = case when p_with_crop then p_crop else c.crop end,
           status = case when c.status = 'done' then 'draft' else c.status end
     where c.id = any (p_ids)
       and c.status <> 'rendering'
       and (
         (p_with_grade and (c.grade, c.grade_version) is distinct from (p_grade, p_grade_version))
         or (p_with_crop and c.crop is distinct from p_crop)
       )
    returning 1
  )
  select count(*) into v_n from changed;
  return v_n;
end;
$$;

revoke execute on function public.admin_media_paste(uuid[], jsonb, jsonb, boolean, boolean, int) from public, anon;
grant execute on function public.admin_media_paste(uuid[], jsonb, jsonb, boolean, boolean, int) to authenticated;

/*
 * Send clips to the worker. Only labelled clips in draft, done or failed are queued (a fresh
 * count of attempts, the old error cleared); the rest are left as they are. Answers how many.
 */
create or replace function public.admin_media_queue(p_ids uuid[])
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_n int;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_ids), 0) = 0 then
    return 0;
  end if;
  with queued as (
    update public.media_clips c
       set status = 'queued', attempts = 0, error = null, claimed_until = null
     where c.id = any (p_ids)
       and c.status in ('draft', 'done', 'failed')
       and c.exercise_id is not null
    returning 1
  )
  select count(*) into v_n from queued;
  return v_n;
end;
$$;

revoke execute on function public.admin_media_queue(uuid[]) from public, anon;
grant execute on function public.admin_media_queue(uuid[]) to authenticated;

/* Put failed clips back in the queue with a fresh count of attempts. Answers how many. */
create or replace function public.admin_media_retry(p_ids uuid[])
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_n int;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_ids), 0) = 0 then
    return 0;
  end if;
  with retried as (
    update public.media_clips c
       set status = 'queued', attempts = 0, error = null, claimed_until = null
     where c.id = any (p_ids)
       and c.status = 'failed'
       and c.exercise_id is not null
    returning 1
  )
  select count(*) into v_n from retried;
  return v_n;
end;
$$;

revoke execute on function public.admin_media_retry(uuid[]) from public, anon;
grant execute on function public.admin_media_retry(uuid[]) to authenticated;

/*
 * Forget a clip (not while it renders). The raw piece in storage is the client's to delete, with
 * the same admin rights; the exercise keeps whatever was already rendered onto it.
 */
create or replace function public.admin_media_delete_clip(p_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  select status into v_status from public.media_clips where id = p_id for update;
  if not found then
    return;
  end if;
  if v_status = 'rendering' then
    raise exception 'clip_busy' using errcode = 'P0001';
  end if;
  delete from public.media_clips where id = p_id;
end;
$$;

revoke execute on function public.admin_media_delete_clip(uuid) from public, anon;
grant execute on function public.admin_media_delete_clip(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Worker RPCs (service role only).
-- -----------------------------------------------------------------------------

/*
 * Claim up to p_limit clips: queued ones, and ones whose run died (still `rendering`, lease run
 * out) with attempts left. Locked with `for update skip locked` and stamped in one statement, so
 * two overlapping runs never take the same clip. Each claim counts as an attempt. A dead run's
 * clip with no attempts left is marked failed here instead of being taken again.
 *
 * Thirty minutes by default: longer than a run (the workflow stops at 25), so a live run is never
 * overtaken, and a dead run's clip goes out with a run soon after.
 */
create or replace function public.media_render_claim(
  p_limit         int default 1,
  p_lease_seconds int default 1800
)
returns table (
  id            uuid,
  exercise_id   text,
  raw_path      text,
  raw_offset_s  numeric,
  start_s       numeric,
  end_s         numeric,
  crop          jsonb,
  grade         jsonb,
  grade_version int,
  attempt       int,
  has_video_en  boolean
)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_max int := public.media_render_max_attempts();
begin
  -- Runs that died on their last attempt: failed, said so, out of the queue.
  with dead as (
    select c.id from public.media_clips c
     where c.status = 'rendering' and c.claimed_until < now() and c.attempts >= v_max
     for update of c skip locked
  )
  update public.media_clips m
     set status = 'failed', claimed_until = null,
         error = coalesce(m.error, 'render_timeout')
    from dead where m.id = dead.id;

  return query
  with due as (
    select c.id, c.updated_at
      from public.media_clips c
     where c.exercise_id is not null
       and c.attempts < v_max
       and (c.status = 'queued'
            or (c.status = 'rendering' and c.claimed_until < now()))
     order by c.updated_at, c.id
     limit least(greatest(coalesce(p_limit, 1), 1), 20)
     for update of c skip locked
  ),
  claimed as (
    update public.media_clips m
       set status = 'rendering',
           attempts = m.attempts + 1,
           claimed_until = now()
             + make_interval(secs => least(greatest(coalesce(p_lease_seconds, 1800), 60), 7200))
      from due
     where m.id = due.id
    returning m.*
  )
  select c.id, c.exercise_id, c.raw_path, c.raw_offset_s, c.start_s, c.end_s, c.crop, c.grade,
         c.grade_version, c.attempts,
         nullif(btrim(e.video_en), '') is not null
    from claimed c
    join due d on d.id = c.id
    left join public.exercises e on e.id = c.exercise_id
   order by d.updated_at, c.id;
end;
$$;

revoke execute on function public.media_render_claim(int, int) from public, anon, authenticated;
grant execute on function public.media_render_claim(int, int) to service_role;

/*
 * The worker uploaded the clip to videos/shared/<exercise>.ru.mp4 (and .en.mp4 when p_with_en).
 * Points the exercise at it — video_en only when it had none, so an English recording is never
 * replaced by the silent Russian one — and marks the clip done. Only the run holding the current
 * attempt can finish it; any other call answers false and changes nothing.
 */
create or replace function public.media_render_done(
  p_id      uuid,
  p_attempt int,
  p_with_en boolean default false
)
returns boolean
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_ex text;
begin
  update public.media_clips c
     set status = 'done', error = null, claimed_until = null, rendered_at = now()
   where c.id = p_id and c.status = 'rendering' and c.attempts = p_attempt
  returning c.exercise_id into v_ex;
  if not found then
    return false;
  end if;
  update public.exercises e
     set video_ru = 'storage:videos/shared/' || e.id || '.ru.mp4',
         video_en = case
                      when coalesce(p_with_en, false) and coalesce(btrim(e.video_en), '') = ''
                        then 'storage:videos/shared/' || e.id || '.en.mp4'
                      else e.video_en
                    end
   where e.id = v_ex;
  return true;
end;
$$;

revoke execute on function public.media_render_done(uuid, int, boolean) from public, anon, authenticated;
grant execute on function public.media_render_done(uuid, int, boolean) to service_role;

/*
 * The worker could not render the clip. Back to the queue while attempts remain, unless
 * `p_final` (an error a retry cannot fix: the raw piece is missing, the grade version unknown);
 * otherwise failed, with the short error the admin sees. Same attempt check as done.
 */
create or replace function public.media_render_failed(
  p_id      uuid,
  p_attempt int,
  p_error   text,
  p_final   boolean default false
)
returns boolean
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  update public.media_clips c
     set status = case
                    when coalesce(p_final, false) or c.attempts >= public.media_render_max_attempts()
                      then 'failed'
                    else 'queued'
                  end,
         error = left(coalesce(nullif(btrim(p_error), ''), 'render_failed'), 500),
         claimed_until = null
   where c.id = p_id and c.status = 'rendering' and c.attempts = p_attempt;
  return found;
end;
$$;

revoke execute on function public.media_render_failed(uuid, int, text, boolean) from public, anon, authenticated;
grant execute on function public.media_render_failed(uuid, int, text, boolean) to service_role;

/* How many clips a run would claim now — the workflow skips installing ffmpeg when it is 0. */
create or replace function public.media_render_pending()
returns int
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select count(*)::int
    from public.media_clips c
   where c.exercise_id is not null
     and c.attempts < public.media_render_max_attempts()
     and (c.status = 'queued' or (c.status = 'rendering' and c.claimed_until < now()));
$$;

revoke execute on function public.media_render_pending() from public, anon, authenticated;
grant execute on function public.media_render_pending() to service_role;
