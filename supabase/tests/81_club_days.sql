-- =============================================================================
-- my_club_days (0023) — даты, за которые сдано задание клуба.
-- Запускать после 10_smoke.sql на той же базе.
--
-- Проверяется то, на чём эта функция может соврать:
--   * день считается от начала раунда и номера дня, а не от `submitted_at` —
--     пруф, отправленный в час ночи, принадлежит вчерашнему дню;
--   * даты идут **через границу раунда**: клуб недельный, и считать внутри
--     одного раунда значило бы обнулять серию каждое воскресенье;
--   * зачёркнутый пруф не считается;
--   * чужие дни не видны;
--   * горизонт в 400 дней обрезает старое.
--
-- Самой серии здесь нет: её считает `src/app/features/marathon/streak.ts`,
-- покрытый своими тестами. Здесь — только список дат.
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
-- `'{}'` и не пустая строка: триггер-страж на `marathon_submissions` зовёт
-- `is_admin()` → `current_email()`, а тот парсит эти claims как JSON. Пустая
-- строка — не JSON, и сев её посеять, тест падает не на том, что проверяет.
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{}', false);
end $$;

select pg_temp.as_super();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'streak@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000c2', 'other@example.com', '{}')
on conflict (id) do nothing;

-- Два недельных раунда подряд: 2026-09-14…20 и 2026-09-21…27. Граница между
-- ними — вечер воскресенья 20-го, и она не должна ничего разрывать.
do $$
declare
  v_r1 uuid;
  v_r2 uuid;
  v_old uuid;
  v_m1 uuid;
  v_m2 uuid;
  v_mo uuid;
  v_mold uuid;
  v_t uuid;
begin
  insert into public.marathons (slug, title, starts_on, days, team_size, status)
  values ('club_w38', 'Неделя 38', date '2026-09-14', 7, 1, 'finished')
  on conflict (slug) do update set starts_on = excluded.starts_on
  returning id into v_r1;

  insert into public.marathons (slug, title, starts_on, days, team_size, status)
  values ('club_w39', 'Неделя 39', date '2026-09-21', 7, 1, 'active')
  on conflict (slug) do update set starts_on = excluded.starts_on
  returning id into v_r2;

  -- Прошлогодний раунд: за горизонтом в 400 дней.
  insert into public.marathons (slug, title, starts_on, days, team_size, status)
  values ('club_old', 'Давно', date '2025-01-06', 7, 1, 'archived')
  on conflict (slug) do update set starts_on = excluded.starts_on
  returning id into v_old;

  insert into public.marathon_members (marathon_id, email) values (v_r1, 'streak@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_m1;
  insert into public.marathon_members (marathon_id, email) values (v_r2, 'streak@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_m2;
  insert into public.marathon_members (marathon_id, email) values (v_old, 'streak@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_mold;
  insert into public.marathon_members (marathon_id, email) values (v_r2, 'other@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_mo;

  -- Одно задание на день: `marathon_submissions` уникальны по (task_id, member_id),
  -- и `day_index` пруфа копирует триггер из задания.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule)
  values (v_r1, 6, 'Задание', 'per_member') returning id into v_t;
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_t, v_m1, v_r1, 6);

  insert into public.marathon_tasks (marathon_id, day_index, title, rule)
  values (v_r1, 7, 'Задание', 'per_member') returning id into v_t;
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_t, v_m1, v_r1, 7);

  -- День 1 второго раунда: 21 сентября. Здесь же чужой пруф в тот же день.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule)
  values (v_r2, 1, 'Задание', 'per_member') returning id into v_t;
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_t, v_m2, v_r2, 1), (v_t, v_mo, v_r2, 1);

  -- День 2: 22 сентября.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule)
  values (v_r2, 2, 'Задание', 'per_member') returning id into v_t;
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_t, v_m2, v_r2, 2);

  -- День 3: 23 сентября, и пруф зачёркнут — его быть не должно.
  --
  -- Зачёркивание идёт отдельным update с выключенным стражем: на insert он
  -- обнуляет `voided_at` всем, кроме админа (0011, ветка `elsif not v_admin`),
  -- и «зачёркнутый» пруф приехал бы в тест живым. Ставить фикстуре админские
  -- права ради одной строки — значит проверять не то правило.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule)
  values (v_r2, 3, 'Задание', 'per_member') returning id into v_t;
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_t, v_m2, v_r2, 3);
  execute 'alter table public.marathon_submissions disable trigger marathon_submissions_guard';
  update public.marathon_submissions
     set voided_at = now(), void_reason = 'не то'
   where task_id = v_t and member_id = v_m2;
  execute 'alter table public.marathon_submissions enable trigger marathon_submissions_guard';

  -- И один за горизонтом в 400 дней.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule)
  values (v_old, 1, 'Задание', 'per_member') returning id into v_t;
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_t, v_mold, v_old, 1);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1', 'streak@example.com');
do $$
declare v_days date[]; begin
  select array_agg(d order by d) into v_days
  from public.my_club_days(date '2026-09-23') as d;

  -- 19, 20, 21, 22: четыре дня подряд **через границу раунда**. 20-е — воскресенье.
  assert v_days = array[date '2026-09-19', date '2026-09-20', date '2026-09-21', date '2026-09-22'],
    'дни идут подряд через границу раунда, получили: ' || coalesce(v_days::text, 'null');

  -- Зачёркнутый день 3 второго раунда — это 23 сентября, и его в списке нет.
  assert not (date '2026-09-23' = any(v_days)), 'зачёркнутый пруф не считается';

  -- Прошлогодний день за горизонтом.
  assert not (date '2025-01-06' = any(v_days)), 'старше 400 дней не отдаётся';
end $$;

-- Будущее не отдаётся: вызов «на вчера» обрезает всё, что после него.
do $$
declare v_n int; begin
  select count(*) into v_n from public.my_club_days(date '2026-09-20') as d;
  assert v_n = 2, 'на 20-е сентября видно два дня, получили ' || v_n;
end $$;

-- Чужие дни не видны.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2', 'other@example.com');
do $$
declare v_days date[]; begin
  select array_agg(d order by d) into v_days from public.my_club_days(date '2026-09-23') as d;
  assert v_days = array[date '2026-09-21'],
    'другой участник видит только свой день, получили: ' || coalesce(v_days::text, 'null');
end $$;

select pg_temp.as_super();
\pset tuples_only off
select 'CLUB DAYS TESTS PASSED' as result;
