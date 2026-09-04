-- =============================================================================
-- Forma — 0001_init: extensions, tables, triggers, RLS policies, grants.
-- Contract: docs/SPEC.md §8. Idempotent: safe to re-run in the SQL editor.
-- Apply order:
--   0001_init.sql → 0002_functions.sql → 0003_storage.sql → 0004_content_seed.sql
--   → seed.sql (admins, optional)
--
-- Re-running a single file is safe and converges: tables use `if not exists`,
-- constraints are dropped and re-added by name, policies and functions are
-- replaced. Run the whole set in order after pulling changes.
--
-- The bounds added below are `not valid`: Postgres enforces them on every insert
-- and update from now on, but does not re-check rows written before this file was
-- applied, so upgrading a live database can never fail on old data. Once you have
-- cleaned any legacy rows you can promote one with
--   alter table public.<table> validate constraint <name>;
-- (docs/SETUP.md §8). A fresh database has no old rows, so nothing differs there.
--
-- Search path: every function pins `pg_catalog, public, extensions` because
-- `citext` lives in `public` on some projects and in `extensions` on others.
-- =============================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- PostgREST exposes `public`; anon/authenticated need schema usage only.
grant usage on schema public to anon, authenticated;

-- Supabase grants EXECUTE on new functions to anon/authenticated through default
-- privileges, which a plain `revoke … from public` does not undo. Turn the default
-- off first, then grant explicitly per function below.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Generic trigger: bump updated_at on every update.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Trigger functions are resolved when the trigger is created, never at fire time.
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- current_email() — the caller's *verified* email, or null.
--
-- Never trust the `email` claim in the JWT: it is whatever the auth provider put
-- there, and a provider that returns unverified addresses (or a project with
-- "Confirm email" turned off) would let anyone mint a token for the coach's
-- address. This reads auth.users by the token's subject instead and only answers
-- for a confirmed, live, unbanned user. Everything email-keyed (admins,
-- entitlements, storage) goes through it.
-- -----------------------------------------------------------------------------
create or replace function public.current_email()
returns citext
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select u.email::citext
  from auth.users u
  where u.id = auth.uid()
    and u.email is not null
    and u.email <> ''
    and u.email_confirmed_at is not null
    and u.deleted_at is null
    and (u.banned_until is null or u.banned_until <= now());
$$;

revoke execute on function public.current_email() from public, anon;
grant execute on function public.current_email() to authenticated;

-- -----------------------------------------------------------------------------
-- normalize_email() — the single email validator (create_order + admin_add_purchase).
-- Raises `invalid_email` (P0001) instead of returning null so both callers behave
-- identically; see the error convention in 0002_functions.sql.
-- -----------------------------------------------------------------------------
create or replace function public.normalize_email(p_email text)
returns citext
language plpgsql
immutable
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if length(v_email) > 254
     or v_email !~ '^[a-z0-9][a-z0-9._%+-]*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,24}$' then
    raise exception 'invalid_email' using errcode = 'P0001', hint = 'Enter a valid email address';
  end if;
  return v_email::citext;
end;
$$;

revoke execute on function public.normalize_email(text) from public, anon, authenticated;

-- =============================================================================
-- profiles — one row per auth user, created by trigger on auth.users insert.
-- =============================================================================
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            citext not null,
  display_name     text,
  avatar_seed      text not null default encode(gen_random_bytes(4), 'hex'),
  locale           text not null default 'ru' check (locale in ('ru', 'en')),
  -- UserTrainingProfile (src/lib/training/types.ts), owned by the app.
  training_profile jsonb,
  fitness_index    int check (fitness_index is null or fitness_index between 0 and 100),
  fitness_level    int check (fitness_level is null or fitness_level between 1 and 3),
  onboarded_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.profiles is 'App profile per auth user. Email mirrors auth.users.email (citext).';

