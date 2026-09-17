-- =============================================================================
-- 0015 — steps leave the product.
--
-- WHY. The owner's rule, in her own words: «Он либо стекается либо его нет
-- вообще. Потому что пользователь не будет заниматься трекингом одних и тех же
-- шагов в разных приложениях.» Either the step count syncs from the phone's own
-- health app, or the feature does not exist.
--
-- It cannot sync. Forma is a Telegram Mini App — a WebView — and:
--   • Apple HealthKit is a native iOS framework with no browser API at all. The
--     only way to read it is to ship a native app.
--   • Google Fit's REST API stopped accepting new developer registrations on
--     1 May 2024 and shuts down at the end of 2026, so it cannot even be applied
--     for.
--   • Health Connect, its replacement, reads on-device data from a native
--     Android app. There is no web endpoint.
--   • The Google Health API (the former Fitbit Web API) is a cloud API for
--     Fitbit and Pixel Watch accounts — not the phone's Health app, and not
--     something a person without one of those devices has anything in.
--
-- So the number could only ever be typed in by hand, which is what the app did,
-- and which is the arrangement the rule rejects. Everything that counted steps
-- is therefore removed rather than left switched off.
--
-- ⚠️ THIS DROPS DATA AND CANNOT BE UNDONE. `public.daily_logs` holds every day
-- anyone ever logged, together with the screenshot path that went with it. Take
-- a backup first if any of it is worth keeping — on a project that has not
-- launched, it is test data and it is not.
--
-- Objects in the `proofs` bucket under `steps/<user_id>/…` are NOT deleted here:
-- SQL cannot remove files from Storage. After this runs they are unreachable
-- (the policies that granted access are gone) and can be deleted from the
-- Storage screen, or left to sit.
--
-- Safe to re-run: every drop is `if exists`, and both functions are rewritten
-- with `create or replace`.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) The leaderboard stops counting step points.
--
-- Same function, minus the `d` CTE that summed `daily_logs` and minus the cap
-- that clamped it. A course board never counted steps in the first place
-- (`where p_course_id is null`), so only the global board changes.
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
  -- Defence in depth: the engine ceiling (basePoints 250 × harder 1.25 × streak 1.2).
  -- workout_sessions_guard already clamps per workout, but the board is the one place
  -- every athlete sees, so it clamps again.
  c_max_session_points constant int := 375;

  v_me      uuid := auth.uid();
  v_limit   int  := least(greatest(coalesce(p_limit, 100), 1), 500);
  v_week_ts timestamp;
  v_from    timestamptz;
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
  v_week_ts := date_trunc('week', now() at time zone 'utc');
  v_from    := v_week_ts at time zone 'utc';

  return query
  with totals as (
    select ws.user_id as uid,
           sum(least(greatest(ws.points, 0), c_max_session_points))::bigint as pts
    from public.workout_sessions ws
    where ws.completed_at is not null
      and ws.completed_at <= now()
      and (p_period = 'all' or ws.completed_at >= v_from)
      and (p_course_id is null or ws.course_id = p_course_id)
    group by ws.user_id
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
-- 2) All-time totals stop adding step points.
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
              where ws.user_id = auth.uid() and ws.completed_at is not null), 0)::bigint as points,
    coalesce((select count(*) from public.workout_sessions ws
              where ws.user_id = auth.uid() and ws.completed_at is not null), 0)::bigint as workouts,
    coalesce((select sum(ws.duration_sec) from public.workout_sessions ws
              where ws.user_id = auth.uid() and ws.completed_at is not null), 0)::bigint / 60 as minutes;
$$;

revoke execute on function public.get_my_totals() from public, anon;
grant execute on function public.get_my_totals() to authenticated;

-- -----------------------------------------------------------------------------
-- 3) The storage policies for step screenshots, and the function behind them.
--
-- The `proofs` bucket itself stays — the club's own proof lives in it under
-- `marathon/…` and is governed by 0011's policies, which are untouched.
-- -----------------------------------------------------------------------------
drop policy if exists "proofs: steps own read"   on storage.objects;
drop policy if exists "proofs: steps own insert" on storage.objects;
drop policy if exists "proofs: steps own update" on storage.objects;
drop policy if exists "proofs: steps own delete" on storage.objects;

drop function if exists public.owns_step_proof_path(text);

-- -----------------------------------------------------------------------------
-- 4) The table, its trigger and its scoring function.
--
-- The trigger goes with the table (`drop table` takes it), but the two functions
-- are separate objects and have to be named.
-- -----------------------------------------------------------------------------
drop table if exists public.daily_logs cascade;

drop function if exists public.daily_logs_set_points();
drop function if exists public.steps_points(int, int);

-- -----------------------------------------------------------------------------
-- 5) The rest day's step goal, in the course builder.
--
-- A rest day was completed by reaching a number of steps; it is now simply a day
-- that is marked as taken. The column is dropped rather than ignored so the
-- admin screen and the published bundle cannot disagree about whether it exists.
-- -----------------------------------------------------------------------------
-- `if exists` on the table as well: this file is order-independent, and a throwaway database
-- built for the smoke suite has 0001-0004 but not yet 0008, which creates this table.
alter table if exists public.admin_course_days drop column if exists steps_goal;

commit;
