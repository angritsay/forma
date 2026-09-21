-- =============================================================================
-- Пробная тренировка и активация по оплате (0019, 0022).
-- Запускать после 10_smoke.sql на той же базе.
--
-- Проверяется ровно то, на чём эта пара может сломаться:
--   * на чужом курсе открыт один узел, и он открыт **сколько угодно раз**
--     (0022), а любой другой закрыт;
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

-- Один узел, и его можно повторять ----------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000080', 'trial@example.com');
do $$
declare
  v_first  uuid;
  v_err    text;
begin
  assert public.can_train_free_node('start', 's01'), 'нетронутый курс открыт';
  assert not public.has_entitlement('start'), 'и при этом не куплен';

  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
  values (auth.uid(), 'start', 's01', 'w_s01_emom', 'normal', 1.0, '{}'::jsonb, current_date)
  returning id into v_first;

  update public.workout_sessions
     set completed_at = now(), results = '{}'::jsonb, rpe = 5, completion = 1
   where id = v_first;

  -- Вот эта строка — вся 0022. До неё завершённая сессия закрывала курс целиком,
  -- включая ту самую тренировку, которую человек только что сделал.
  assert public.can_train_free_node('start', 's01'),
    'сделанную бесплатную тренировку можно сделать снова';
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
  values (auth.uid(), 'start', 's01', 'w_s01_emom', 'normal', 1.0, '{}'::jsonb, current_date);

  -- А второй узел закрыт, и был закрыт с самого начала.
  assert not public.can_train_free_node('start', 's02'), 'второй узел не бесплатен';
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

  -- Другой курс — свой бесплатный узел, и любой из них ещё можно выбрать.
  assert public.can_train_free_node('engine', 'e01'), 'считается по курсу, а не по человеку';
  assert public.can_train_free_node('engine', 'e09'), 'на нетронутом курсе открыт любой узел';
  -- Несуществующий курс не даёт ничего.
  assert not public.can_train_free_node('nope', 's01'), 'неизвестный курс закрыт';
  assert not public.can_train_free_node('custom', 's01'), 'custom живёт по своим правилам';
  assert not public.can_train_free_node('start', null), 'узел обязателен';
end $$;

-- Купивший не ограничен ---------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000081', 'buyer@example.com');
do $$ begin
  insert into public.workout_sessions (user_id, course_id, node_id, workout_id, difficulty, scale, prescribed, local_date)
  values (auth.uid(), 'start', 's01', 'w_s01_emom', 'normal', 1.0, '{}'::jsonb, current_date);
  update public.workout_sessions set completed_at = now() where user_id = auth.uid();

  -- Бесплатная дверь ему закрыта — он ходит через покупку, и это не мешает.
  assert not public.can_train_free_node('start', 's02'), 'у него бесплатного узла нет';
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