-- Size limits on everything the client writes. display_name and avatar_seed are
-- relayed to every athlete through get_leaderboard, so an unbounded name would be
-- a denial-of-service on other people's leaderboard: those two are also repaired
-- in place, because they are read by other users.
update public.profiles set display_name = left(display_name, 60) where length(display_name) > 60;
update public.profiles set avatar_seed = encode(gen_random_bytes(4), 'hex')
  where avatar_seed !~ '^[A-Za-z0-9_-]{1,64}$';

alter table public.profiles drop constraint if exists profiles_email_len;
alter table public.profiles add constraint profiles_email_len
  check (length(email::text) <= 254)
  not valid;
alter table public.profiles drop constraint if exists profiles_display_name_len;
alter table public.profiles add constraint profiles_display_name_len
  check (display_name is null or length(display_name) <= 60)
  not valid;
alter table public.profiles drop constraint if exists profiles_avatar_seed_fmt;
alter table public.profiles add constraint profiles_avatar_seed_fmt
  check (avatar_seed ~ '^[A-Za-z0-9_-]{1,64}$')
  not valid;
-- UserTrainingProfile is a small object (~30 fields); 8 KB is 10× headroom.
alter table public.profiles drop constraint if exists profiles_training_profile_size;
alter table public.profiles add constraint profiles_training_profile_size
  check (training_profile is null or octet_length(training_profile::text) <= 8192)
  not valid;

alter table public.profiles enable row level security;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Runs as the function owner (postgres) because the inserting role is
-- supabase_auth_admin, which has no privileges on public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    -- Email OTP always has an email; coalesce keeps auth signups from failing
    -- if another provider without an email is ever enabled.
    left(coalesce(new.email, ''), 254),
    -- Signup metadata is client-controlled: clamp it to the column limit instead
    -- of letting a crafted signup store a huge name (see profiles_display_name_len).
    left(
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')), ''),
      60
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when a user changes their email in Supabase Auth,
-- so purchases (matched by email) keep resolving to the right person.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.profiles set email = left(new.email, 254) where id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Policies -------------------------------------------------------------------
-- Owner reads own row.
drop policy if exists "profiles: owner select" on public.profiles;
create policy "profiles: owner select"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Owner updates own row (column privileges below stop email/id changes).
drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Fallback insert for users created before the trigger existed: the row must be
-- the caller's own id and carry the caller's own email.
drop policy if exists "profiles: owner insert fallback" on public.profiles;
create policy "profiles: owner insert fallback"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid() and email = public.current_email());

-- No delete policy: rows go away with the auth user (on delete cascade).

-- Grants (minimal) ------------------------------------------------------------
revoke all on public.profiles from anon, authenticated;
grant select, insert on public.profiles to authenticated;
-- Column-level update: email and id can never be changed by the client.
grant update (display_name, avatar_seed, locale, training_profile, fitness_index, fitness_level, onboarded_at)
  on public.profiles to authenticated;

-- =============================================================================
-- admins — emails allowed to manage purchases and videos.
-- =============================================================================
create table if not exists public.admins (
  email      citext primary key,
  created_at timestamptz not null default now()
);

comment on table public.admins is 'Coach / staff emails. Insert via SQL editor (see supabase/seed.sql).';

alter table public.admins enable row level security;

-- Security definer so it can read admins regardless of RLS; stable for planning.
-- Keyed on the *verified* email (current_email()), never on the raw JWT claim.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1 from public.admins a
    where a.email = public.current_email()
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Only admins can see who the admins are; nobody can write through the API.
drop policy if exists "admins: admins select" on public.admins;
create policy "admins: admins select"
  on public.admins for select
  to authenticated
  using (public.is_admin());

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- =============================================================================
-- purchases — email ↔ course access. Written by RPCs only (never directly).
-- =============================================================================
create table if not exists public.purchases (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null,
  course_id    text not null,
  status       text not null default 'pending' check (status in ('pending', 'active', 'refunded')),
  source       text,
  locale       text,
  note         text,
  created_at   timestamptz not null default now(),
  activated_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (email, course_id)
);

