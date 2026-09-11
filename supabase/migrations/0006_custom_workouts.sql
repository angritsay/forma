-- =============================================================================
-- 0006 — Exercise catalogue + custom workouts built by the coach.
--
-- Three tables and the glue that lets a coach-built workout be played and scored like a course
-- workout:
--   exercises        a database copy of the exercise library, so the coach can mark it up (video,
--                    tags) without a code change. Seeded from content by 0007_exercise_seed.sql.
--   custom_workouts  a workout the coach composes in the admin panel: a title and a JSON structure
--                    of sections (warm-up / main / cool-down) and items (an exercise with reps or
--                    seconds and a rest). It can carry a share_token (an in-app link) and is handed
--                    to people through assigned_workouts.
--   assigned_workouts  which email a custom workout is granted to — keyed by email like a purchase,
--                    so it can be granted before the person has signed up.
--
-- Playing one records a normal row in workout_sessions with course_id = 'custom' and node_id =
-- the workout's short_id (a regex-safe id that fits the sessions table), so points, the streak and
-- history all keep working. can_play_custom() replaces the has_entitlement() check for those rows.
-- Requires 0001_init.sql (workout_sessions, is_admin, current_email) and 0002 (normalize_email).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- exercises — the library, in the database, for the coach to build from and mark up.
-- Content stays the source of truth for the base fields (0007 re-seeds them); the markup columns
-- (video_ru / video_en / tags) are never overwritten by a re-seed, so hand edits survive.
-- -----------------------------------------------------------------------------
create table if not exists public.exercises (
  id              text primary key check (id ~ '^[a-z0-9_]{2,60}$'),
  name_ru         text not null,
  name_en         text,
  short_name_ru   text,
  description_ru  text,
  primary_muscle  text,
  muscles         text[] not null default '{}',
  pattern         text,
  equipment       text[] not null default '{}',
  level           int check (level is null or level between 1 and 3),
  unit            text not null default 'reps' check (unit in ('reps', 'seconds', 'meters', 'calories')),
  seconds_per_rep numeric,
  animation       text,
  video_ru        text,
  video_en        text,
  tags            text[] not null default '{}',
  is_test         boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.exercises is
  'Exercise library in the database, for the workout builder and coach markup. Base fields seeded from content (0007); video/tags columns are hand-editable and never re-seeded.';

drop trigger if exists exercises_touch on public.exercises;
create trigger exercises_touch
  before update on public.exercises
  for each row execute function public.set_updated_at();

alter table public.exercises enable row level security;

-- Readable by any signed-in user (the builder and the catalogue screen); written only by admins.
drop policy if exists "exercises: read" on public.exercises;
create policy "exercises: read" on public.exercises for select to authenticated using (true);
drop policy if exists "exercises: admins write" on public.exercises;
create policy "exercises: admins write"
  on public.exercises for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.exercises from anon, authenticated;
grant select, insert, update, delete on public.exercises to authenticated;

-- -----------------------------------------------------------------------------
-- exercises: the columns an admin-authored exercise needs.
--
-- The table above mirrors the compiled library, so it carries only what the builder reads.
-- Authoring a new exercise — a yoga pose, say — needs the teaching text too, and a flag that keeps
-- the generated re-seed from touching rows that were written by hand.
--
-- These live here, with the table, rather than in 0008 where the rest of the course builder is:
-- 0007_exercise_seed.sql is generated with a `where is_custom = false` guard on its upsert, and it
-- runs before 0008 would have added the column.
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
-- custom_workouts — a workout the coach composed.
-- -----------------------------------------------------------------------------
create table if not exists public.custom_workouts (
  id           uuid primary key default gen_random_uuid(),
  -- A regex-safe id for the sessions table (course_id/node_id/workout_id are ^[a-z0-9_]{2,40}$).
  short_id     text not null unique check (short_id ~ '^[a-z0-9_]{2,40}$'),
  author_id    uuid references auth.users (id) on delete set null,
  title        text not null check (length(title) between 1 and 120),
  description  text check (description is null or length(description) <= 1000),
  structure    jsonb not null,
  est_sec      int check (est_sec is null or est_sec between 0 and 21600),
  points       int check (points is null or points between 0 and 375),
  -- A non-null token means "shared by link": anyone signed in who has the link can open and do it.
  share_token  text unique check (share_token is null or share_token ~ '^[A-Za-z0-9_-]{16,64}$'),
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.custom_workouts is
  'Workouts the coach builds in the admin panel. Played as workout_sessions with course_id = custom.';

-- A structure is a few KB of JSON; 64 KB is generous and stops a client from parking blobs here.
alter table public.custom_workouts drop constraint if exists custom_workouts_structure_len;
alter table public.custom_workouts add constraint custom_workouts_structure_len
  check (octet_length(structure::text) <= 65536) not valid;

create index if not exists custom_workouts_created_idx on public.custom_workouts (created_at desc);

drop trigger if exists custom_workouts_touch on public.custom_workouts;
create trigger custom_workouts_touch
  before update on public.custom_workouts
  for each row execute function public.set_updated_at();

alter table public.custom_workouts enable row level security;

-- -----------------------------------------------------------------------------
-- assigned_workouts — which email each custom workout is granted to.
-- -----------------------------------------------------------------------------
create table if not exists public.assigned_workouts (
  custom_workout_id uuid not null references public.custom_workouts (id) on delete cascade,
  email             citext not null check (length(email::text) <= 254),
  assigned_by       uuid references auth.users (id) on delete set null,
  note              text check (note is null or length(note) <= 500),
  created_at        timestamptz not null default now(),
  primary key (custom_workout_id, email)
);

comment on table public.assigned_workouts is
  'A custom workout granted to an email (keyed by email like a purchase, so it can precede sign-up).';

create index if not exists assigned_workouts_email_idx on public.assigned_workouts (email);

alter table public.assigned_workouts enable row level security;

-- The person sees their own assignments; the coach reads and writes all of them.
drop policy if exists "assigned_workouts: own or admin read" on public.assigned_workouts;
create policy "assigned_workouts: own or admin read"
  on public.assigned_workouts for select
  to authenticated
  using (email = public.current_email() or public.is_admin());
drop policy if exists "assigned_workouts: admins write" on public.assigned_workouts;
create policy "assigned_workouts: admins write"
  on public.assigned_workouts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.assigned_workouts from anon, authenticated;
grant select, insert, update, delete on public.assigned_workouts to authenticated;

-- -----------------------------------------------------------------------------
-- custom_workouts policies. Admins do everything; a person may read a workout that is either
-- shared by link or assigned to them. Enumeration of shared workouts is prevented by reading them
-- only through get_shared_custom_workout(token), never by listing the table.
-- -----------------------------------------------------------------------------
drop policy if exists "custom_workouts: admins all" on public.custom_workouts;
create policy "custom_workouts: admins all"
  on public.custom_workouts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "custom_workouts: read assigned" on public.custom_workouts;
create policy "custom_workouts: read assigned"
  on public.custom_workouts for select
  to authenticated
  using (
    exists (
      select 1 from public.assigned_workouts a
      where a.custom_workout_id = id and a.email = public.current_email()
    )
  );

revoke all on public.custom_workouts from anon, authenticated;
grant select, insert, update, delete on public.custom_workouts to authenticated;

-- -----------------------------------------------------------------------------
-- can_play_custom — may the caller record a session for the custom workout with this short_id?
-- True for an admin, for a workout assigned to the caller, or for a shared workout (the caller
-- reached it through its link). Used by the workout_sessions insert policy in place of
-- has_entitlement() when course_id = 'custom'.
-- -----------------------------------------------------------------------------
create or replace function public.can_play_custom(p_short text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select public.is_admin() or exists (
    select 1
    from public.custom_workouts w
    left join public.assigned_workouts a
      on a.custom_workout_id = w.id and a.email = public.current_email()
    where w.short_id = p_short
      and w.is_archived = false
      and (w.share_token is not null or a.email is not null)
  );
$$;

revoke execute on function public.can_play_custom(text) from public, anon;
grant execute on function public.can_play_custom(text) to authenticated;

-- -----------------------------------------------------------------------------
-- get_shared_custom_workout — resolve a share link to its workout, without exposing the table.
-- Returns nothing for an unknown or archived token.
-- -----------------------------------------------------------------------------
create or replace function public.get_shared_custom_workout(p_token text)
returns table (
  id uuid, short_id text, title text, description text, structure jsonb, est_sec int, points int
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select w.id, w.short_id, w.title, w.description, w.structure, w.est_sec, w.points
  from public.custom_workouts w
  where w.share_token = p_token and w.is_archived = false;
$$;

revoke execute on function public.get_shared_custom_workout(text) from public, anon;
grant execute on function public.get_shared_custom_workout(text) to authenticated;

-- -----------------------------------------------------------------------------
-- my_custom_workouts — the custom workouts assigned to the signed-in user.
-- -----------------------------------------------------------------------------
drop view if exists public.my_custom_workouts;
create view public.my_custom_workouts
with (security_invoker = false)
as
  select w.id, w.short_id, w.title, w.description, w.structure, w.est_sec, w.points,
         a.created_at as assigned_at
  from public.assigned_workouts a
  join public.custom_workouts w on w.id = a.custom_workout_id
  where a.email = public.current_email() and w.is_archived = false;

revoke all on public.my_custom_workouts from anon, authenticated;
grant select on public.my_custom_workouts to authenticated;

-- -----------------------------------------------------------------------------
-- workout_sessions insert policy — allow custom-workout sessions (course_id = 'custom').
-- Everything else is unchanged: a course workout still needs an active entitlement.
-- -----------------------------------------------------------------------------
drop policy if exists "workout_sessions: owner insert" on public.workout_sessions;
create policy "workout_sessions: owner insert"
  on public.workout_sessions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      (course_id <> 'custom' and public.has_entitlement(course_id))
      or (course_id = 'custom' and public.can_play_custom(node_id))
    )
  );

-- -----------------------------------------------------------------------------
-- admin_assign_custom_workout / admin_unassign_custom_workout — grant by email, normalized.
-- -----------------------------------------------------------------------------
create or replace function public.admin_assign_custom_workout(p_workout uuid, p_email text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.normalize_email(p_email);
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_email is null or length(v_email::text) = 0 then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;
  insert into public.assigned_workouts (custom_workout_id, email, assigned_by, note)
  values (p_workout, v_email, auth.uid(), p_note)
  on conflict (custom_workout_id, email) do update set note = excluded.note;
end;
$$;

revoke execute on function public.admin_assign_custom_workout(uuid, text, text) from public, anon;
grant execute on function public.admin_assign_custom_workout(uuid, text, text) to authenticated;

create or replace function public.admin_unassign_custom_workout(p_workout uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.normalize_email(p_email);
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.assigned_workouts
  where custom_workout_id = p_workout and email = v_email;
end;
$$;

revoke execute on function public.admin_unassign_custom_workout(uuid, text) from public, anon;
grant execute on function public.admin_unassign_custom_workout(uuid, text) to authenticated;
