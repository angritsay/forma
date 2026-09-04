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
--
-- This is the only write anonymous visitors can make, so it carries the whole
-- abuse budget:
--   * the course must exist in public.courses (0004_content_seed.sql), so junk
--     rows cannot be invented;
--   * per-IP sliding window (public.order_throttle) caps bulk submissions;
--   * a per-email advisory lock makes the "max 10 pending" check race-free
--     (it used to be read-then-insert);
--   * an `active` purchase is never touched — not its status, not its source or
--     locale — so knowing a customer's email buys nothing.
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
set search_path = pg_catalog, public, extensions
as $$
declare
  -- Per IP per hour. Generous for a household or an office behind one NAT,
  -- small enough that scripted bulk inserts stop being interesting.
  c_ip_limit     constant int := 30;
  -- No IP header (direct SQL, a proxy that strips it): one shared bucket. Kept
  -- high on purpose — it must not turn a launch day into a self-inflicted outage.
  c_global_limit constant int := 200;
  c_window       constant interval := interval '1 hour';

  v_email   citext;
  v_locale  text;
  v_source  text;
  v_headers json;
  v_forward text[];
  v_ip      text;
  v_bucket  text;
  v_limit   int;
  v_hits    int;
  v_pending int;
  v_id      uuid;
begin
  v_email := public.normalize_email(p_email);

  if p_course_id is null
     or p_course_id !~ '^[a-z0-9_]{2,40}$'
     or not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception 'invalid_course' using errcode = 'P0001', hint = 'Unknown course id';
  end if;

  v_locale := case when p_locale in ('ru', 'en') then p_locale else 'ru' end;
  v_source := left(coalesce(nullif(trim(p_source), ''), 'landing'), 40);

  -- Client IP as the platform reports it; any parsing problem falls back to the
  -- global bucket rather than to no limit at all.
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_headers := null;
  end;

  -- `cf-connecting-ip` is written by the edge and cannot be spoofed by the caller.
  -- In `x-forwarded-for` only the LAST entry was added by the proxy in front of us;
  -- everything before it is whatever the client chose to send.
  v_forward := string_to_array(coalesce(v_headers ->> 'x-forwarded-for', ''), ',');
  v_ip := coalesce(
    nullif(btrim(coalesce(v_headers ->> 'cf-connecting-ip', '')), ''),
    nullif(btrim(coalesce(v_headers ->> 'x-real-ip', '')), ''),
    nullif(btrim(coalesce(v_forward[cardinality(v_forward)], '')), '')
  );

  if v_ip is null then
    v_bucket := 'global';
    v_limit  := c_global_limit;
  else
    v_bucket := left(v_ip, 45);
    v_limit  := c_ip_limit;
  end if;

  -- Sliding window: the bucket restarts once its window is older than c_window.
  -- Postgres has no autonomous transactions, so a call that raises rolls back its
  -- own increment: only orders that actually landed spend the budget, and the
  -- counter parks at the limit instead of running away.
  insert into public.order_throttle as t (bucket, window_start, hits)
  values (v_bucket, now(), 1)
  on conflict (bucket) do update
    set window_start = case when t.window_start < now() - c_window then now() else t.window_start end,
        hits         = case when t.window_start < now() - c_window then 1 else t.hits + 1 end
  returning t.hits into v_hits;

  if v_hits > v_limit then
    raise exception 'too_many_orders' using errcode = 'P0001', hint = 'Too many orders from this address, try again later';
  end if;

  -- Serialize everything for this email so the pending count cannot be raced.
  perform pg_advisory_xact_lock(hashtextextended('forma:create_order:' || v_email::text, 0));

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
        -- A refunded row becomes a new pending order (the coach still has to
        -- confirm payment before it grants anything).
        status     = 'pending'
    where purchases.status <> 'active'
  returning id into v_id;

  if v_id is null then
    -- The row is active: left untouched, and the caller gets the same id as before.
    select p.id into v_id
    from public.purchases p
    where p.email = v_email and p.course_id = p_course_id;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.create_order(text, text, text, text) from public;
