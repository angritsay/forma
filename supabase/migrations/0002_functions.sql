-- =============================================================================
-- Forma — 0002_functions: RPCs and views (orders, entitlements, admin, leaderboard).
-- Requires 0001_init.sql. Idempotent (create or replace).
--
-- Error convention: app-level validation failures raise with errcode P0001 and a
-- short machine-readable message (invalid_email, invalid_course, …); permission
-- failures use 42501; missing rows use P0002. src/lib/api/errors.ts maps these.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- create_order — anonymous order from the landing. Upserts a pending purchase.
-- -----------------------------------------------------------------------------
create or replace function public.create_order(
  p_email     text,
  p_course_id text,
  p_locale    text default 'ru',
  p_source    text default 'landing'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   citext;
  v_locale  text;
  v_source  text;
  v_pending int;
  v_id      uuid;
begin
  v_email := lower(trim(coalesce(p_email, '')));

  if length(v_email) > 254
     or v_email !~ '^[a-z0-9][a-z0-9._%+-]*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,24}$' then
    raise exception 'invalid_email' using errcode = 'P0001', hint = 'Enter a valid email address';
  end if;

  if p_course_id is null or p_course_id !~ '^[a-z0-9_]{2,40}$' then
    raise exception 'invalid_course' using errcode = 'P0001', hint = 'Unknown course id';
  end if;

  v_locale := case when p_locale in ('ru', 'en') then p_locale else 'ru' end;
  v_source := left(coalesce(nullif(trim(p_source), ''), 'landing'), 40);

  -- Abuse guard: a real customer can have at most one pending row per course.
  select count(*) into v_pending
  from public.purchases
  where email = v_email and status = 'pending';

  if v_pending >= 10 then
    raise exception 'too_many_pending' using errcode = 'P0001', hint = 'Too many pending orders for this email';
  end if;

  insert into public.purchases (email, course_id, status, source, locale)
  values (v_email, p_course_id, 'pending', v_source, v_locale)
  on conflict (email, course_id) do update
    set updated_at = now(),
        source     = excluded.source,
        locale     = coalesce(excluded.locale, purchases.locale),
        -- Never downgrade an active purchase; a refunded one becomes pending again
        -- (the coach sees it as a new order).
        status     = case when purchases.status = 'active' then 'active' else 'pending' end
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.create_order(text, text, text, text) from public;
grant execute on function public.create_order(text, text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- my_entitlements — active courses of the signed-in user (by email).
-- security_invoker: RLS on purchases applies to the caller, so the view only
-- ever shows the caller's own rows.
-- -----------------------------------------------------------------------------
create or replace view public.my_entitlements
with (security_invoker = true)
as
  select p.course_id, p.activated_at
  from public.purchases p
  where p.status = 'active'
    and p.email = auth.email()::citext;

revoke all on public.my_entitlements from anon, authenticated;
grant select on public.my_entitlements to authenticated;

-- -----------------------------------------------------------------------------
-- admin_set_purchase_status — activate / refund / reset a purchase.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_purchase_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('pending', 'active', 'refunded') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  update public.purchases
  set status       = p_status,
      -- First activation stamps activated_at; re-activation keeps the original date.
      activated_at = case when p_status = 'active' then coalesce(activated_at, now()) else activated_at end,
      updated_at   = now()
  where id = p_id;

  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_set_purchase_status(uuid, text) from public;
grant execute on function public.admin_set_purchase_status(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- admin_add_purchase — manual activation (bank transfer, gift, support case).
-- -----------------------------------------------------------------------------
create or replace function public.admin_add_purchase(
  p_email     text,
  p_course_id text,
  p_note      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email citext;
  v_id    uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if length(v_email) > 254 or v_email !~ '^[a-z0-9][a-z0-9._%+-]*@[a-z0-9.-]+\.[a-z]{2,24}$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;

  if p_course_id is null or p_course_id !~ '^[a-z0-9_]{2,40}$' then
    raise exception 'invalid_course' using errcode = 'P0001';
  end if;

  insert into public.purchases (email, course_id, status, source, note, activated_at)
  values (v_email, p_course_id, 'active', 'admin', nullif(trim(p_note), ''), now())
  on conflict (email, course_id) do update
    set status       = 'active',
        activated_at = coalesce(purchases.activated_at, now()),
        note         = coalesce(excluded.note, purchases.note),
        updated_at   = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.admin_add_purchase(text, text, text) from public;
grant execute on function public.admin_add_purchase(text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- get_leaderboard — top N by points (+ the caller's own row), never exposes emails.
--   p_period    'week' (current ISO week, UTC) | 'all'
--   p_course_id null → global (workout points + step points); id → that course only
-- -----------------------------------------------------------------------------
create or replace function public.get_leaderboard(
  p_period    text default 'week',
  p_course_id text default null,
  p_limit     int  default 100
)
returns table (
  user_id      uuid,
  display_name text,
  avatar_seed  text,
  points       bigint,
  rank         bigint,
  is_me        boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me        uuid := auth.uid();
  v_limit     int  := least(greatest(coalesce(p_limit, 100), 1), 500);
  v_week_ts   timestamp;
  v_from      timestamptz;
  v_from_date date;
begin
  if v_me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_period is null or p_period not in ('week', 'all') then
    raise exception 'invalid_period' using errcode = 'P0001';
  end if;

  if p_course_id is not null and p_course_id !~ '^[a-z0-9_]{2,40}$' then
    raise exception 'invalid_course' using errcode = 'P0001';
  end if;

  -- Monday 00:00 UTC of the current ISO week.
  v_week_ts   := date_trunc('week', now() at time zone 'utc');
  v_from      := v_week_ts at time zone 'utc';
  v_from_date := v_week_ts::date;

  return query
  with s as (
    select ws.user_id as uid, sum(ws.points)::bigint as pts
    from public.workout_sessions ws
    where ws.completed_at is not null
      and (p_period = 'all' or ws.completed_at >= v_from)
      and (p_course_id is null or ws.course_id = p_course_id)
    group by ws.user_id
  ),
  d as (
    select dl.user_id as uid, sum(dl.points)::bigint as pts
    from public.daily_logs dl
    where p_course_id is null
      and (p_period = 'all' or dl.local_date >= v_from_date)
    group by dl.user_id
  ),
  totals as (
    select coalesce(s.uid, d.uid) as uid,
           coalesce(s.pts, 0) + coalesce(d.pts, 0) as pts
    from s
    full outer join d on d.uid = s.uid
  ),
  ranked as (
    select t.uid, t.pts, rank() over (order by t.pts desc, t.uid) as rnk
    from totals t
    where t.pts > 0
  ),
  top as (
    select r.uid, r.pts, r.rnk from ranked r order by r.rnk, r.uid limit v_limit
  ),
  me as (
    select r.uid, r.pts, r.rnk from ranked r where r.uid = v_me
    union all
    -- Caller without points yet: last place, 0 points.
    select v_me, 0::bigint, (select count(*) from ranked) + 1
    where not exists (select 1 from ranked r where r.uid = v_me)
  ),
  rows_out as (
    select * from top
    union
    select * from me
  )
  select
    ro.uid,
    coalesce(nullif(trim(p.display_name), ''), 'Athlete ' || left(ro.uid::text, 4)),
    coalesce(p.avatar_seed, left(ro.uid::text, 8)),
    ro.pts,
    ro.rnk,
    ro.uid = v_me
  from rows_out ro
  left join public.profiles p on p.id = ro.uid
  order by ro.rnk, ro.uid;
end;
$$;

revoke execute on function public.get_leaderboard(text, text, int) from public;
grant execute on function public.get_leaderboard(text, text, int) to authenticated;

-- -----------------------------------------------------------------------------
-- get_my_totals — home screen numbers for the caller (security invoker: RLS
-- already limits both tables to own rows).
--   points   = workout points + step points, all time
--   workouts = completed sessions
--   minutes  = sum(duration_sec) / 60 of completed sessions
-- -----------------------------------------------------------------------------
create or replace function public.get_my_totals()
returns table (points bigint, workouts bigint, minutes bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select sum(ws.points) from public.workout_sessions ws
              where ws.user_id = auth.uid() and ws.completed_at is not null), 0)::bigint
    + coalesce((select sum(dl.points) from public.daily_logs dl
                where dl.user_id = auth.uid()), 0)::bigint                       as points,
    coalesce((select count(*) from public.workout_sessions ws
              where ws.user_id = auth.uid() and ws.completed_at is not null), 0)::bigint as workouts,
    coalesce((select sum(ws.duration_sec) from public.workout_sessions ws
              where ws.user_id = auth.uid() and ws.completed_at is not null), 0)::bigint / 60 as minutes;
$$;

revoke execute on function public.get_my_totals() from public;
grant execute on function public.get_my_totals() to authenticated;
