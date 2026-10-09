-- =============================================================================
-- 0065 — creators build their own courses: the course builder, scoped to the creator.
--
-- docs/PLATFORM.md, phase 2, step 1. Until now the builder's tables (`admin_courses`,
-- `admin_course_days` from 0008, `custom_workouts` from 0006) and the media buckets (`images`,
-- `videos`, `audio`) were written by admins only; 0064 added `creators` and
-- `admin_courses.creator_id` but left the owner assigning courses by hand. This opens the builder
-- to an **open creator** — a `creators` row with status `active` whose `owner_email` is the
-- caller's (`current_email()`), never the house row — limited to their own things:
--
--   1. **Courses.** A creator creates a course with `creator_id` = their creator and edits its
--      catalogue fields, prose and days while it is an editable draft: `status = 'draft'`, never
--      published (`published_at is null`), and not waiting for review. A creator can never set
--      `status`, `published_at`, `sort_order`, `creator_id`, `author_id` or
--      `review_requested_at` by writing the row (`admin_courses_creator_guard`), never price a
--      course above 100 000 ₽ / $1 000, and never take a `slug_id` that is already a course id
--      (`public.courses`: the compiled courses and everything ever published) or one of the
--      words the storage and session paths use (`custom`, `shared`, `creators`, …).
--   2. **Days.** Only of their own editable course, and a training day may only play a workout
--      of their own (`creator_owns_workout`): a creator cannot attach Forma's workouts to their
--      course and so cannot read them through it.
--   3. **Workouts.** `custom_workouts.creator_id` (new) says whose workout it is; null is
--      Forma's, as every workout before 0065. A creator reads and writes their own, never shares
--      one by link or credits it to one of Forma's authors (`share_token` and `author_slug` stay
--      null), and cannot change one that a published, once-published or in-review course plays
--      (`creator_can_edit_workout`) — that would change content after the review.
--   4. **Media.** Uploads go under `creators/<creator_id>/…` in `images`, `videos` and `audio`,
--      and a creator may insert, overwrite or delete only there. The paid clips of a creator's
--      course live at `videos/creators/<creator_id>/<slug_id>/…` (and `audio/…`): the creator
--      reads their own prefix, and a buyer reads a clip when they hold the course `<slug_id>`
--      **and** that course belongs to `<creator_id>` (`creator_media_readable`) — a path cannot
--      borrow another creator's entitlement.
--   5. **Review, not publish.** `admin_courses.review_requested_at` (new). `creator_request_review`
--      sets it once the draft has the four days and filled workouts publishing would demand;
--      while it is set the course is frozen for the creator (they may withdraw it with
--      `creator_withdraw_review`). The owner publishes with the existing `admin_publish_course`
--      (publishing clears the request) or hands it back with `admin_return_course`.
--   6. **Paused creators** keep reading their courses, days, workouts and clips but write
--      nothing. Applied and declined creators get nothing.
--
-- Admins keep every policy they had: nothing here narrows `is_admin()`.
--
-- ## What is deliberately not here
--
--   * **Exercises stay admin-curated.** The library is readable by everyone signed in (0006) and
--     written by admins only; a creator who needs a movement that is not there asks the owner.
--   * **A published creator course is read-only for its creator**, including after an unpublish
--     (`published_at` stays set): edits to live content need a versioning step this phase does
--     not have. The owner can still edit it as an admin.
--   * Assigning a workout to people (`assigned_workouts`) and share links stay the owner's.
--
-- The guard trigger tells a creator from an admin and from Forma's own security-definer functions
-- by `current_user`: a client request runs as `authenticated`, a security-definer function as its
-- owner. So `creator_request_review` may set the column the guard forbids a creator to write.
--
-- Requires 0006, 0008, 0048 and 0064. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Columns.
-- -----------------------------------------------------------------------------
alter table public.admin_courses
  add column if not exists review_requested_at timestamptz;