grant execute on function public.create_order(text, text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- my_entitlements — active courses of the signed-in user.
--
-- Security *definer* (the default for a view): customers have no read policy on
-- public.purchases at all, because the row carries the coach's internal `note` and
-- `source`. This projects the two columns they may see, filtered by their verified
-- email. Dropped and recreated so re-running the file also flips the option on a
-- database created by an earlier version.
-- -----------------------------------------------------------------------------
drop view if exists public.my_entitlements;
create view public.my_entitlements
with (security_invoker = false)
as
  select p.course_id, p.activated_at
  from public.purchases p
  where p.status = 'active'
    and p.email = public.current_email();

revoke all on public.my_entitlements from anon, authenticated;
grant select on public.my_entitlements to authenticated;

-- -----------------------------------------------------------------------------
-- admin_set_purchase_status — activate / refund / reset a purchase.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_purchase_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
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

revoke execute on function public.admin_set_purchase_status(uuid, text) from public, anon;
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
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext;
  v_id    uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  -- Same validator as create_order(): one regex, one behaviour.
  v_email := public.normalize_email(p_email);

  -- Admins may grant a course that is not in the catalogue yet (a pre-sale), so
  -- only the id shape is enforced here — unlike create_order().
  if p_course_id is null or p_course_id !~ '^[a-z0-9_]{2,40}$' then
    raise exception 'invalid_course' using errcode = 'P0001';
  end if;

  insert into public.purchases (email, course_id, status, source, note, activated_at)
  values (v_email, p_course_id, 'active', 'admin', left(nullif(trim(p_note), ''), 500), now())
  on conflict (email, course_id) do update
    set status       = 'active',
        activated_at = coalesce(purchases.activated_at, now()),
        note         = coalesce(excluded.note, purchases.note),
        updated_at   = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.admin_add_purchase(text, text, text) from public, anon;
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
set search_path = pg_catalog, public, extensions
as $$
declare
  -- Defence in depth: the engine ceiling (basePoints 250 × harder 1.25 × streak 1.2)
  -- and the step-points cap. workout_sessions_guard already clamps per workout, but
  -- the board is the one place every athlete sees, so it clamps again.
  c_max_session_points constant int := 375;
  c_max_step_points    constant int := 60;

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
    select ws.user_id as uid, sum(least(greatest(ws.points, 0), c_max_session_points))::bigint as pts
    from public.workout_sessions ws
    where ws.completed_at is not null
      and ws.completed_at <= now()
      and (p_period = 'all' or ws.completed_at >= v_from)
      and (p_course_id is null or ws.course_id = p_course_id)
    group by ws.user_id
  ),
  d as (
    select dl.user_id as uid, sum(least(greatest(dl.points, 0), c_max_step_points))::bigint as pts
    from public.daily_logs dl
    -- Never count a day that has not happened yet (time zones ahead of the server
    -- reach current_date + 1).
    where p_course_id is null
      and dl.local_date <= current_date + 1
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
    -- Clamped again on the way out: this row is relayed to every other athlete.
    left(coalesce(nullif(trim(p.display_name), ''), 'Athlete ' || left(ro.uid::text, 4)), 60),
    left(coalesce(p.avatar_seed, left(ro.uid::text, 8)), 64),
    ro.pts,
    ro.rnk,
    ro.uid = v_me
  from rows_out ro
  left join public.profiles p on p.id = ro.uid
  order by ro.rnk, ro.uid;
end;
$$;

revoke execute on function public.get_leaderboard(text, text, int) from public, anon;
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
set search_path = pg_catalog, public, extensions
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

revoke execute on function public.get_my_totals() from public, anon;
grant execute on function public.get_my_totals() to authenticated;
