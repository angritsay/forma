-- =============================================================================
-- 0008 — Courses the coach builds in the admin panel.
--
-- Until now a course was a TypeScript file in content/courses/, compiled into the static build;
-- public.courses held nothing but an allowlist of ids. That makes a course impossible to author
-- without a code change, which is the thing the admin panel most needs to do.
--
-- Two tables:
--   admin_courses      one row per course — the catalogue fields the app and the landing page
--                      query on as columns, and the prose (names, descriptions, FAQ) as one
--                      jsonb `content` blob, because the editor writes it as a whole and nothing
--                      filters on it.
--   admin_course_days  the days of a course, in order: week + day, a kind (workout / rest / test /
--                      benchmark / milestone), its own title and body text, an optional image, and
--                      for the training days a reference to a custom_workouts row. That reference
--                      is what makes the workout library from 0006 reusable: a workout is built
--                      once and dropped into as many days and courses as it belongs in.
--
-- Publishing is an explicit step (admin_publish_course). A draft is visible only to admins; only
-- publishing writes the course id into public.courses and its workouts' base_points into
-- public.workouts, which is what entitlements and session scoring key off. That keeps a half-built
-- course from being purchasable or playable.
--
-- Requires 0001_init.sql (courses, workouts, is_admin, current_email, has_entitlement,
-- set_updated_at) and 0006_custom_workouts.sql (exercises, custom_workouts).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- admin_courses
-- -----------------------------------------------------------------------------
create table if not exists public.admin_courses (
  id            uuid primary key default gen_random_uuid(),
  -- The course id used everywhere else: purchases.course_id, workout_sessions.course_id,
  -- user_course_state.course_id, the videos bucket's first path segment. Same format as
  -- public.courses.id, and fixed once the course has been published (enforced below).
  slug_id       text not null unique check (slug_id ~ '^[a-z0-9_]{2,40}$'),
  status        text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order    int not null default 0,

  -- Catalogue fields. Columns rather than jsonb because the app filters and sorts on them and the
  -- landing-page generator needs them without parsing a blob.
  level             int not null default 1 check (level between 1 and 3),
  weeks             int not null default 4 check (weeks between 1 and 16),
  sessions_per_week int not null default 3 check (sessions_per_week between 1 and 7),
  avg_session_min   int not null default 30 check (avg_session_min between 5 and 120),
  equipment         text[] not null default '{none}',
  -- One flat tile colour from --tile-1…5 (src/styles/global.css); see CourseSchema.tile.
  tile              text not null default '#1A2634' check (tile ~ '^#[0-9a-fA-F]{6}$'),
  price_rub         numeric(10, 2) not null default 0 check (price_rub >= 0),
  price_usd         numeric(10, 2) not null default 0 check (price_usd >= 0),

  /*
   * content — every piece of prose, in the shape CourseSchema expects (src/content/schema.ts):
   *   { slug: {ru,en}, name: {ru,en}, tagline: {ru,en}, description: {ru,en},
   *     longDescription: [{ru,en}], forWhom: [{ru,en}], outcomes: [{ru,en}],
   *     faq: [{q:{ru,en}, a:{ru,en}}],
   *     coverImage?: string, introVideo?: {ru?,en?}, paymentUrl?: {ru?,en?} }
   * Validated by zod in the client before every write; the check below only bounds its size.
   */
  content       jsonb not null default '{}'::jsonb,

  author_id     uuid references auth.users (id) on delete set null,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.admin_courses is
  'Courses authored in the admin panel. Publishing copies slug_id into public.courses and the days'' workout base_points into public.workouts.';

-- A course's prose runs to a few KB; 256 KB is far more than any of the five existing courses
-- needs and stops a client from parking blobs here.
alter table public.admin_courses drop constraint if exists admin_courses_content_len;
alter table public.admin_courses add constraint admin_courses_content_len
  check (octet_length(content::text) <= 262144) not valid;

create index if not exists admin_courses_status_idx on public.admin_courses (status, sort_order);

drop trigger if exists admin_courses_touch on public.admin_courses;
create trigger admin_courses_touch
  before update on public.admin_courses
  for each row execute function public.set_updated_at();

-- slug_id is the key every purchase, session and storage path is written against, so once a course
-- has been published it can never be renamed — that would orphan the history silently.
create or replace function public.admin_courses_freeze_slug()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  if old.published_at is not null and new.slug_id is distinct from old.slug_id then
    raise exception 'slug_id is fixed once a course has been published'
      using errcode = 'P0001', hint = 'create a new course instead of renaming this one';
  end if;
  return new;
end;
$$;

drop trigger if exists admin_courses_freeze_slug on public.admin_courses;
create trigger admin_courses_freeze_slug
  before update on public.admin_courses
  for each row execute function public.admin_courses_freeze_slug();

alter table public.admin_courses enable row level security;

-- Admins do everything. Everyone signed in may read a *published* course: the catalogue screen
-- lists courses that are not owned yet, exactly as it does for the compiled ones.
drop policy if exists "admin_courses: admins all" on public.admin_courses;
create policy "admin_courses: admins all"
  on public.admin_courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin_courses: read published" on public.admin_courses;
create policy "admin_courses: read published"
  on public.admin_courses for select
  to authenticated
  using (status = 'published');

revoke all on public.admin_courses from anon, authenticated;
grant select, insert, update, delete on public.admin_courses to authenticated;

-- -----------------------------------------------------------------------------
-- admin_course_days
-- -----------------------------------------------------------------------------
create table if not exists public.admin_course_days (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.admin_courses (id) on delete cascade,
  -- The node id written into workout_sessions.node_id and user_course_state; same format rule.
  node_id       text not null check (node_id ~ '^[a-z0-9_]{2,40}$'),
  week          int not null check (week between 1 and 16),
  day           int not null check (day between 1 and 7),
  kind          text not null check (kind in ('workout', 'rest', 'test', 'benchmark', 'milestone')),

  -- The workout this day plays. Required for workout/test/benchmark (enforced below); null for a
  -- rest day or a milestone. `restrict` on purpose: deleting a workout that a course day still
  -- points at would silently empty that day.
  custom_workout_id uuid references public.custom_workouts (id) on delete restrict,

  /*
   * content — the day's own words, in the shape CourseNodeSchema expects plus a body:
   *   { title: {ru,en}, subtitle?: {ru,en}, body?: [{ru,en}], image?: string }
   * `body` is the paragraphs shown on the day's preview screen — what a yoga course needs and a
   * strength course rarely uses.
   */
  content       jsonb not null default '{}'::jsonb,

  deload        boolean not null default false,
  steps_goal    int check (steps_goal is null or steps_goal between 1000 and 50000),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (course_id, node_id),
  -- One day per calendar slot: the path screen lays days out on a week/day grid.
  unique (course_id, week, day)
);

comment on table public.admin_course_days is
  'The days of an admin-authored course, in order. Training days point at a custom_workouts row.';

alter table public.admin_course_days drop constraint if exists admin_course_days_content_len;
alter table public.admin_course_days add constraint admin_course_days_content_len
  check (octet_length(content::text) <= 65536) not valid;

-- A day that plays a workout must have one; a rest day or milestone must not carry a stale
-- reference to one.
alter table public.admin_course_days drop constraint if exists admin_course_days_workout_required;
alter table public.admin_course_days add constraint admin_course_days_workout_required
  check (
    case
      when kind in ('workout', 'test', 'benchmark') then custom_workout_id is not null
      else custom_workout_id is null
    end
  );

create index if not exists admin_course_days_course_idx
  on public.admin_course_days (course_id, sort_order);
create index if not exists admin_course_days_workout_idx
  on public.admin_course_days (custom_workout_id);

drop trigger if exists admin_course_days_touch on public.admin_course_days;
create trigger admin_course_days_touch
  before update on public.admin_course_days
  for each row execute function public.set_updated_at();

alter table public.admin_course_days enable row level security;

drop policy if exists "admin_course_days: admins all" on public.admin_course_days;
create policy "admin_course_days: admins all"
  on public.admin_course_days for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The days of a published course are readable by anyone signed in — the path screen shows the
-- shape of a course before it is bought, same as the compiled courses.
drop policy if exists "admin_course_days: read published" on public.admin_course_days;
create policy "admin_course_days: read published"
  on public.admin_course_days for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_courses c
      where c.id = admin_course_days.course_id and c.status = 'published'
    )
  );

