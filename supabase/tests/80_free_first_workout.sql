-- =============================================================================
-- Пробная тренировка и активация по оплате (0019).
-- Запускать после 10_smoke.sql на той же базе.
--
-- Проверяется ровно то, на чём эта пара может сломаться:
--   * одна сессия на чужом курсе проходит, вторая — нет, и граница именно
--     «завершённая», а не «начатая»;
--   * купивший курс не ограничен ничем;
--   * платёж включает курс, доставленный дважды — включает один раз;
--   * неоднозначный платёж не угадывается, а остаётся человеку;
--   * вошедший пользователь не может вызвать активацию сам.
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
create or replace function pg_temp.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', false);
  set role service_role;
end $$;
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;

select pg_temp.as_super();
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000080', 'trial@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000081', 'buyer@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000082', 'twocourses@example.com', '{}')
on conflict (id) do nothing;

-- Покупатель владеет курсом; пробующий — нет.
insert into public.purchases (email, course_id, status, activated_at)
values ('buyer@example.com', 'start', 'active', now())
on conflict (email, course_id) do update set status = 'active', activated_at = now();

grant select on public.purchases to service_role;

-- Одна бесплатная, и ровно одна ------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000080', 'trial@example.com');
do $$
declare
  v_first  uuid;
  v_second uuid;
  v_err    text;
begin
  assert public.can_try_course('start'), 'нетронутый курс открыт для пробы';
  assert not public.has_entitlement('start'), 'и при этом не куплен';

  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
  values (auth.uid(), 'start', 's01', 'w_s01_emom', 'normal', 1.0, '{}'::jsonb, current_date)
  returning id into v_first;

  -- Начатая, но не завершённая, ничего не тратит: приложение может начать
  -- тренировку, потерять связь и начать заново.
  assert public.can_try_course('start'), 'незавершённая сессия пробу не тратит';
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
  values (auth.uid(), 'start', 's01', 'w_s01_emom', 'normal', 1.0, '{}'::jsonb, current_date)
  returning id into v_second;

  -- Завершение — вот граница.
  update public.workout_sessions
     set completed_at = now(), results = '{}'::jsonb, rpe = 5, completion = 1
   where id = v_first;

  assert not public.can_try_course('start'), 'завершённая сессия пробу закрывает';

  begin
    insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
    values (auth.uid(), 'start', 's02', 'w_s02_emom', 'normal', 1.0, '{}'::jsonb, current_date);
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;  -- политика отказала, чего мы и ждём
  when others then
    get stacked diagnostics v_err = message_text;
    assert v_err like '%policy%', 'вторую тренировку закрывает RLS, получили: ' || v_err;
  end;

  -- Другой курс — своя проба.
  assert public.can_try_course('engine'), 'проба считается по курсу, а не по человеку';
  -- Несуществующий курс пробы не даёт.
  assert not public.can_try_course('nope'), 'неизвестный курс закрыт';
  assert not public.can_try_course('custom'), 'custom живёт по своим правилам';
end $$;

-- Купивший не ограничен ---------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000081', 'buyer@example.com');
do $$ begin
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
  values (auth.uid(), 'start', 's01', 'w_s01_emom', 'normal', 1.0, '{}'::jsonb, current_date);
  update public.workout_sessions set completed_at = now() where user_id = auth.uid();

  assert not public.can_try_course('start'), 'у него тоже нет пробы — она ему не нужна';
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
  values (auth.uid(), 'start', 's02', 'w_s02_emom', 'normal', 1.0, '{}'::jsonb, current_date);
end $$;

-- Вошедший пользователь не активирует себе курс сам -----------------------------
do $$ declare v_err text; begin
  begin
    perform public.apply_course_payment('trial@example.com', 'ref-hack');
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;
  when others then
    get stacked diagnostics v_err = message_text;
    assert v_err in ('not_allowed', 'permission denied for function apply_course_payment'),
      'активация закрыта от пользователя, получили: ' || v_err;
  end;
end $$;

-- Платёж включает курс, и включает его один раз ----------------------------------
select pg_temp.as_service();
do $$
declare
  v_a uuid;
  v_b uuid;
  v_status text;
  v_at timestamptz;
  v_src text;
begin
  -- Заказ, оформленный до оплаты: это и есть то, что платёж подтверждает.
  insert into public.purchases (email, course_id, status, source)
  values ('trial@example.com', 'start', 'pending', 'app')
  on conflict (email, course_id) do update set status = 'pending', source = 'app';

  v_a := public.apply_course_payment('Trial@Example.com ', 'pay-1');
  assert v_a is not null, 'единственная ожидающая покупка находится';

  select status, activated_at, source into v_status, v_at, v_src
  from public.purchases where id = v_a;
  assert v_status = 'active', 'курс включён, получили ' || v_status;
  assert v_at is not null, 'дата активации проставлена';
  assert v_src = 'prodamus', 'источник — платёжный сервис';

  -- То же уведомление, доставленное повторно.
  v_b := public.apply_course_payment('trial@example.com', 'pay-1');
  assert v_a = v_b, 'повторная доставка активирует ту же строку, а не новую';

  select count(*) into v_status from public.purchases
  where email = 'trial@example.com' and course_id = 'start';
  assert v_status = '1', 'и не плодит строк';
end $$;

-- Неоднозначное не угадывается ----------------------------------------------------
do $$
declare v_id uuid; v_n int; begin
  -- Ни одного заказа: человек оплатил мимо формы.
  v_id := public.apply_course_payment('nobody@example.com', 'pay-2');
  assert v_id is null, 'платёж без заказа остаётся человеку';

  -- Два ожидающих заказа: какой именно оплачен — неизвестно.
  insert into public.purchases (email, course_id, status) values
    ('twocourses@example.com', 'start', 'pending'),
    ('twocourses@example.com', 'engine', 'pending')
  on conflict (email, course_id) do update set status = 'pending';

  v_id := public.apply_course_payment('twocourses@example.com', 'pay-3');
  assert v_id is null, 'два заказа — решает тренер, а не догадка';

  select count(*) into v_n from public.purchases
  where email = 'twocourses@example.com' and status = 'active';
  assert v_n = 0, 'и ничего не включено на всякий случай';

  -- Но если курс назван прямо, сомнений нет.
  v_id := public.apply_course_payment('twocourses@example.com', 'pay-4', now(), 'engine');
  assert v_id is not null, 'явно названный курс включается';
  select count(*) into v_n from public.purchases
  where email = 'twocourses@example.com' and course_id = 'engine' and status = 'active';
  assert v_n = 1, 'именно он';
end $$;

select pg_temp.as_super();
\pset tuples_only off
select 'FREE FIRST WORKOUT TESTS PASSED' as result;
