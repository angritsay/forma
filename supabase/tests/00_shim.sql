-- =============================================================================
-- Local verification of the migrations on a plain Postgres 16 (no Supabase needed).
-- Run from the repo root, in this order, against a throwaway database:
--   createdb forma_test
--   psql -v ON_ERROR_STOP=1 -d forma_test -f supabase/tests/00_shim.sql
--   psql -v ON_ERROR_STOP=1 -d forma_test -f supabase/migrations/0001_init.sql
--   psql -v ON_ERROR_STOP=1 -d forma_test -f supabase/migrations/0002_functions.sql
--   psql -v ON_ERROR_STOP=1 -d forma_test -f supabase/migrations/0003_storage.sql
--   psql -v ON_ERROR_STOP=1 -d forma_test -f supabase/migrations/0004_content_seed.sql
--   psql -v ON_ERROR_STOP=1 -d forma_test -f supabase/tests/10_smoke.sql   # prints ALL TESTS PASSED
-- Never run the shim against a real Supabase project: it exists only to stand in
-- for the auth/storage schemas Supabase already provides.
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists auth;
-- The columns public.current_email() relies on exist in the real GoTrue schema too.
-- email_confirmed_at defaults to now() here so a test user is "confirmed" unless a
-- test explicitly says otherwise.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255),
  email_confirmed_at timestamptz default now(),
  banned_until timestamptz,
  deleted_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table auth.users add column if not exists email_confirmed_at timestamptz default now();
alter table auth.users add column if not exists banned_until timestamptz;
alter table auth.users add column if not exists deleted_at timestamptz;

-- Supabase reads JWT claims from a GUC; the tests set request.jwt.claims explicitly.
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
$$;
create or replace function auth.email() returns text language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', '')
$$;
create or replace function auth.role() returns text language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '')
$$;
grant usage on schema auth to anon, authenticated, service_role;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language plpgsql immutable as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end
$$;
grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;

-- Supabase ships this default privilege, which is why `revoke execute … from public`
-- alone does not take EXECUTE away from the API roles. Mirroring it here makes the
-- local run reflect production: the migrations must revoke from anon/authenticated
-- explicitly (0001_init.sql turns the default off first).
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