comment on table public.purchases is 'Orders and entitlements. pending → active (coach confirms payment) → refunded.';

-- Bounds on everything create_order() can put here (it validates too; the table is
-- the backstop for the admin RPCs and for direct SQL).
update public.purchases set source = left(source, 40) where length(source) > 40;
update public.purchases set note = left(note, 500) where length(note) > 500;
update public.purchases set locale = null where locale is not null and locale not in ('ru', 'en');

alter table public.purchases drop constraint if exists purchases_email_len;
alter table public.purchases add constraint purchases_email_len
  check (length(email::text) <= 254)
  not valid;
alter table public.purchases drop constraint if exists purchases_course_id_fmt;
alter table public.purchases add constraint purchases_course_id_fmt
  check (course_id ~ '^[a-z0-9_]{2,40}$')
  not valid;
alter table public.purchases drop constraint if exists purchases_source_len;
alter table public.purchases add constraint purchases_source_len
  check (source is null or length(source) <= 40)
  not valid;
alter table public.purchases drop constraint if exists purchases_locale_fmt;
alter table public.purchases add constraint purchases_locale_fmt
  check (locale is null or locale in ('ru', 'en'))
  not valid;
alter table public.purchases drop constraint if exists purchases_note_len;
alter table public.purchases add constraint purchases_note_len
  check (note is null or length(note) <= 500)
  not valid;

create index if not exists purchases_email_idx on public.purchases (email);
create index if not exists purchases_status_created_idx on public.purchases (status, created_at desc);

alter table public.purchases enable row level security;

drop trigger if exists set_updated_at on public.purchases;
create trigger set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

-- Admins can do everything through the API (list/activate/refund/add).
drop policy if exists "purchases: admins all" on public.purchases;
create policy "purchases: admins all"
  on public.purchases for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Customers have NO direct read of purchases: the row carries the coach's internal
-- `note` and `source`. They see what they own through the `my_entitlements` view
-- (security definer, course_id + activated_at only — 0002_functions.sql).
drop policy if exists "purchases: owner select" on public.purchases;

-- No anon policies: anonymous visitors only go through create_order().

revoke all on public.purchases from anon, authenticated;
grant select, insert, update, delete on public.purchases to authenticated;