comment on column public.admin_courses.review_requested_at is
  'When the creator sent this draft to the owner for review (0065). Null: not waiting. Cleared by publishing or admin_return_course.';

create index if not exists admin_courses_review_idx
  on public.admin_courses (review_requested_at)
  where review_requested_at is not null;

alter table public.custom_workouts
  add column if not exists creator_id uuid references public.creators (id) on delete set null;

comment on column public.custom_workouts.creator_id is
  'Whose workout (0065). Null is Forma''s own; a creator reads and writes only rows with their id.';

create index if not exists custom_workouts_creator_idx on public.custom_workouts (creator_id);

-- -----------------------------------------------------------------------------
-- 2. Who the caller is, as a creator. Security definer: `creators` has no client policies.
-- -----------------------------------------------------------------------------

-- The caller's creator, open or paused: what they may read.
create or replace function public.my_creator_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select c.id from public.creators c
  where c.owner_email = public.current_email()
    and public.current_email() is not null
    and not c.house
    and c.status in ('active', 'paused')
$$;

-- The caller's creator, only while open: what they may write.
create or replace function public.my_open_creator_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select c.id from public.creators c
  where c.owner_email = public.current_email()
    and public.current_email() is not null
    and not c.house
    and c.status = 'active'
$$;

revoke execute on function public.my_creator_id() from public, anon;
grant execute on function public.my_creator_id() to authenticated;
revoke execute on function public.my_open_creator_id() from public, anon;
grant execute on function public.my_open_creator_id() to authenticated;

-- An editable draft of the caller's: open creator, theirs, a draft never published, not in review.
create or replace function public.creator_can_edit_course(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1 from public.admin_courses c
    where c.id = p_course
      and c.creator_id is not null
      and c.creator_id = public.my_open_creator_id()
      and c.status = 'draft'
      and c.published_at is null
      and c.review_requested_at is null
  )
$$;

-- A course the caller may read as its creator (open or paused), whatever its state.
create or replace function public.creator_can_read_course(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1 from public.admin_courses c
    where c.id = p_course
      and c.creator_id is not null
      and c.creator_id = public.my_creator_id()
  )
$$;

-- A workout of the open caller's own, which a day of theirs may play.
create or replace function public.creator_owns_workout(p_workout uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1 from public.custom_workouts w
    where w.id = p_workout
      and w.creator_id is not null
      and w.creator_id = public.my_open_creator_id()
  )
$$;

