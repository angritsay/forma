-- =============================================================================
-- 0061 — «Студия» v2: cut → name → colour → preview.
--
-- The studio of 0060 did cut, label and frame on one screen and colour on another. It is now four
-- steps per filmed video («Нарезка · Названия · Цвет · Превью»), and each clip carries three more
-- decisions the worker honours:
--
--   1. `play_mode` — how the exercise's clip runs in the player:
--        loop  — repeated while the step lasts (exercises.video_mode = 'loop');
--        once  — played once and held on its last frame (video_mode = 'fit', 0048);
--        still — one chosen frame (`still_at_s`, seconds into the clip) rendered as a 3-second
--                clip and as the still; played as a loop of a picture that does not move.
--   2. `auto_enhance` — the worker's automatic pass (levels, white balance, exposure, a mild
--      S-curve, vibrance; src/lib/media/autoEnhance.ts) composed into the same LUT as the manual
--      grade, plus a light denoise and sharpen. On by default.
--   3. `auto_params` — what that pass computed for the clip, written back by the worker so a render
--      can be reproduced and the admin's preview can show exactly it.
--
-- RPCs: `admin_media_save_clip` and `admin_media_paste` take the new fields, `media_clip_json`
-- answers them (and the exercise's unit, which the preview needs: a timer or a rep count),
-- `media_render_claim` hands them to the worker, and `media_render_done` stores `auto_params` and
-- sets the exercise's `video_mode` from the play mode.
--
-- Requires 0048 (exercises.video_mode) and 0060. Additive, not destructive. Idempotent. The
-- functions whose arguments or result change are dropped and created again (a `create or replace`
-- with other arguments would add an overload and make every existing call ambiguous).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Columns.
-- -----------------------------------------------------------------------------
alter table public.media_clips add column if not exists play_mode text not null default 'loop';
alter table public.media_clips add column if not exists still_at_s numeric;
alter table public.media_clips add column if not exists auto_enhance boolean not null default true;
alter table public.media_clips add column if not exists auto_params jsonb;

alter table public.media_clips drop constraint if exists media_clips_play_mode_check;
alter table public.media_clips add constraint media_clips_play_mode_check
  check (play_mode in ('loop', 'once', 'still'));
alter table public.media_clips drop constraint if exists media_clips_still_at;
alter table public.media_clips add constraint media_clips_still_at
  check (still_at_s is null or (still_at_s >= 0 and still_at_s <= end_s - start_s));
alter table public.media_clips drop constraint if exists media_clips_auto_params_shape;
alter table public.media_clips add constraint media_clips_auto_params_shape check (
  auto_params is null or (jsonb_typeof(auto_params) = 'object' and octet_length(auto_params::text) <= 4096)
);

comment on column public.media_clips.play_mode is
  'How the clip runs in the player: loop, once (held on the last frame: exercises.video_mode = fit) or still (one frame, still_at_s).';
comment on column public.media_clips.still_at_s is
  'The frame a still clip shows, seconds from the clip''s start (0 … end_s − start_s). Null — the worker''s default (45%).';
comment on column public.media_clips.auto_enhance is
  'Run the automatic pass (src/lib/media/autoEnhance.ts) before the manual grade, plus a light denoise and sharpen.';
comment on column public.media_clips.auto_params is
  'What the automatic pass computed at the last render (AutoParams), kept for reproducibility. Null — not rendered with it yet.';

-- -----------------------------------------------------------------------------
-- 2. Helpers.
-- -----------------------------------------------------------------------------

/* The exercise video_mode a play mode renders to (src/lib/api/mediaStudio.ts videoModeForPlayMode). */
create or replace function public.media_video_mode(p_play_mode text)
returns text
language sql
immutable
set search_path = pg_catalog, public, extensions
as $$ select case when p_play_mode = 'once' then 'fit' else 'loop' end $$;

revoke execute on function public.media_video_mode(text) from public, anon;
grant execute on function public.media_video_mode(text) to authenticated, service_role;

/* One clip as the admin screens read it — 0060's shape plus the fields of this migration. */
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
    'exercise_unit', e.unit,
    'exercise_has_video', nullif(btrim(e.video_ru), '') is not null,
    'raw_path', p_clip.raw_path,
    'raw_offset_s', p_clip.raw_offset_s,
    'start_s', p_clip.start_s,
    'end_s', p_clip.end_s,
    'crop', p_clip.crop,
    'grade', p_clip.grade,
    'grade_version', p_clip.grade_version,
    'play_mode', p_clip.play_mode,
    'still_at_s', p_clip.still_at_s,
    'auto_enhance', p_clip.auto_enhance,
    'auto_params', p_clip.auto_params,
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
-- 3. Admin RPCs.
-- -----------------------------------------------------------------------------

/*
 * 0060's add, unchanged but for one line: a re-registered piece whose span got shorter than its
 * chosen still frame forgets the frame instead of failing the span check.
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
        crop = coalesce(excluded.crop, m.crop),
        still_at_s = case when m.still_at_s <= excluded.end_s - excluded.start_s
                          then m.still_at_s end
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
 *   exercise_id (text or null), crop (object or null), grade (object or null), grade_version (int),
 *   play_mode ('loop' | 'once' | 'still'), still_at_s (number inside the clip, or null),
 *   auto_enhance (boolean).
 * As in 0060: a clip a live run renders is refused (`clip_busy`); a rendered clip that changes
 * goes back to draft; an unlabelled queued clip goes back to draft.
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
  v_at  numeric;
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
  if v_old.status = 'rendering' and v_old.claimed_until >= now() then
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
    if jsonb_typeof(p_patch -> 'grade_version') is distinct from 'number'
       or (p_patch ->> 'grade_version')::numeric not between 1 and 1000 then
      raise exception 'invalid_grade' using errcode = 'P0001';
    end if;
    v_new.grade_version := (p_patch ->> 'grade_version')::numeric::int;
  end if;
  if p_patch ? 'play_mode' then
    if jsonb_typeof(p_patch -> 'play_mode') is distinct from 'string'
       or (p_patch ->> 'play_mode') not in ('loop', 'once', 'still') then
      raise exception 'invalid_play_mode' using errcode = 'P0001';
    end if;
    v_new.play_mode := p_patch ->> 'play_mode';
  end if;
  if p_patch ? 'still_at_s' then
    if jsonb_typeof(p_patch -> 'still_at_s') = 'null' then
      v_new.still_at_s := null;
    elsif jsonb_typeof(p_patch -> 'still_at_s') = 'number' then
      v_at := (p_patch ->> 'still_at_s')::numeric;
      if v_at < 0 or v_at > v_old.end_s - v_old.start_s then
        raise exception 'invalid_still' using errcode = 'P0001';
      end if;
      -- Rounded the way the client sends it, never past the clip's end.
      v_new.still_at_s := least(round(v_at, 3), v_old.end_s - v_old.start_s);
    else
      raise exception 'invalid_still' using errcode = 'P0001';
    end if;
  end if;
  if p_patch ? 'auto_enhance' then
    if jsonb_typeof(p_patch -> 'auto_enhance') is distinct from 'boolean' then
      raise exception 'invalid_patch' using errcode = 'P0001';
    end if;
    v_new.auto_enhance := (p_patch ->> 'auto_enhance')::boolean;
  end if;

  update public.media_clips c
     set exercise_id = v_new.exercise_id,
         crop = v_new.crop,
         grade = v_new.grade,
         grade_version = v_new.grade_version,
         play_mode = v_new.play_mode,
         still_at_s = v_new.still_at_s,
         auto_enhance = v_new.auto_enhance,
         en_from_studio = c.en_from_studio and v_new.exercise_id is not distinct from v_old.exercise_id,
         status = case
                    when c.status = 'done'
                         and (v_new.exercise_id, v_new.crop, v_new.grade, v_new.grade_version,
                              v_new.play_mode, v_new.still_at_s, v_new.auto_enhance)
                             is distinct from
                             (v_old.exercise_id, v_old.crop, v_old.grade, v_old.grade_version,
                              v_old.play_mode, v_old.still_at_s, v_old.auto_enhance)
                      then 'draft'
                    when c.status in ('queued', 'rendering') and v_new.exercise_id is null
                      then 'draft'
                    else c.status
                  end,
         claimed_until = case when v_new.exercise_id is null then null else c.claimed_until end
   where c.id = p_id
  returning * into v_new;
  return public.media_clip_json(v_new);
end;
$$;

revoke execute on function public.admin_media_save_clip(uuid, jsonb) from public, anon;
grant execute on function public.admin_media_save_clip(uuid, jsonb) to authenticated;

/*
 * Paste copied settings onto many clips: the grade and/or crop (as in 0060) and now the auto pass
 * switch — `p_auto_enhance` null leaves it as it is on each clip. Clips a live run renders are
 * skipped; rendered clips that change go back to draft. Answers how many clips changed.
 */
drop function if exists public.admin_media_paste(uuid[], jsonb, jsonb, boolean, boolean, int);
create or replace function public.admin_media_paste(
  p_ids           uuid[],
  p_grade         jsonb default null,
  p_crop          jsonb default null,
  p_with_grade    boolean default true,
  p_with_crop     boolean default false,
  p_grade_version int default 1,
  p_auto_enhance  boolean default null
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
  if not coalesce(p_with_grade, false) and not coalesce(p_with_crop, false)
     and p_auto_enhance is null then
    return 0;
  end if;

  with changed as (
    update public.media_clips c
       set grade = case when p_with_grade then p_grade else c.grade end,
           grade_version = case when p_with_grade then p_grade_version else c.grade_version end,
           crop = case when p_with_crop then p_crop else c.crop end,
           auto_enhance = coalesce(p_auto_enhance, c.auto_enhance),
           status = case when c.status = 'done' then 'draft' else c.status end
     where c.id = any (p_ids)
       and not (c.status = 'rendering' and c.claimed_until >= now())
       and (
         (coalesce(p_with_grade, false)
          and (c.grade, c.grade_version) is distinct from (p_grade, p_grade_version))
         or (coalesce(p_with_crop, false) and c.crop is distinct from p_crop)
         or (p_auto_enhance is not null and c.auto_enhance is distinct from p_auto_enhance)
       )
    returning 1
  )
  select count(*) into v_n from changed;
  return v_n;
end;
$$;

revoke execute on function public.admin_media_paste(uuid[], jsonb, jsonb, boolean, boolean, int, boolean) from public, anon;
grant execute on function public.admin_media_paste(uuid[], jsonb, jsonb, boolean, boolean, int, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Worker RPCs (service role only).
-- -----------------------------------------------------------------------------

/* 0060's claim, answering the play mode, the still frame and the auto switch as well. */
drop function if exists public.media_render_claim(int, int);
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
  has_video_en  boolean,
  play_mode     text,
  still_at_s    numeric,
  auto_enhance  boolean
)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_max int := public.media_render_max_attempts();
begin
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
         not public.media_en_writable(c.exercise_id),
         c.play_mode, c.still_at_s, c.auto_enhance
    from claimed c
    join due d on d.id = c.id
   order by d.updated_at, c.id;
end;
$$;

revoke execute on function public.media_render_claim(int, int) from public, anon, authenticated;
grant execute on function public.media_render_claim(int, int) to service_role;

/*
 * 0060's done, plus: `p_auto_params` (what the automatic pass computed; anything but a small
 * object is not kept) is stored on the clip, and the exercise's `video_mode` follows the clip's
 * play mode (`media_video_mode`: once → fit, loop and still → loop).
 */
drop function if exists public.media_render_done(uuid, int, boolean);
create or replace function public.media_render_done(
  p_id          uuid,
  p_attempt     int,
  p_with_en     boolean default false,
  p_auto_params jsonb default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_ex   text;
  v_mode text;
  v_en   boolean;
begin
  select c.exercise_id, c.play_mode into v_ex, v_mode from public.media_clips c
   where c.id = p_id and c.status = 'rendering' and c.attempts = p_attempt
   for update;
  if not found then
    return false;
  end if;
  v_en := coalesce(p_with_en, false) and public.media_en_writable(v_ex);
  update public.media_clips c
     set status = 'done', error = null, claimed_until = null, rendered_at = now(),
         en_from_studio = v_en,
         auto_params = case
                         when jsonb_typeof(p_auto_params) = 'object'
                              and octet_length(p_auto_params::text) <= 4096
                           then p_auto_params
                       end
   where c.id = p_id;
  update public.exercises e
     set video_ru = 'storage:videos/shared/' || e.id || '.ru.mp4',
         video_en = case when v_en then 'storage:videos/shared/' || e.id || '.en.mp4' else e.video_en end,
         video_mode = public.media_video_mode(v_mode)
   where e.id = v_ex;
  return true;
end;
$$;

revoke execute on function public.media_render_done(uuid, int, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.media_render_done(uuid, int, boolean, jsonb) to service_role;