-- =============================================================================
-- courses / workouts — the catalogue the backend enforces, mirrored from
-- content/courses/*.ts by supabase/migrations/0004_content_seed.sql
-- (generated: node scripts/content/gen-seed.mjs).
--
-- courses  → create_order() only accepts ids that exist here.
-- workouts → workout_sessions_guard clamps points to the engine ceiling derived
--            from base_points, so a tampered client cannot inflate them.
-- =============================================================================
create table if not exists public.courses (
  id         text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.courses is 'Allowlist of real course ids (generated seed, 0004_content_seed.sql).';

create table if not exists public.workouts (
  -- Workout ids are unique inside a course, not globally (see getWorkout()).
  course_id   text not null references public.courses (id) on delete cascade,
  id          text not null check (id ~ '^[a-z0-9_]{2,40}$'),
  base_points int not null check (base_points between 1 and 250),
  primary key (course_id, id)
);

comment on table public.workouts is 'Workout basePoints per course (generated seed, 0004_content_seed.sql).';

alter table public.courses enable row level security;
alter table public.workouts enable row level security;

-- Public catalogue data: readable by signed-in users, written only by migrations.
drop policy if exists "courses: read" on public.courses;
create policy "courses: read" on public.courses for select to authenticated using (true);
drop policy if exists "workouts: read" on public.workouts;
create policy "workouts: read" on public.workouts for select to authenticated using (true);

revoke all on public.courses from anon, authenticated;
revoke all on public.workouts from anon, authenticated;
grant select on public.courses to authenticated;
grant select on public.workouts to authenticated;

-- -----------------------------------------------------------------------------
-- has_entitlement() — does the caller own this course? Admins own everything.
-- Security definer: customers cannot read public.purchases at all.
-- -----------------------------------------------------------------------------
create or replace function public.has_entitlement(p_course_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select public.is_admin() or exists (
    select 1
    from public.purchases p
    where p.status = 'active'
      and p.course_id = p_course_id
      and p.email = public.current_email()
  );
$$;

revoke execute on function public.has_entitlement(text) from public, anon;
grant execute on function public.has_entitlement(text) to authenticated;

-- =============================================================================
-- order_throttle — per-IP sliding window for the anonymous create_order() RPC.
-- Written only by create_order (security definer); no client ever touches it.
-- =============================================================================
create table if not exists public.order_throttle (
  bucket       text primary key,
  window_start timestamptz not null default now(),
  hits         int not null default 0
);

comment on table public.order_throttle is 'Rate-limit buckets for create_order(); key is the client IP or "global".';

create index if not exists order_throttle_window_idx on public.order_throttle (window_start);

alter table public.order_throttle enable row level security;
-- No policies at all: only the security-definer RPC (owner: postgres) writes here.
revoke all on public.order_throttle from anon, authenticated;

-- =============================================================================
-- user_course_state — per-user, per-course adaptive state.
-- =============================================================================
create table if not exists public.user_course_state (
  user_id            uuid not null references auth.users (id) on delete cascade,
  course_id          text not null,
  scale              numeric(4, 2) not null default 1.0 check (scale between 0.3 and 2),
  current_node_index int not null default 0 check (current_node_index >= 0),
  completed_node_ids text[] not null default '{}',
  updated_at         timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- Course id shape and a bound on the node list (a course has ~40 nodes; 500 is
-- room for every course plus repeats, and caps the row at a few kilobytes).
alter table public.user_course_state drop constraint if exists user_course_state_course_id_fmt;
alter table public.user_course_state add constraint user_course_state_course_id_fmt
  check (course_id ~ '^[a-z0-9_]{2,40}$')
  not valid;
alter table public.user_course_state drop constraint if exists user_course_state_nodes_bounded;
alter table public.user_course_state add constraint user_course_state_nodes_bounded
  check (
    cardinality(completed_node_ids) <= 500
    and (
      cardinality(completed_node_ids) = 0
      -- every element is a node id, which also bounds the row size
      or array_to_string(completed_node_ids, ',') ~ '^[a-z0-9_]{2,40}(,[a-z0-9_]{2,40})*$'
    )
  )
  not valid;

alter table public.user_course_state enable row level security;

drop trigger if exists set_updated_at on public.user_course_state;
create trigger set_updated_at
  before update on public.user_course_state
  for each row execute function public.set_updated_at();

-- Owner has full control of own rows.
drop policy if exists "user_course_state: owner all" on public.user_course_state;
create policy "user_course_state: owner all"
  on public.user_course_state for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.user_course_state from anon, authenticated;
grant select, insert, update, delete on public.user_course_state to authenticated;

-- =============================================================================
-- workout_sessions — one row per started workout; completed when completed_at is set.
-- =============================================================================
create table if not exists public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  course_id    text not null,
  node_id      text not null,
  workout_id   text not null,
  difficulty   text check (difficulty is null or difficulty in ('easier', 'normal', 'harder')),
  scale        numeric(4, 2),
  -- PrescribedWorkout / ExerciseResult[] (src/lib/training/types.ts)
  prescribed   jsonb,
  results      jsonb,
  rpe          int check (rpe is null or rpe between 1 and 10),
  feeling      text check (feeling is null or feeling in ('great', 'ok', 'hard', 'pain')),
  completion   numeric(4, 3) check (completion is null or completion between 0 and 1),
  -- Client-computed by the engine, then clamped by workout_sessions_guard to the
  -- ceiling of this workout (see the constraints below).
  points       int not null default 0,
  duration_sec int,
  calories     int,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  local_date   date not null
);

-- Hard bounds. The absolute points ceiling is the engine maximum:
-- basePoints 250 × harder 1.25 × streak 1.2 = 375 (docs/SPEC.md §7); the trigger
-- narrows it per workout. Rows written before this migration are clamped in place
-- as well, because the leaderboard sums them for everyone to see.
update public.workout_sessions set points = 375 where points > 375;
update public.workout_sessions set points = 0 where points < 0;
update public.workout_sessions set duration_sec = 21600 where duration_sec > 21600;
update public.workout_sessions set calories = 5000 where calories > 5000;

alter table public.workout_sessions drop constraint if exists workout_sessions_points_check;
alter table public.workout_sessions drop constraint if exists workout_sessions_points_ceiling;
alter table public.workout_sessions add constraint workout_sessions_points_ceiling
  check (points between 0 and 375)
  not valid;
alter table public.workout_sessions drop constraint if exists workout_sessions_ids_fmt;
alter table public.workout_sessions add constraint workout_sessions_ids_fmt
  check (
    course_id ~ '^[a-z0-9_]{2,40}$'
    and node_id ~ '^[a-z0-9_]{2,40}$'
    and workout_id ~ '^[a-z0-9_]{2,40}$'
  )
  not valid;
alter table public.workout_sessions drop constraint if exists workout_sessions_duration_sec_check;
alter table public.workout_sessions drop constraint if exists workout_sessions_duration_bounded;
alter table public.workout_sessions add constraint workout_sessions_duration_bounded
  check (duration_sec is null or duration_sec between 0 and 21600)
  not valid;
alter table public.workout_sessions drop constraint if exists workout_sessions_calories_check;
alter table public.workout_sessions drop constraint if exists workout_sessions_calories_bounded;
alter table public.workout_sessions add constraint workout_sessions_calories_bounded
  check (calories is null or calories between 0 and 5000)
  not valid;
-- A prescribed workout is ~5 KB of JSON; 64 KB is generous and stops a client from
-- filling the database through its own rows.
alter table public.workout_sessions drop constraint if exists workout_sessions_json_size;
alter table public.workout_sessions add constraint workout_sessions_json_size
  check (
    (prescribed is null or octet_length(prescribed::text) <= 65536)
    and (results is null or octet_length(results::text) <= 65536)
  )
  not valid;

create index if not exists workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_at);
create index if not exists workout_sessions_course_completed_idx
  on public.workout_sessions (course_id, completed_at);
create index if not exists workout_sessions_user_local_date_idx
  on public.workout_sessions (user_id, local_date);

alter table public.workout_sessions enable row level security;

-- -----------------------------------------------------------------------------
-- workout_sessions_guard — everything the leaderboard depends on is decided here,
-- never by the client:
--   * started_at / completed_at come from the server clock, and a completed_at
--     that is already set never moves (no back-dating into another week);
--   * local_date must be within a day of the server date (no backfill, no future);
--   * points are clamped to the engine ceiling for THIS workout:
--     base_points × difficulty (0.8 / 1.0 / 1.25) × repeat (0.5) × max streak
--     bonus (1.2) — docs/SPEC.md §7;
--   * at most 4 completed sessions per local day;
--   * user/course/node/workout are frozen after the insert.
-- Course ownership is enforced by the insert policy (has_entitlement).
-- Security definer so it can read public.workouts and count the caller's own rows
-- without extra grants; every query is keyed by new.user_id.
-- -----------------------------------------------------------------------------
create or replace function public.workout_sessions_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_uid     uuid := auth.uid();
  v_base    int;
  v_factor  numeric;
  v_repeat  boolean;
  v_ceiling int;
  v_today   int;
begin
  -- RLS says the same thing; repeating it here keeps the counters below from being
  -- probed with somebody else's user_id (the trigger runs before the check).
  if v_uid is not null and new.user_id is distinct from v_uid then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.started_at := now();
    if new.completed_at is not null then
      new.completed_at := now();
    end if;
  else
    -- A session's identity is fixed at insert: an update finishes the session it
    -- started, it cannot move points to another user, course or node.
    new.user_id    := old.user_id;
    new.course_id  := old.course_id;
    new.node_id    := old.node_id;
    new.workout_id := old.workout_id;

    new.started_at := old.started_at;
    if old.completed_at is not null then
      new.completed_at := old.completed_at;
    elsif new.completed_at is not null then
      new.completed_at := now();
    end if;
  end if;

  -- local_date is the athlete's own calendar day, and time zones reach UTC ± 14h,
  -- so exactly one day either side of the server date is allowed.
  if tg_op = 'INSERT' or new.local_date is distinct from old.local_date then
    if new.local_date < current_date - 1 or new.local_date > current_date + 1 then
      raise exception 'invalid_local_date' using errcode = 'P0001',
        hint = 'local_date must be within one day of the server date';
    end if;
  end if;

  select w.base_points into v_base
  from public.workouts w
  where w.course_id = new.course_id and w.id = new.workout_id;

  -- Unknown workout id (content newer than 0004_content_seed.sql): fall back to the
  -- smallest ceiling the content model allows (basePoints ≥ 60) instead of failing,
  -- so training keeps working while abuse stays bounded.
  v_base := coalesce(v_base, 60);

  v_factor := case new.difficulty
                when 'easier' then 0.8
                when 'harder' then 1.25
                else 1.0
              end;

  select exists (
    select 1
    from public.workout_sessions s
    where s.user_id = new.user_id
      and s.course_id = new.course_id
      and s.node_id = new.node_id
      and s.completed_at is not null
      and s.id <> new.id
  ) into v_repeat;

  v_ceiling := ceil(v_base * v_factor * (case when v_repeat then 0.5 else 1 end) * 1.2);
  new.points := least(greatest(coalesce(new.points, 0), 0), v_ceiling);

  if new.completed_at is not null and (tg_op = 'INSERT' or old.completed_at is null) then
    select count(*) into v_today
    from public.workout_sessions s
    where s.user_id = new.user_id
      and s.local_date = new.local_date
      and s.completed_at is not null
      and s.id <> new.id;

    if v_today >= 4 then
      raise exception 'too_many_sessions_today' using errcode = 'P0001',
        hint = 'At most 4 completed sessions per day';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.workout_sessions_guard() from public, anon, authenticated;

drop trigger if exists workout_sessions_guard on public.workout_sessions;
create trigger workout_sessions_guard
  before insert or update on public.workout_sessions
  for each row execute function public.workout_sessions_guard();

-- Owner reads/updates/deletes own rows; inserts must carry the caller's user_id.
drop policy if exists "workout_sessions: owner select" on public.workout_sessions;
create policy "workout_sessions: owner select"
  on public.workout_sessions for select
  to authenticated
  using (user_id = auth.uid());

-- Insert also requires an active purchase of the course: a locked course cannot be
-- trained, and its sessions cannot appear on its leaderboard. Update stays open so a
-- session started before a refund can still be finished.
drop policy if exists "workout_sessions: owner insert" on public.workout_sessions;
create policy "workout_sessions: owner insert"
  on public.workout_sessions for insert
  to authenticated
  with check (user_id = auth.uid() and public.has_entitlement(course_id));

drop policy if exists "workout_sessions: owner update" on public.workout_sessions;
create policy "workout_sessions: owner update"
  on public.workout_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "workout_sessions: owner delete" on public.workout_sessions;
create policy "workout_sessions: owner delete"
  on public.workout_sessions for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on public.workout_sessions from anon, authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;

-- =============================================================================
-- daily_logs — steps per local day; points recomputed server-side.
-- =============================================================================
create table if not exists public.daily_logs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  steps      int not null check (steps between 0 and 100000),
  points     int not null default 0,
  note       text,
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

update public.daily_logs set note = left(note, 500) where length(note) > 500;
alter table public.daily_logs drop constraint if exists daily_logs_note_len;
alter table public.daily_logs add constraint daily_logs_note_len
  check (note is null or length(note) <= 500)
  not valid;

alter table public.daily_logs enable row level security;

drop trigger if exists set_updated_at on public.daily_logs;
create trigger set_updated_at
  before update on public.daily_logs
  for each row execute function public.set_updated_at();

-- Mirrors the engine rule (docs/SPEC.md §7): 30 at goal, +5 per extra 1000, cap 60, 0 below.
create or replace function public.steps_points(p_steps int, p_goal int default 7000)
returns int
language sql
immutable
set search_path = pg_catalog, public, extensions
as $$
  select case
    when p_steps is null or p_steps < p_goal then 0
    else least(60, 30 + 5 * ((p_steps - p_goal) / 1000))
  end;
$$;

-- Nobody calls this over the API; the trigger below calls it as its owner.
revoke execute on function public.steps_points(int, int) from public, anon, authenticated;

-- The client sends points too, but the server always overwrites them from steps
-- so the leaderboard cannot be gamed by editing the payload. Security definer so
-- steps_points() needs no grant to authenticated.
create or replace function public.daily_logs_set_points()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  new.points := public.steps_points(new.steps);
  return new;
end;
$$;

revoke execute on function public.daily_logs_set_points() from public, anon, authenticated;

drop trigger if exists daily_logs_points on public.daily_logs;
create trigger daily_logs_points
  before insert or update on public.daily_logs
  for each row execute function public.daily_logs_set_points();

-- Owner has full control of own rows, but writes are limited to the days an athlete
-- can honestly log: yesterday's week back (a forgotten day) and tomorrow (time zones
-- ahead of the server). Without this, step points could be backfilled or pre-filled
-- for any date. Reads and deletes stay unrestricted in time.
drop policy if exists "daily_logs: owner all" on public.daily_logs;

drop policy if exists "daily_logs: owner select" on public.daily_logs;
create policy "daily_logs: owner select"
  on public.daily_logs for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "daily_logs: owner insert" on public.daily_logs;
create policy "daily_logs: owner insert"
  on public.daily_logs for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and local_date between current_date - 7 and current_date + 1
  );

drop policy if exists "daily_logs: owner update" on public.daily_logs;
create policy "daily_logs: owner update"
  on public.daily_logs for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and local_date between current_date - 7 and current_date + 1
  );

drop policy if exists "daily_logs: owner delete" on public.daily_logs;
create policy "daily_logs: owner delete"
  on public.daily_logs for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on public.daily_logs from anon, authenticated;
grant select, insert, update, delete on public.daily_logs to authenticated;

-- =============================================================================
-- benchmarks — personal records from test/benchmark nodes.
-- =============================================================================
create table if not exists public.benchmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  key         text not null check (key ~ '^[a-z0-9_]{2,60}$'),
  value       numeric not null,
  unit        text not null,
  recorded_at timestamptz not null default now()
);

-- Records are reps / seconds / meters / calories / rounds, rounded to 2 decimals by
-- the app: bound both the magnitude and the precision, and keep the unit a short tag.
alter table public.benchmarks drop constraint if exists benchmarks_value_bounded;
alter table public.benchmarks add constraint benchmarks_value_bounded
  check (value between 0 and 1000000 and value = round(value, 3))
  not valid;
alter table public.benchmarks drop constraint if exists benchmarks_unit_fmt;
alter table public.benchmarks add constraint benchmarks_unit_fmt
  check (unit ~ '^[a-z_]{1,16}$')
  not valid;

create index if not exists benchmarks_user_key_recorded_idx
  on public.benchmarks (user_id, key, recorded_at desc);

alter table public.benchmarks enable row level security;

-- Owner has full control of own rows.
drop policy if exists "benchmarks: owner all" on public.benchmarks;
create policy "benchmarks: owner all"
  on public.benchmarks for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.benchmarks from anon, authenticated;
grant select, insert, update, delete on public.benchmarks to authenticated;
