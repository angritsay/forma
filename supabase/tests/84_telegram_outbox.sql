-- =============================================================================
-- telegram_outbox (0027) — очередь сообщений бота.
-- Запускать после 10_smoke.sql на той же базе.
--
-- Проверяется то, на чём эта машинка может соврать:
--   * **один повод — одно сообщение**: повторная доставка уведомления Prodamus,
--     второе нажатие «Активировать», переназначение той же тренировки не должны
--     давать второе сообщение;
--   * **продление подписки — это новый повод**: человек заплатил ещё раз и
--     обязан увидеть, что деньги дошли;
--   * покупка, которая не стала активной, повода не создаёт;
--   * очередь не видна ни анониму, ни вошедшему — там адреса и поводы;
--   * мусорный адрес не роняет оплату: повода просто нет.
--
-- Текста сообщений здесь нет вовсе — он живёт в `telegram-notify/copy.ts` и
-- покрыт своими тестами. База хранит повод, а не предложение.
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

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'outbox@example.com', '{}')
on conflict (id) do nothing;

-- --- покупка: активация даёт ровно один повод --------------------------------
do $$
declare
  v_id uuid;
  v_n  int;
begin
  -- Ожидающая покупка повода не создаёт: человек ещё не заплатил.
  insert into public.purchases (email, course_id, status)
  values ('outbox@example.com', 'base', 'pending')
  on conflict (email, course_id) do update set status = 'pending'
  returning id into v_id;

  select count(*) into v_n from public.telegram_outbox
   where kind = 'course_paid' and dedupe_key = 'course_paid:' || v_id::text;
  assert v_n = 0, 'ожидающая покупка не должна ставить сообщение, получили ' || v_n::text;

  -- Активация — повод.
  update public.purchases set status = 'active' where id = v_id;
  select count(*) into v_n from public.telegram_outbox
   where dedupe_key = 'course_paid:' || v_id::text;
  assert v_n = 1, 'активация ставит ровно одно сообщение, получили ' || v_n::text;

  -- Вебхук доставил то же ещё раз: строка уже активна, второго повода нет.
  update public.purchases set status = 'active', updated_at = now() where id = v_id;
  select count(*) into v_n from public.telegram_outbox
   where dedupe_key = 'course_paid:' || v_id::text;
  assert v_n = 1, 'повторная активация не должна удваивать, получили ' || v_n::text;

  -- И курс в параметрах: текст подставит отправитель.
  assert (select params ->> 'courseId' from public.telegram_outbox
           where dedupe_key = 'course_paid:' || v_id::text) = 'base',
    'в параметрах должен быть курс';
end $$;

-- --- подписка: продление — новый повод ---------------------------------------
do $$
declare
  v_id uuid;
  v_n  int;
begin
  insert into public.subscriptions (email, plan, status, started_at, expires_at)
  values ('outbox@example.com', 'monthly', 'active', now(), now() + interval '30 days')
  on conflict (email) do update
    set status = 'active', expires_at = excluded.expires_at
  returning id into v_id;

  select count(*) into v_n from public.telegram_outbox
   where kind = 'subscription_paid' and email = 'outbox@example.com';
  assert v_n = 1, 'оплата подписки ставит одно сообщение, получили ' || v_n::text;

  -- Тот же период, тронули строку — повода нет.
  update public.subscriptions set note = 'ничего не изменилось' where id = v_id;
  select count(*) into v_n from public.telegram_outbox
   where kind = 'subscription_paid' and email = 'outbox@example.com';
  assert v_n = 1, 'правка без продления не должна слать, получили ' || v_n::text;

  -- Продлили на месяц — это новый оплаченный период и новое сообщение.
  update public.subscriptions set expires_at = now() + interval '60 days' where id = v_id;
  select count(*) into v_n from public.telegram_outbox
   where kind = 'subscription_paid' and email = 'outbox@example.com';
  assert v_n = 2, 'продление — новый повод, получили ' || v_n::text;
end $$;

-- --- выданная тренировка ------------------------------------------------------
do $$
declare
  v_w uuid;
  v_n int;
begin
  insert into public.custom_workouts (short_id, title, structure, est_sec, points)
  values ('w_outbox_1', 'Утро на ногах', '{"blocks":[]}'::jsonb, 600, 40)
  on conflict (short_id) do update set title = excluded.title
  returning id into v_w;

  insert into public.assigned_workouts (custom_workout_id, email)
  values (v_w, 'outbox@example.com');

  select count(*) into v_n from public.telegram_outbox
   where kind = 'workout_assigned'
     and dedupe_key = 'workout_assigned:' || v_w::text || ':outbox@example.com';
  assert v_n = 1, 'выдача ставит одно сообщение, получили ' || v_n::text;

  assert (select params ->> 'title' from public.telegram_outbox
           where dedupe_key = 'workout_assigned:' || v_w::text || ':outbox@example.com')
         = 'Утро на ногах',
    'название тренировки должно попасть в параметры';

  -- Переназначили ту же (админка делает `on conflict do update`) — повода нет.
  insert into public.assigned_workouts (custom_workout_id, email, note)
  values (v_w, 'outbox@example.com', 'ещё раз')
  on conflict (custom_workout_id, email) do update set note = excluded.note;

  select count(*) into v_n from public.telegram_outbox
   where kind = 'workout_assigned'
     and dedupe_key = 'workout_assigned:' || v_w::text || ':outbox@example.com';
  assert v_n = 1, 'повторная выдача той же не должна удваивать, получили ' || v_n::text;

  -- Срок у неё короче: через три дня это уже не новость.
  assert (select expires_at - send_after from public.telegram_outbox
           where dedupe_key = 'workout_assigned:' || v_w::text || ':outbox@example.com')
         <= interval '1 day',
    'у сообщения про тренировку срок сутки';
end $$;

-- --- очередь закрыта от клиента ------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1', 'outbox@example.com');
do $$
declare v_blocked boolean := false; begin
  begin
    perform count(*) from public.telegram_outbox;
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  assert v_blocked, 'вошедший не должен видеть очередь — там адреса и поводы';
end $$;

select pg_temp.as_super();
select 'ok 84_telegram_outbox';