revoke all on public.admin_course_days from anon, authenticated;
grant select, insert, update, delete on public.admin_course_days to authenticated;

-- -----------------------------------------------------------------------------
-- custom_workouts: let a workout be read when it belongs to a published course.
--
-- 0006 gave three ways to reach a custom workout: you are an admin, it was assigned to you, or you
-- hold its share link. A workout that is a day of a course you have bought is a fourth, and the
-- entitlement check is the same one the compiled courses use.
-- -----------------------------------------------------------------------------
drop policy if exists "custom_workouts: read course days" on public.custom_workouts;
create policy "custom_workouts: read course days"
  on public.custom_workouts for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_course_days d
      join public.admin_courses c on c.id = d.course_id
      where d.custom_workout_id = custom_workouts.id
        and c.status = 'published'
        and public.has_entitlement(c.slug_id)
    )
  );

-- -----------------------------------------------------------------------------
-- exercises: the columns an admin-authored exercise needs.
--
-- 0006 created the table as a mirror of the compiled library, so it carries only what the builder
-- reads. Authoring a new exercise — a yoga pose, say — needs the teaching text too, and a flag
-- that keeps the generated re-seed from touching rows that were written by hand.
-- -----------------------------------------------------------------------------
alter table public.exercises add column if not exists description_en text;
-- how_to / cues / mistakes: arrays of {ru,en} strings, as ExerciseSchema defines them.
alter table public.exercises add column if not exists how_to jsonb not null default '[]'::jsonb;
alter table public.exercises add column if not exists cues jsonb not null default '[]'::jsonb;
alter table public.exercises add column if not exists mistakes jsonb not null default '[]'::jsonb;
alter table public.exercises add column if not exists breathing_ru text;
alter table public.exercises add column if not exists slug_ru text;
alter table public.exercises add column if not exists slug_en text;
-- A still image, for a pose whose video has not been shot yet.
alter table public.exercises add column if not exists image text;
alter table public.exercises add column if not exists author_id uuid references auth.users (id) on delete set null;

