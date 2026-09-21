-- =============================================================================
-- admin_overview / admin_funnel / admin_progress (0025).
-- Запускать после 10_smoke.sql на той же базе.
--
-- Проверяется то, на чём эти функции могут соврать:
--   * воронка считается **по когортам**: покупка, сделанная сегодня, попадает в
--     неделю первого входа человека, а не в сегодняшнюю. Это всё решение целиком,
--     и без этого теста его легко потерять при первой же правке;
--   * `repeated` — это два разных **собственных** дня (`local_date`), а не две
--     строки: две тренировки за один вечер повтором не являются;
--   * незавершённая тренировка не считается нигде;
--   * человек, заплативший и ни разу не вошедший, виден в `paid_never_signed_in`
--     и не виден в воронке — у него нет когорты;
--   * не-админ не получает ничего.
--
-- Числа проверяются **разницей до и после**: тест идёт по той же базе, что
-- 10_smoke.sql, и его люди тоже лежат в `profiles`. Проверять абсолютные суммы
-- значило бы проверять чужую фикстуру.
--
-- Когорты берутся не датами из календаря, а отступом от текущей недели — иначе
-- через три месяца тест начнёт падать оттого, что фикстура уехала за окно.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

create or replace function pg_temp.as_user(p_id uuid, p_email text, p_role text default 'authenticated')
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', p_role)::text, false);
  execute format('set role %I', p_role);
end $$;

create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{}', false);
end $$;

select pg_temp.as_super();

-- Снимок «до»: всё, что уже лежит в базе от других тестов. Считается теми же
-- выражениями напрямую, а не через `admin_overview()`, — она требует админа,
-- которого в этот момент ещё нет; сама функция проверяется ниже.
create temp table an_before as
select
  (select count(*)::int from public.profiles) as people,
  (select count(*)::int from public.profiles p where p.onboarded_at is not null) as onboarded,
  (
    select count(*)::int
    from (
      select pu.email from public.purchases pu where pu.status = 'active'
      union
      select s.email from public.subscriptions s
      where public.subscription_live(s.status, s.expires_at)
    ) paid
    where not exists (select 1 from public.profiles p where p.email = paid.email)
  ) as paid_never_signed_in;

-- Снимок делает postgres, а читает его блок, уже переключённый на `authenticated`.
grant select on an_before to public;

insert into public.admins (email) values ('analytics-admin@example.com')
on conflict (email) do nothing;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a0', 'analytics-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000a1', 'an-one@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000000a2', 'an-two@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000000a3', 'an-three@example.com', '{}')
on conflict (id) do nothing;

do $$
declare
  v_wk date := date_trunc('week', (now() at time zone 'Europe/Moscow'))::date;
  v_w1 date;
  v_w2 date;
begin
  -- Две когорты в прошлом, каждая своей неделей, и обе далеко от «сейчас», где
  -- лежат люди 10_smoke.sql.
  v_w1 := v_wk - 35;  -- пять недель назад: двое
  v_w2 := v_wk - 42;  -- шесть недель назад: один

  update public.profiles set created_at = v_w1 + 1, onboarded_at = v_w1 + 1
   where email = 'an-one@example.com';
  update public.profiles set created_at = v_w1 + 3, onboarded_at = v_w1 + 3
   where email = 'an-two@example.com';
  -- Третий вошёл и до онбординга не дошёл.
  update public.profiles set created_at = v_w2 + 2, onboarded_at = null
   where email = 'an-three@example.com';

  /*
   * Тренировки задним числом — со снятым стражем.
   *
   * `workout_sessions_guard()` держит `local_date` в пределах суток от серверной
   * даты: это защита от телефона с переведёнными часами, и она верна. Но фикстуре
   * нужны именно прошлые недели, а «подвинуть» их нечем. Заодно страж прижимает
   * очки к потолку конкретной тренировки, а здесь важна сумма, а не потолок.
   */
  execute 'alter table public.workout_sessions disable trigger workout_sessions_guard';

  -- an-one: две тренировки **в один день** — попробовал, но не повторил.
  insert into public.workout_sessions
    (user_id, course_id, node_id, workout_id, points, started_at, completed_at, local_date)
  values
    ('00000000-0000-0000-0000-0000000000a1', 'base', 'd1', 'w1', 10,
     v_w1 + 2, v_w1 + 2, (v_w1 + 2)::date),
    ('00000000-0000-0000-0000-0000000000a1', 'base', 'd2', 'w2', 10,
     v_w1 + 2, v_w1 + 2, (v_w1 + 2)::date);

  -- an-two: два разных дня — это повтор. Плюс третья, незавершённая: она нигде.
  insert into public.workout_sessions
    (user_id, course_id, node_id, workout_id, points, started_at, completed_at, local_date)
  values
    ('00000000-0000-0000-0000-0000000000a2', 'base', 'd1', 'w1', 20,
     v_w1 + 4, v_w1 + 4, (v_w1 + 4)::date),
    ('00000000-0000-0000-0000-0000000000a2', 'base', 'd2', 'w2', 20,
     v_w1 + 5, v_w1 + 5, (v_w1 + 5)::date);
  insert into public.workout_sessions
    (user_id, course_id, node_id, workout_id, points, started_at, completed_at, local_date)
  values
    ('00000000-0000-0000-0000-0000000000a2', 'base', 'd3', 'w3', 0,
     now(), null, (now() at time zone 'Europe/Moscow')::date);

  execute 'alter table public.workout_sessions enable trigger workout_sessions_guard';

  -- Покупка **сегодня** у человека, вошедшего пять недель назад. Она обязана
  -- посчитаться в его неделе — в этом вся когортная воронка.
  insert into public.purchases (email, course_id, status, activated_at)
  values ('an-two@example.com', 'base', 'active', now())
  on conflict (email, course_id) do update set status = 'active';

  -- Шестая неделя: подписка, но ни онбординга, ни тренировок.
  insert into public.subscriptions (email, plan, status, started_at, expires_at)
  values ('an-three@example.com', 'monthly', 'active', now(), now() + interval '30 days')
  on conflict (email) do update set status = 'active', expires_at = excluded.expires_at;

  -- Заплатил и не вошёл: почты нет в `profiles` вовсе.
  insert into public.purchases (email, course_id, status, activated_at)
  values ('an-ghost@example.com', 'base', 'active', now())
  on conflict (email, course_id) do update set status = 'active';