-- A workout the open caller may change or delete: theirs, and no day plays it in a course that is
-- published, was ever published, waits for review, or is not theirs.
create or replace function public.creator_can_edit_workout(p_workout uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select public.creator_owns_workout(p_workout)
     and not exists (
       select 1
       from public.admin_course_days d
       join public.admin_courses c on c.id = d.course_id
       where d.custom_workout_id = p_workout
         and (
           c.status <> 'draft'
           or c.published_at is not null
           or c.review_requested_at is not null
           or c.creator_id is distinct from public.my_open_creator_id()
         )
     )
$$;

revoke execute on function public.creator_can_edit_course(uuid) from public, anon;
grant execute on function public.creator_can_edit_course(uuid) to authenticated;
revoke execute on function public.creator_can_read_course(uuid) from public, anon;
grant execute on function public.creator_can_read_course(uuid) to authenticated;
revoke execute on function public.creator_owns_workout(uuid) from public, anon;
grant execute on function public.creator_owns_workout(uuid) to authenticated;
revoke execute on function public.creator_can_edit_workout(uuid) from public, anon;
grant execute on function public.creator_can_edit_workout(uuid) to authenticated;

-- Course ids a creator may not take: the words storage and session paths use for themselves.
create or replace function public.creator_course_slug_reserved(p_slug text)
returns boolean
language sql
immutable
as $$
  select p_slug = any (array[
    'custom', 'shared', 'creators', 'courses', 'exercises', 'loops', 'intro', 'admin', 'club'
  ])
$$;

-- -----------------------------------------------------------------------------
-- 3. admin_courses: the creator's policies and the guard on the columns they may not write.
-- -----------------------------------------------------------------------------
drop policy if exists "admin_courses: creator read own" on public.admin_courses;
create policy "admin_courses: creator read own"
  on public.admin_courses for select
  to authenticated
  using (creator_id is not null and creator_id = public.my_creator_id());

drop policy if exists "admin_courses: creator insert" on public.admin_courses;
create policy "admin_courses: creator insert"
  on public.admin_courses for insert
  to authenticated
  with check (
    creator_id is not null
    and creator_id = public.my_open_creator_id()
    and status = 'draft'
    and published_at is null
    and review_requested_at is null
  );

drop policy if exists "admin_courses: creator update" on public.admin_courses;
create policy "admin_courses: creator update"
  on public.admin_courses for update
  to authenticated
  using (public.creator_can_edit_course(id))
  with check (
    creator_id is not null
    and creator_id = public.my_open_creator_id()
    and status = 'draft'
    and published_at is null
    and review_requested_at is null
  );

drop policy if exists "admin_courses: creator delete" on public.admin_courses;
create policy "admin_courses: creator delete"
  on public.admin_courses for delete
  to authenticated
  using (public.creator_can_edit_course(id));

create or replace function public.admin_courses_creator_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  -- Publishing ends a review, whoever publishes.
  if tg_op = 'UPDATE' and new.status = 'published' and old.status is distinct from 'published' then
    new.review_requested_at := null;
  end if;

  -- Only a client's own request is guarded: an admin keeps every power, and Forma's
  -- security-definer functions (running as their owner) write what they were written to write.
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'draft' or new.published_at is not null
       or new.review_requested_at is not null or new.sort_order <> 0 then
      raise exception 'forbidden_field' using errcode = '42501';
    end if;
    new.author_id := auth.uid();
  else
    if new.id is distinct from old.id
       or new.creator_id is distinct from old.creator_id
       or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at
       or new.review_requested_at is distinct from old.review_requested_at
       or new.sort_order is distinct from old.sort_order
       or new.author_id is distinct from old.author_id
       or new.created_at is distinct from old.created_at then
      raise exception 'forbidden_field' using errcode = '42501';
    end if;
  end if;

  if tg_op = 'INSERT' or new.slug_id is distinct from old.slug_id then
    if public.creator_course_slug_reserved(new.slug_id)
       or exists (select 1 from public.courses k where k.id = new.slug_id) then
      raise exception 'slug_taken' using errcode = 'P0001';
    end if;
  end if;

  if new.price_rub > 100000 or new.price_usd > 1000 then
    raise exception 'price_out_of_range' using errcode = 'P0001';
  end if;
  if cardinality(new.equipment) > 20 then
    raise exception 'invalid_equipment' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists admin_courses_creator_guard on public.admin_courses;
create trigger admin_courses_creator_guard
  before insert or update on public.admin_courses
  for each row execute function public.admin_courses_creator_guard();

-- -----------------------------------------------------------------------------
-- 4. admin_course_days: the days of the creator's own course.
-- -----------------------------------------------------------------------------
drop policy if exists "admin_course_days: creator read own" on public.admin_course_days;
create policy "admin_course_days: creator read own"
  on public.admin_course_days for select
  to authenticated
  using (public.creator_can_read_course(course_id));

drop policy if exists "admin_course_days: creator insert" on public.admin_course_days;
create policy "admin_course_days: creator insert"
  on public.admin_course_days for insert
  to authenticated
  with check (
    public.creator_can_edit_course(course_id)
    and (custom_workout_id is null or public.creator_owns_workout(custom_workout_id))
  );

-- `using` is the day as it is, `with check` the day as it will be: a day can neither be moved to
-- another course nor pointed at a workout that is not the creator's.
drop policy if exists "admin_course_days: creator update" on public.admin_course_days;
create policy "admin_course_days: creator update"
  on public.admin_course_days for update
  to authenticated
  using (public.creator_can_edit_course(course_id))
  with check (
    public.creator_can_edit_course(course_id)
    and (custom_workout_id is null or public.creator_owns_workout(custom_workout_id))
  );

drop policy if exists "admin_course_days: creator delete" on public.admin_course_days;
create policy "admin_course_days: creator delete"
  on public.admin_course_days for delete
  to authenticated
  using (public.creator_can_edit_course(course_id));

-- -----------------------------------------------------------------------------
-- 5. custom_workouts: the creator's own.
-- -----------------------------------------------------------------------------
drop policy if exists "custom_workouts: creator read own" on public.custom_workouts;
create policy "custom_workouts: creator read own"
  on public.custom_workouts for select
  to authenticated
  using (creator_id is not null and creator_id = public.my_creator_id());

drop policy if exists "custom_workouts: creator insert" on public.custom_workouts;
create policy "custom_workouts: creator insert"
  on public.custom_workouts for insert
  to authenticated
  with check (
    creator_id is not null
    and creator_id = public.my_open_creator_id()
    and share_token is null
  );

drop policy if exists "custom_workouts: creator update" on public.custom_workouts;
create policy "custom_workouts: creator update"
  on public.custom_workouts for update
  to authenticated
  using (public.creator_can_edit_workout(id))
  with check (
    creator_id is not null
    and creator_id = public.my_open_creator_id()
    and share_token is null
  );

drop policy if exists "custom_workouts: creator delete" on public.custom_workouts;
create policy "custom_workouts: creator delete"
  on public.custom_workouts for delete
  to authenticated
  using (public.creator_can_edit_workout(id));

create or replace function public.custom_workouts_creator_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  -- `authors.ts` names Forma's own coaches; a creator's workout is credited to the creator.
  if new.share_token is not null or new.author_slug is not null then
    raise exception 'forbidden_field' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
  elsif new.id is distinct from old.id
     or new.creator_id is distinct from old.creator_id
     or new.short_id is distinct from old.short_id
     or new.author_id is distinct from old.author_id
     or new.created_at is distinct from old.created_at then
    raise exception 'forbidden_field' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists custom_workouts_creator_guard on public.custom_workouts;
create trigger custom_workouts_creator_guard
  before insert or update on public.custom_workouts
  for each row execute function public.custom_workouts_creator_guard();

-- -----------------------------------------------------------------------------
-- 6. Storage: `creators/<creator_id>/…` in images, videos and audio.
-- -----------------------------------------------------------------------------

-- May the caller read this private object under `creators/`? The creator their own prefix; a
-- buyer `creators/<creator_id>/<slug_id>/…` when they hold `<slug_id>` and it is that creator's.
create or replace function public.creator_media_readable(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_parts text[] := storage.foldername(p_name);
begin
  if coalesce(v_parts[1], '') <> 'creators' or v_parts[2] is null then
    return false;
  end if;
  if v_parts[2] = public.my_creator_id()::text then
    return true;
  end if;
  return v_parts[3] is not null
     and public.has_entitlement(v_parts[3])
     and exists (
       select 1 from public.admin_courses c
       where c.slug_id = v_parts[3] and c.creator_id::text = v_parts[2]
     );
end;
$$;

-- May the open caller write this object? Only strictly inside their own prefix.
create or replace function public.creator_media_writable(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_parts text[] := storage.foldername(p_name);
  v_me    uuid   := public.my_open_creator_id();
begin
  return v_me is not null
     and coalesce(v_parts[1], '') = 'creators'
     and v_parts[2] = v_me::text
     and position('..' in p_name) = 0;
end;
$$;

revoke execute on function public.creator_media_readable(text) from public, anon;
grant execute on function public.creator_media_readable(text) to authenticated;
revoke execute on function public.creator_media_writable(text) from public, anon;
grant execute on function public.creator_media_writable(text) to authenticated;

-- `images` is already readable by everyone (0008); the private buckets need the read rule.
drop policy if exists "creator media: select" on storage.objects;
create policy "creator media: select"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('videos', 'audio') and public.creator_media_readable(name));

drop policy if exists "creator media: insert" on storage.objects;
create policy "creator media: insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('images', 'videos', 'audio') and public.creator_media_writable(name));

drop policy if exists "creator media: update" on storage.objects;
create policy "creator media: update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('images', 'videos', 'audio') and public.creator_media_writable(name))
  with check (bucket_id in ('images', 'videos', 'audio') and public.creator_media_writable(name));

drop policy if exists "creator media: delete" on storage.objects;
create policy "creator media: delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('images', 'videos', 'audio') and public.creator_media_writable(name));

-- -----------------------------------------------------------------------------
-- 7. Review: the creator asks, the owner publishes (admin_publish_course) or hands it back.
-- -----------------------------------------------------------------------------
create or replace function public.creator_request_review(p_course uuid)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_c    public.admin_courses;
  v_days int;
  v_bad  int;
  v_at   timestamptz := now();
begin
  select * into v_c from public.admin_courses where id = p_course for update;
  if not found or v_c.creator_id is null or v_c.creator_id is distinct from public.my_creator_id() then
    raise exception 'course_not_found' using errcode = 'P0001';
  end if;
  if v_c.creator_id is distinct from public.my_open_creator_id() then
    raise exception 'creator_paused' using errcode = '42501';
  end if;
  if v_c.status <> 'draft' or v_c.published_at is not null then
    raise exception 'already_published' using errcode = 'P0001';
  end if;
  if v_c.review_requested_at is not null then
    return v_c.review_requested_at;
  end if;

  -- The same floor admin_publish_course holds, so the owner is not sent a course she cannot publish.
  select count(*) into v_days from public.admin_course_days where course_id = p_course;
  if v_days < 4 then
    raise exception 'course_too_short' using errcode = 'P0001';
  end if;
  select count(*) into v_bad
  from public.admin_course_days d
  left join public.custom_workouts w on w.id = d.custom_workout_id
  where d.course_id = p_course
    and d.kind in ('workout', 'test', 'benchmark')
    and (
      w.id is null
      or w.is_archived
      or coalesce(jsonb_array_length(w.structure -> 'sections'), 0) = 0
    );
  if v_bad > 0 then
    raise exception 'course_has_empty_days' using errcode = 'P0001';
  end if;

  update public.admin_courses set review_requested_at = v_at where id = p_course;
  return v_at;
end;
$$;

comment on function public.creator_request_review(uuid) is
  'An open creator sends their draft to the owner for review; the draft is frozen until published or returned (0065).';

revoke execute on function public.creator_request_review(uuid) from public, anon;
grant execute on function public.creator_request_review(uuid) to authenticated;

create or replace function public.creator_withdraw_review(p_course uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_c public.admin_courses;
begin
  select * into v_c from public.admin_courses where id = p_course for update;
  if not found or v_c.creator_id is null or v_c.creator_id is distinct from public.my_creator_id() then
    raise exception 'course_not_found' using errcode = 'P0001';
  end if;
  if v_c.creator_id is distinct from public.my_open_creator_id() then
    raise exception 'creator_paused' using errcode = '42501';
  end if;
  if v_c.status <> 'draft' or v_c.published_at is not null then
    raise exception 'already_published' using errcode = 'P0001';
  end if;
  update public.admin_courses set review_requested_at = null where id = p_course;
end;
$$;

revoke execute on function public.creator_withdraw_review(uuid) from public, anon;
grant execute on function public.creator_withdraw_review(uuid) to authenticated;

-- The owner hands a course back to its creator without publishing it.
create or replace function public.admin_return_course(p_course uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.admin_courses set review_requested_at = null where id = p_course;
  if not found then
    raise exception 'course_not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_return_course(uuid) from public, anon;
grant execute on function public.admin_return_course(uuid) to authenticated;