-- is_custom marks a row that was authored in the admin panel rather than generated from the
-- exercise files under content/exercises. scripts/content/gen-exercise-seed.mjs writes its upsert
-- to skip these, so a re-seed can never overwrite a pose the coach wrote.
--
-- (Line comments, not a block: Postgres nests block comments, so a path containing a slash-star
-- would open a second level and swallow the rest of the file.)
alter table public.exercises add column if not exists is_custom boolean not null default false;

comment on column public.exercises.is_custom is
  'True for an exercise authored in the admin panel. The generated seed (0007) never updates these rows.';

-- animation names a pose set defined in src/components/anim/poses — code the admin cannot write.
-- An admin-authored exercise leads with its video or image instead, so the column must be nullable.
-- (It already is; asserted here so a future tightening does not break authoring.)
alter table public.exercises alter column animation drop not null;

-- -----------------------------------------------------------------------------
-- images — a public bucket for course covers, day pictures and exercise stills.
--
-- Public, unlike `videos`: these are marketing and teaching images that the landing pages must be
-- able to render without a signed URL, and an <img> in a static page cannot mint one. The videos
-- bucket stays private — the paid content is the video.
--
-- Object naming convention:
--   images/courses/<course_id>/<file>     course cover, day pictures
--   images/exercises/<exercise_id>/<file> exercise stills
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Read: everyone, including anonymous visitors on the landing pages.
drop policy if exists "images: public select" on storage.objects;
create policy "images: public select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'images');

drop policy if exists "images: admin insert" on storage.objects;
create policy "images: admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "images: admin update" on storage.objects;
create policy "images: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and public.is_admin())
  with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "images: admin delete" on storage.objects;
create policy "images: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- admin_publish_course — make a draft real.
--
-- Validates the course is complete enough to sell, then writes the two rows the rest of the
-- database keys off: public.courses (the id allowlist that public.workouts references) and
-- public.workouts (base_points per workout, read by the session scoring trigger in 0001). Both
-- are declared "written only by migrations" for clients; this function is the one exception, and
-- it is security definer precisely so the tables keep having no write policy.
-- -----------------------------------------------------------------------------
create or replace function public.admin_publish_course(p_course uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_slug  text;
  v_days  int;
  v_bad   int;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select slug_id into v_slug from public.admin_courses where id = p_course;
  if v_slug is null then
    raise exception 'course_not_found' using errcode = 'P0001';
  end if;

  -- CourseSchema requires at least four nodes; refuse to publish anything thinner.
  select count(*) into v_days from public.admin_course_days where course_id = p_course;
  if v_days < 4 then
    raise exception 'course_too_short' using errcode = 'P0001',
      hint = 'a course needs at least 4 days';
  end if;

  -- Every training day must have a workout with at least one exercise in it.
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
    raise exception 'course_has_empty_days' using errcode = 'P0001',
      hint = 'every workout day needs a workout with at least one section';
  end if;

  insert into public.courses (id, sort_order)
  values (v_slug, (select sort_order from public.admin_courses where id = p_course))
  on conflict (id) do update set sort_order = excluded.sort_order;

  -- base_points per workout. custom_workouts.points is the coach's own estimate; the content
  -- model floors basePoints at 60 and caps it at 250, so clamp into that range rather than
  -- letting an unset value fall through to the trigger's own fallback.
  -- `distinct` matters: one workout may be used by several days of the course, and an
  -- `on conflict do update` cannot touch the same row twice in a single statement.
  insert into public.workouts (course_id, id, base_points)
  select distinct v_slug, w.short_id, greatest(60, least(250, coalesce(w.points, 100)))
  from public.admin_course_days d
  join public.custom_workouts w on w.id = d.custom_workout_id
  where d.course_id = p_course
  on conflict (course_id, id) do update set base_points = excluded.base_points;

  update public.admin_courses
  set status = 'published',
      published_at = coalesce(published_at, now())
  where id = p_course;
end;
$$;

revoke execute on function public.admin_publish_course(uuid) from public, anon;
grant execute on function public.admin_publish_course(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- admin_unpublish_course — take a course off sale without destroying anything.
--
-- The public.courses and public.workouts rows stay: people who already bought the course keep
-- their entitlement, their history and their scoring. Only the catalogue listing goes away.
-- -----------------------------------------------------------------------------
create or replace function public.admin_unpublish_course(p_course uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.admin_courses set status = 'draft' where id = p_course;
end;
$$;

revoke execute on function public.admin_unpublish_course(uuid) from public, anon;
grant execute on function public.admin_unpublish_course(uuid) to authenticated;
