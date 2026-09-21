-- =============================================================================
-- 0025 — что происходит со всеми, а не с одним: воронка, конверсия, прогресс.
--
-- Владелец: «Обязательно добавь внутри админки возможность отслеживать прогресс
-- всех пользователей, чтобы мы собирали аналитику и могли в дальнейшем улучшать
-- все приложение на основе реальных данных наших пользователей» и, уточняя,
-- «я вообще заинтересована просто в том, чтобы раз в неделю заходить и
-- анализировать аналитику по воронке и по конверсии».
--
-- ## Воронка считается по когортам, и это главное решение здесь
--
-- Самый простой отчёт — «за эту неделю: вошло 10, купило 3» — почти всегда врёт.
-- Эти трое могли зайти в марте и купить сегодня; неделя, в которой они посчитаны
-- покупкой, к их регистрации отношения не имеет, и конверсия «30%» не относится
-- ни к какой группе людей. Поэтому человек попадает ровно в одну строку — неделю
-- своего первого входа, — а его покупка считается в этой же строке, когда бы она
-- ни случилась. Тогда «из 10 вошедших на той неделе купили 3» — это предложение
-- про одних и тех же десятерых, и его можно сравнивать с соседней неделей.
--
-- Цена честности: свежая неделя всегда выглядит хуже старой, потому что её людям
-- ещё не хватило времени дойти до оплаты. Экран за это отвечает сам — он не
-- усредняет последнюю неделю вместе с остальными и подписывает её как идущую.
--
-- ## Неделя — московская, с понедельника
--
-- `date_trunc('week')` в Postgres уже даёт понедельник (ISO). Часовой пояс взят
-- тот же, что по умолчанию у марафонов (0011), — тренер и почти все занимающиеся
-- в нём и живут, а отчёт, у которого воскресенье уезжает в следующую неделю,
-- читается неправильно ровно там, где по нему принимают решения.
--
-- ## Почему отдельные функции, а не расширение `admin_people()`
--
-- `admin_people()` (0013) отвечает на нажатие клавиши в поле выбора человека и
-- обязана оставаться дешёвой. Здесь наоборот: это запрос на открытие страницы,
-- он проходит по всем сессиям. Одна функция на две работы означала бы, что поиск
-- по имени платит за подсчёт тренировок на каждую букву.
--
-- Всё admin-only через `is_admin()`, как и вся 0013. Ни одна из функций не пишет.
-- Требует 0001_init.sql, 0005_subscriptions.sql, 0013_admin_people.sql.
-- Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- admin_overview — несколько чисел «прямо сейчас», шапкой над воронкой.
-- -----------------------------------------------------------------------------
--
-- `paid_never_signed_in` — единственное число здесь, которое требует действия, а
-- не размышления: человек заплатил и ни разу не вошёл. Покупка живёт на почте и
-- может быть раньше регистрации (0013 прямо это оговаривает), так что такие люди
-- не попадают ни в одну когорту воронки и не видны нигде. Обычно это опечатка в
-- адресе или письмо, которое не дошло, — и то и другое чинится звонком.
create or replace function public.admin_overview()
returns table (
  people               int,
  onboarded            int,
  paying               int,
  subscribed           int,
  paid_never_signed_in int,
  active_7d            int,
  active_28d           int
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  select
    (select count(*)::int from public.profiles),
    (select count(*)::int from public.profiles p where p.onboarded_at is not null),
    -- Платящий — это человек, а не покупка: два курса одного человека это один он.
    (
      select count(distinct p.id)::int
      from public.profiles p
      where exists (
              select 1 from public.purchases pu
              where pu.email = p.email and pu.status = 'active'
            )
         or exists (
              select 1 from public.subscriptions s
              where s.email = p.email
                and public.subscription_live(s.status, s.expires_at)
            )
    ),
    (
      select count(distinct p.id)::int
      from public.profiles p
      where exists (
        select 1 from public.subscriptions s
        where s.email = p.email
          and public.subscription_live(s.status, s.expires_at)
      )
    ),
    (
      select count(*)::int
      from (
        select pu.email from public.purchases pu where pu.status = 'active'
        union
        select s.email from public.subscriptions s
        where public.subscription_live(s.status, s.expires_at)
      ) paid
      where not exists (select 1 from public.profiles p where p.email = paid.email)
    ),
    -- Занимался, а не заходил: вход мы не пишем, да и заходить, не тренируясь, —
    -- не та активность, ради которой всё это.
    (
      select count(distinct ws.user_id)::int
      from public.workout_sessions ws
      where ws.completed_at is not null and ws.completed_at > now() - interval '7 days'
    ),
    (
      select count(distinct ws.user_id)::int
      from public.workout_sessions ws
      where ws.completed_at is not null and ws.completed_at > now() - interval '28 days'
    );
end;
$$;

comment on function public.admin_overview() is
  'Admin-only: headline numbers for the analytics screen (0025). Read-only.';

revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- -----------------------------------------------------------------------------
-- admin_funnel — по неделе первого входа: сколько дошло до каждого шага.
-- -----------------------------------------------------------------------------
--
-- Шаги выбраны так, чтобы каждый был фактом в базе, а не догадкой:
--   signed_up — есть строка в `profiles` (код подтверждён);
--   onboarded — `onboarded_at` проставлен;
--   trained   — есть хоть одна завершённая тренировка (первая всегда бесплатна,
--               0022, так что это шаг «попробовал», а не «купил»);
--   repeated  — завершённые тренировки в два разных собственных дня. Именно
--               `local_date`, а не `completed_at`: две тренировки подряд вечером
--               и утром — это два дня, а две за один вечер — один;
--   paid      — есть активная покупка или живая подписка, когда бы ни появилась.
--
-- Шага «открыл приложение» здесь нет и не будет, пока мы не пишем входы. Считать
-- воронку от того, чего не измеряем, — это придумать первое число и поделить на
-- него все остальные.
create or replace function public.admin_funnel(p_weeks int default 12)
returns table (
  week_start date,
  signed_up  int,
  onboarded  int,
  trained    int,
  repeated   int,
  paid       int
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_weeks int := greatest(1, least(coalesce(p_weeks, 12), 104));
  v_from  date;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  v_from := (date_trunc('week', (now() at time zone 'Europe/Moscow'))::date)
            - ((v_weeks - 1) * 7);

  return query
  with cohort as (
    select
      p.id,
      p.email,
      p.onboarded_at,
      date_trunc('week', (p.created_at at time zone 'Europe/Moscow'))::date as wk
    from public.profiles p
    where (p.created_at at time zone 'Europe/Moscow')::date >= v_from
  ),
  done as (
    select
      ws.user_id,
      count(distinct ws.local_date)::int as days
    from public.workout_sessions ws
    where ws.completed_at is not null
      and ws.user_id in (select c.id from cohort c)
    group by ws.user_id
  )
  select
    c.wk,
    count(*)::int,
    count(*) filter (where c.onboarded_at is not null)::int,
    count(*) filter (where coalesce(d.days, 0) >= 1)::int,
    count(*) filter (where coalesce(d.days, 0) >= 2)::int,
    count(*) filter (
      where exists (
              select 1 from public.purchases pu
              where pu.email = c.email and pu.status = 'active'
            )
         or exists (
              select 1 from public.subscriptions s
              where s.email = c.email
                and public.subscription_live(s.status, s.expires_at)
            )
    )::int
  from cohort c
  left join done d on d.user_id = c.id
  group by c.wk
  order by c.wk desc;
end;
$$;

comment on function public.admin_funnel(int) is
  'Admin-only: the sign-up-week cohort funnel — signed up → onboarded → trained → repeated → paid (0025).';

revoke execute on function public.admin_funnel(int) from public, anon;
grant execute on function public.admin_funnel(int) to authenticated;

-- -----------------------------------------------------------------------------
-- admin_progress — «прогресс всех пользователей», по одной строке на человека.
-- -----------------------------------------------------------------------------
--
-- Воронка говорит, сколько людей отвалилось; это — кто именно. Без второго первое
-- нельзя починить: «на шаге «попробовал» теряем половину» превращается в работу
-- только тогда, когда видно, кто эта половина и когда они были тут в последний раз.
--
-- Сортировка по последней тренировке, а не по дате входа: сверху те, кто занимался
-- только что, снизу — кто пропал. Никогда не тренировавшиеся идут в самом низу,
-- новыми вперёд.
create or replace function public.admin_progress(
  p_search text default null,
  p_limit  int  default 200
)
returns table (
  email           citext,
  display_name    text,
  created_at      timestamptz,
  onboarded_at    timestamptz,
  workouts        int,
  days            int,
  points          int,
  last_workout_at timestamptz,
  courses         int,
  subscribed      boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_term text;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  -- Тот же escape, что в `admin_people()` (0013): вставленный адрес не должен
  -- превращаться в шаблон поиска.
  v_term := nullif(trim(coalesce(p_search, '')), '');
  if v_term is not null then
    v_term := '%' || replace(replace(v_term, '\', '\\'), '%', '\%') || '%';
    v_term := replace(v_term, '_', '\_');
  end if;

  return query
  select
    p.email,
    p.display_name,
    p.created_at,
    p.onboarded_at,
    coalesce(w.workouts, 0),
    coalesce(w.days, 0),
    coalesce(w.points, 0),
    w.last_at,
    (
      select count(*)::int
      from public.purchases pu
      where pu.email = p.email and pu.status = 'active'
    ),
    exists (
      select 1
      from public.subscriptions s
      where s.email = p.email
        and public.subscription_live(s.status, s.expires_at)
    )
  from public.profiles p
  left join lateral (
    select
      count(*)::int                    as workouts,
      count(distinct ws.local_date)::int as days,
      coalesce(sum(ws.points), 0)::int as points,
      max(ws.completed_at)             as last_at
    from public.workout_sessions ws
    where ws.user_id = p.id and ws.completed_at is not null
  ) w on true
  where v_term is null
     or p.email::text ilike v_term escape '\'
     or coalesce(p.display_name, '') ilike v_term escape '\'
  order by w.last_at desc nulls last, p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
end;
$$;

comment on function public.admin_progress(text, int) is
  'Admin-only: one row per person — workouts done, days trained, points, last seen, what they hold (0025).';

revoke execute on function public.admin_progress(text, int) from public, anon;
grant execute on function public.admin_progress(text, int) to authenticated;
