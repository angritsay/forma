-- =============================================================================
-- 0037 — доска не считает тренировки, выданные тренером лично.
--
-- Владелец: «не надо никаких баллов за тренировки Сергея, которые он назначил, потому что эти
-- баллы тогда будут влиять на лидерборд. Люди, которые покупают тренировки Сергея, будут
-- автоматически выше и будут каждую неделю получать просто бесплатные тренировки, что не очень
-- честно по отношению к остальным».
--
-- Приложение с этой же правкой перестаёт начислять очки за такую тренировку вовсе
-- (`customWorkoutPoints`). Здесь — вторая половина: сессии, записанные раньше, уже лежат в базе со
-- своими очками, и доска перестаёт их считать, вместо того чтобы переписывать историю.
--
-- Сама тренировка ничего не теряет: она по-прежнему засчитывается выполненной, держит серию и
-- уходит с полки — всё это считается по наличию строки, а не по числу в ней.
--
-- Требует 0002_functions.sql. Идемпотентна.
-- =============================================================================

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

  /*
   * Тренировки, выданные тренером лично, лежат в сессиях под этим курсом (0024) — и в счёт недели
   * не идут. Решение владельца, и оно про справедливость, а не про подсчёт: приз недели — час с
   * тренером, а очки за персональную работу давали купившему её фору в гонке за бесплатную
   * персональную работу. Деньги превращались в место в рейтинге, место — обратно в деньги.
   *
   * Правило живёт здесь, а не только в приложении, по двум причинам. Уже записанные сессии несут
   * свои старые очки, и переписывать историю ради этого не нужно — достаточно перестать её
   * считать. И доска — единственное место, которое видит каждый; она уже перестраховывается
   * потолками выше, здесь та же мысль.
   */
  c_custom_course_id   constant text := 'custom';

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
      -- Выданная тренером лично тренировка неделю не двигает (объяснение у c_custom_course_id).
      and ws.course_id is distinct from c_custom_course_id
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
