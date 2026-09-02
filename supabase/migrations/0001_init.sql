-- =============================================================================
-- Forma — 0001_init: extensions, tables, triggers, RLS policies, grants.
-- Contract: docs/SPEC.md §8. Idempotent: safe to re-run in the SQL editor.
-- Apply order: 0001_init.sql → 0002_functions.sql → 0003_storage.sql → seed.sql
-- =============================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- PostgREST exposes `public`; anon/authenticated need schema usage only.
grant usage on schema public to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Generic trigger: bump updated_at on every update.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

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
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    -- Email OTP always has an email; coalesce keeps auth signups from failing
    -- if another provider without an email is ever enabled.
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

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
set search_path = public
as $$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

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
  with check (id = auth.uid() and email = auth.email()::citext);

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
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.email = auth.email()::citext
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

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

-- A signed-in user sees the rows for their own email (any status).
drop policy if exists "purchases: owner select" on public.purchases;
create policy "purchases: owner select"
  on public.purchases for select
  to authenticated
  using (email = auth.email()::citext);

-- No anon policies: anonymous visitors only go through create_order().

revoke all on public.purchases from anon, authenticated;
grant select, insert, update, delete on public.purchases to authenticated;

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
  -- Client-computed by the engine; capped so a tampered payload cannot flood the leaderboard.
  points       int not null default 0 check (points between 0 and 500),
  duration_sec int check (duration_sec is null or duration_sec >= 0),
  calories     int check (calories is null or calories >= 0),
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  local_date   date not null
);

create index if not exists workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_at);
create index if not exists workout_sessions_course_completed_idx
  on public.workout_sessions (course_id, completed_at);
create index if not exists workout_sessions_user_local_date_idx
  on public.workout_sessions (user_id, local_date);

alter table public.workout_sessions enable row level security;

-- Owner reads/updates/deletes own rows; inserts must carry the caller's user_id.
drop policy if exists "workout_sessions: owner select" on public.workout_sessions;
create policy "workout_sessions: owner select"
  on public.workout_sessions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "workout_sessions: owner insert" on public.workout_sessions;
create policy "workout_sessions: owner insert"
  on public.workout_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

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
as $$
  select case
    when p_steps is null or p_steps < p_goal then 0
    else least(60, 30 + 5 * ((p_steps - p_goal) / 1000))
  end;
$$;

revoke execute on function public.steps_points(int, int) from public;
grant execute on function public.steps_points(int, int) to authenticated;

-- The client sends points too, but the server always overwrites them from steps
-- so the leaderboard cannot be gamed by editing the payload.
create or replace function public.daily_logs_set_points()
returns trigger
language plpgsql
as $$
begin
  new.points := public.steps_points(new.steps);
  return new;
end;
$$;

drop trigger if exists daily_logs_points on public.daily_logs;
create trigger daily_logs_points
  before insert or update on public.daily_logs
  for each row execute function public.daily_logs_set_points();

-- Owner has full control of own rows.
drop policy if exists "daily_logs: owner all" on public.daily_logs;
create policy "daily_logs: owner all"
  on public.daily_logs for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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