end $$;

-- --- не-админ не видит ничего ------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1', 'an-one@example.com');
do $$
declare v_ok boolean := false; begin
  begin
    perform * from public.admin_funnel(52);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  assert v_ok, 'admin_funnel должен отказывать не-админу';

  v_ok := false;
  begin
    perform * from public.admin_progress(null, 10);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  assert v_ok, 'admin_progress должен отказывать не-админу';

  v_ok := false;
  begin
    perform * from public.admin_overview();
  exception when insufficient_privilege then
    v_ok := true;
  end;
  assert v_ok, 'admin_overview должен отказывать не-админу';
end $$;

-- --- воронка ------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a0', 'analytics-admin@example.com');
do $$
declare
  v_wk date := date_trunc('week', (now() at time zone 'Europe/Moscow'))::date;
  r    record;
begin
  select * into r from public.admin_funnel(52) f where f.week_start = v_wk - 35;
  assert r.signed_up = 2, 'пятая неделя назад: двое вошли, получили ' || coalesce(r.signed_up::text, 'null');
  assert r.onboarded = 2, 'оба прошли онбординг, получили ' || r.onboarded::text;
  assert r.trained   = 2, 'оба тренировались, получили ' || r.trained::text;
  -- Две тренировки an-one за один день повтором не считаются.
  assert r.repeated  = 1, 'повторил один (два разных дня), получили ' || r.repeated::text;
  -- Покупка сделана сегодня, а посчитана здесь. Это и есть когорта.
  assert r.paid      = 1, 'купил один, и в своей неделе входа, получили ' || r.paid::text;

  select * into r from public.admin_funnel(52) f where f.week_start = v_wk - 42;
  assert r.signed_up = 1, 'шестая неделя назад: один вошёл, получили ' || coalesce(r.signed_up::text, 'null');
  assert r.onboarded = 0, 'онбординг не пройден, получили ' || r.onboarded::text;
  assert r.trained   = 0, 'не тренировался, получили ' || r.trained::text;
  assert r.paid      = 1, 'живая подписка — это оплата, получили ' || r.paid::text;

  -- Окно и правда окно: неделя за его краем не приезжает.
  assert not exists (select 1 from public.admin_funnel(2) f where f.week_start = v_wk - 35),
    'admin_funnel(2) не должен отдавать неделю пятинедельной давности';
end $$;

-- --- шапка --------------------------------------------------------------------
do $$
declare
  b record;
  o record;
begin
  select * into b from an_before;
  select * into o from public.admin_overview();

  assert o.people = b.people + 4,
    'три подопытных и админ добавились к людям, получили ' || o.people::text;
  assert o.onboarded = b.onboarded + 2,
    'онбординг прошли двое из троих, получили ' || o.onboarded::text;
  assert o.paid_never_signed_in = b.paid_never_signed_in + 1,
    'один заплативший так и не вошёл, получили ' || o.paid_never_signed_in::text;
end $$;

-- --- прогресс по людям ---------------------------------------------------------
do $$
declare r record; begin
  select * into r from public.admin_progress('an-two', 50);
  assert r.email::text = 'an-two@example.com', 'поиск по части адреса, получили ' || coalesce(r.email::text, 'null');
  assert r.workouts = 2, 'две завершённые (третья не закончена), получили ' || r.workouts::text;
  assert r.days = 2,     'в два разных дня, получили ' || r.days::text;
  assert r.points = 40,  'очки сложены, получили ' || r.points::text;
  assert r.courses = 1,  'один активный курс, получили ' || r.courses::text;
  assert r.subscribed = false, 'подписки нет';

  select * into r from public.admin_progress('an-three', 50);
  assert r.workouts = 0, 'не тренировался, получили ' || r.workouts::text;
  assert r.last_workout_at is null, 'и последней тренировки нет';
  assert r.subscribed = true, 'живая подписка видна';

  /*
   * Никогда не тренировавшиеся — внизу, под всеми, у кого есть последняя дата:
   * последняя строка с датой стоит раньше первой строки без неё. Список для того
   * и отсортирован так, чтобы пропавшие собирались в одном месте, а не тонули
   * между активными.
   */
  assert (
    with ordered as (
      select row_number() over () as rn, p.last_workout_at as last_at
      from public.admin_progress(null, 500) p
    )
    select coalesce(max(rn) filter (where last_at is not null), 0)
         < coalesce(min(rn) filter (where last_at is null), 2147483647)
    from ordered
  ), 'строки без тренировок должны идти после строк с ними';
end $$;

select pg_temp.as_super();
select 'ok 82_admin_analytics';
