-- =============================================================================
-- 0049 — флаги функций по людям: включить что-то одному человеку, не всем.
--
-- Владелица хочет свою карточку на вкладке «Тренер» рядом с карточкой Сергея, но сначала только
-- у себя: посмотреть на живом приложении, а потом решить, кому ещё. Для этого нужен выключатель
-- на человека, а не на сборку:
--
--   1. `feature_flags` — строка (флаг, пользователь) значит «у этого человека включено». Нет
--      строки — выключено. Никаких значений кроме «да»: флаг либо есть, либо нет.
--   2. `my_feature_flags()` — какие флаги включены у того, кто спрашивает. Приложение читает это
--      после входа, рядом с покупками. RLS отдаёт только свои строки.
--   3. `admin_set_feature_flag(p_flag, p_email, p_on)` — админ включает или выключает флаг человеку
--      на его странице (/admin/people/<почта>). Человек ищется по почте так же, как в 0046:
--      `profiles.email` (citext), без учёта регистра.
--   4. `admin_feature_flags(p_email)` — какие флаги включены у этого человека, для той же страницы.
--
-- Писать в таблицу напрямую нельзя никому, кроме админской RPC: грантов insert/update/delete у
-- `authenticated` нет, так что человек не включит себе флаг сам.
--
-- Известные флаги перечислены в `src/lib/flags.ts` (сейчас один — `coach_nastia`). База их не
-- перечисляет: новый флаг — это строчка в коде, а не миграция. Проверяется только форма ключа.
--
-- Ничего не сидирует: флаг включают руками в админке.
--
-- Требует 0001 (is_admin, profiles). Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Таблица.
-- -----------------------------------------------------------------------------
create table if not exists public.feature_flags (
  flag       text not null check (flag ~ '^[a-z0-9_]{2,60}$'),
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (flag, user_id)
);

comment on table public.feature_flags is
  'Per-person feature flags: a row means the flag is on for that user. Written only by admin_set_feature_flag (0049).';

create index if not exists feature_flags_user_idx on public.feature_flags (user_id);

alter table public.feature_flags enable row level security;

drop policy if exists "feature_flags: own select" on public.feature_flags;
create policy "feature_flags: own select"
  on public.feature_flags for select
  to authenticated
  using (user_id = auth.uid());

revoke all on public.feature_flags from anon, authenticated;
grant select on public.feature_flags to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Свои флаги.
-- -----------------------------------------------------------------------------
create or replace function public.my_feature_flags()
returns text[]
language sql
stable
security invoker
set search_path = pg_catalog, public, extensions
as $$
  select coalesce(array_agg(f.flag order by f.flag), array[]::text[])
  from public.feature_flags f
  where f.user_id = auth.uid();
$$;

comment on function public.my_feature_flags() is
  'The caller''s feature flags (0049); an empty array when none.';

revoke all on function public.my_feature_flags() from public, anon;
grant execute on function public.my_feature_flags() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Админ: включить / выключить флаг человеку по почте.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_feature_flag(p_flag text, p_email text, p_on boolean)
returns boolean
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := lower(btrim(coalesce(p_email, '')));
  v_flag  text := btrim(coalesce(p_flag, ''));
  v_uid   uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_flag !~ '^[a-z0-9_]{2,60}$' then
    raise exception 'invalid_flag' using errcode = '22023';
  end if;
  if v_email = '' or length(v_email::text) > 254 or position('@' in v_email::text) = 0 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  select p.id into v_uid from public.profiles p where p.email = v_email limit 1;
  if v_uid is null then
    raise exception 'no_user' using errcode = 'P0002';
  end if;

  if coalesce(p_on, false) then
    insert into public.feature_flags (flag, user_id)
    values (v_flag, v_uid)
    on conflict (flag, user_id) do nothing;
  else
    delete from public.feature_flags f where f.flag = v_flag and f.user_id = v_uid;
  end if;

  return exists (
    select 1 from public.feature_flags f where f.flag = v_flag and f.user_id = v_uid
  );
end;
$$;

comment on function public.admin_set_feature_flag(text, text, boolean) is
  'Admin-only: switch a feature flag on or off for the person with this email; returns the new state (0049).';

revoke all on function public.admin_set_feature_flag(text, text, boolean) from public, anon;
grant execute on function public.admin_set_feature_flag(text, text, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Админ: какие флаги у человека.
-- -----------------------------------------------------------------------------
create or replace function public.admin_feature_flags(p_email text)
returns text[]
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := lower(btrim(coalesce(p_email, '')));
  v_uid   uuid;
  v_flags text[];
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_email = '' or length(v_email::text) > 254 or position('@' in v_email::text) = 0 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  select p.id into v_uid from public.profiles p where p.email = v_email limit 1;
  if v_uid is null then
    raise exception 'no_user' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(f.flag order by f.flag), array[]::text[])
    into v_flags
  from public.feature_flags f
  where f.user_id = v_uid;

  return v_flags;
end;
$$;

comment on function public.admin_feature_flags(text) is
  'Admin-only: the feature flags that are on for the person with this email (0049).';

revoke all on function public.admin_feature_flags(text) from public, anon;
grant execute on function public.admin_feature_flags(text) to authenticated;

notify pgrst, 'reload schema';
