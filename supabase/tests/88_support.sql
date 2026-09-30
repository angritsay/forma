-- =============================================================================
-- «Обращения» (0042) и то, что оплаченная бронь будит канал владельца (0040, 0055).
-- Запускать после 00_shim.sql и всех миграций до 0055 включительно, на той же базе.
--
-- Проверяется:
--   * из приложения — пишет только вошедший, пустое и слишком длинное отказывают, шестое за час —
--     `rate_limited`, имя и язык берутся из профиля, а не из аргументов;
--   * из бота — зовёт только сервисная роль, повтор доставки не даёт второго обращения, после
--     лимита бот один раз слышит `limited` и дальше `muted`;
--   * длинный текст из эмодзи режется так, что строка помещается в `admin_outbox.params`;
--   * бронь, оплаченная через `hold_slot()` + `apply_session_payment()`, ставит в очередь
--     «Выбрали время» ровно один раз — триггер 0055 срабатывает, когда бронь становится активной,
--     а повтор той же оплаты ничего не пишет.
--
-- Свой пользователь (…88e1), а не общий …e1: на одной базе с остальными наборами тот id уже занят
-- другим адресом, и `on conflict do nothing` молча оставлял чужую почту.
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
  ('00000000-0000-0000-0000-0000000088e1', 'support@example.com', '{}')
on conflict (id) do nothing;
update public.profiles
   set display_name = 'Аня', locale = 'en', telegram_id = 777001
 where id = '00000000-0000-0000-0000-0000000088e1';

-- --- из приложения ------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000088e1', 'support@example.com');
do $$
declare v_msg text; begin
  begin
    perform public.support_message('   ');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'text_empty', 'пустое обращение должно отказывать: ' || coalesce(v_msg, 'null');

  v_msg := null;
  begin
    perform public.support_message(repeat('а', 1001));
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'text_too_long', 'длиннее тысячи — отказ: ' || coalesce(v_msg, 'null');

  for i in 1..5 loop
    perform public.support_message('вопрос ' || i, 'Персональная тренировка');
  end loop;

  v_msg := null;
  begin
    perform public.support_message('шестой');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'rate_limited', 'шестое за час должно упереться в лимит: ' || coalesce(v_msg, 'null');
end $$;

select pg_temp.as_super();
do $$
declare v_row record; v_count int; begin
  select count(*) into v_count from public.admin_outbox
   where topic = 'support' and params ->> 'source' = 'app';
  assert v_count = 5, 'из приложения должно дойти ровно пять обращений, а не ' || v_count;

  select * into v_row from public.admin_outbox
   where topic = 'support' and params ->> 'text' = 'вопрос 1';
  assert v_row.kind = 'support_message', 'вид обращения';
  assert v_row.params ->> 'name' = 'Аня', 'имя берётся из профиля';
  assert v_row.params ->> 'locale' = 'en', 'язык берётся из профиля';
  assert v_row.params ->> 'email' = 'support@example.com', 'почта — чтобы было куда ответить';
  assert v_row.params ->> 'tgId' = '777001', 'привязанный телеграм — чтобы ответить там';
  assert v_row.params ->> 'context' = 'Персональная тренировка', 'откуда написали';
end $$;

-- Аноним дверь не видит вовсе.
select pg_temp.as_user('00000000-0000-0000-0000-000000000000', '', 'anon');
do $$
declare v_blocked boolean := false; begin
  begin
    perform public.support_message('привет');
  exception when insufficient_privilege then v_blocked := true; end;
  assert v_blocked, 'аноним не должен писать в канал';
end $$;

-- Вошедший не может выдать себя за бота.
select pg_temp.as_user('00000000-0000-0000-0000-0000000088e1', 'support@example.com');
do $$
declare v_blocked boolean := false; begin
  begin
    perform public.support_from_telegram(1, 1, 'x', 'x', 'ru', 'x');
  exception when insufficient_privilege then v_blocked := true; end;
  assert v_blocked, 'support_from_telegram — только для сервисной роли';

  v_blocked := false;
  begin
    perform count(*) from public.support_requests;
  exception when insufficient_privilege then v_blocked := true; end;
  assert v_blocked, 'журнал частоты закрыт от клиента';
end $$;

-- --- из бота ------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000000', '', 'service_role');
do $$
declare v text; begin
  v := public.support_from_telegram(777001, 10, 'Аня К', '@anya_k', 'ru', 'колено болит, можно?');
  assert v = 'queued', 'первое сообщение передаётся: ' || v;

  v := public.support_from_telegram(777001, 10, 'Аня К', '@anya_k', 'ru', 'колено болит, можно?');
  assert v = 'duplicate', 'повтор доставки того же сообщения: ' || v;

  v := public.support_from_telegram(777002, 1, 'Гость', null, 'en', '   ');
  assert v = 'empty', 'пустое не передаётся: ' || v;

  for i in 2..5 loop
    v := public.support_from_telegram(777002, i, 'Гость', null, 'en', 'msg ' || i);
    assert v = 'queued', 'до лимита всё передаётся: ' || v;
  end loop;
  v := public.support_from_telegram(777002, 6, 'Гость', null, 'en', 'msg 6');
  assert v = 'queued', 'пятое передаётся: ' || v;
  v := public.support_from_telegram(777002, 7, 'Гость', null, 'en', 'msg 7');
  assert v = 'limited', 'шестое — один раз «подожди»: ' || v;
  v := public.support_from_telegram(777002, 8, 'Гость', null, 'en', 'msg 8');
  assert v = 'muted', 'дальше — тишина: ' || v;

  -- Тысяча эмодзи — четыре тысячи байт. Строка всё равно должна лечь в очередь.
  v := public.support_from_telegram(777003, 1, 'Emoji', 'bad name!', 'en', repeat('💪', 1500), 'photo');
  assert v = 'queued', 'длинный текст режется, а не роняет запись: ' || v;
end $$;

select pg_temp.as_super();
do $$
declare v_row record; begin
  select * into v_row from public.admin_outbox where dedupe_key = 'support:tg:777001:10';
  assert v_row.params ->> 'username' = 'anya_k', '@ снимается, имя остаётся';
  assert v_row.params ->> 'account' = 'yes', 'телеграм привязан к профилю — аккаунт есть';
  assert v_row.params ->> 'email' = 'support@example.com', 'почта аккаунта';

  select * into v_row from public.admin_outbox where dedupe_key = 'support:tg:777002:2';
  assert v_row.params ->> 'account' = 'no', 'незнакомый телеграм — аккаунта нет';

  select * into v_row from public.admin_outbox where dedupe_key = 'support:tg:777003:1';
  assert octet_length(v_row.params::text) <= 4096, 'параметры помещаются в очередь';
  assert v_row.params ->> 'username' = '', 'кривой username не пишется';
  assert v_row.params ->> 'attachment' = 'photo', 'вложение отмечено';
end $$;

-- --- оплаченная бронь будит канал владельца ------------------------------------
-- Окно у Сергея через шесть дней, 10:00–11:00 по Москве; в конце набора оно удаляется вместе со
-- всем, что набор тут создал, — чтобы 94_booking_core на той же базе видел чистое расписание.
select pg_temp.as_super();
insert into public.coach_availability_exceptions (coach_id, date, start_time, end_time, kind, note)
values ('sergey', (now() at time zone 'Europe/Moscow')::date + 6, '10:00', '11:00', 'extra', '88_support');

select pg_temp.as_user('00000000-0000-0000-0000-0000000088e1', 'support@example.com');
do $$
declare v_id uuid; begin
  select h.id into v_id from public.hold_slot('sergey', 'half',
    (((now() at time zone 'Europe/Moscow')::date + 6) + time '10:00') at time zone 'Europe/Moscow') h;
  assert v_id is not null, 'окно свободно — бронь держится';
end $$;

select pg_temp.as_super();
do $$
declare v_count int; begin
  select count(*) into v_count from public.admin_outbox
   where topic = 'sessions' and params ->> 'email' = 'support@example.com';
  assert v_count = 0, 'пока бронь не оплачена, в канал не пишется ничего, а не ' || v_count;
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-000000000000', '', 'service_role');
do $$
declare v_id uuid; v_again uuid; begin
  perform public.record_payment('support@example.com', 2500, 'SUPPORT-88-1', now(), 'session', false, 'prodamus');
  v_id := public.apply_session_payment('support@example.com', 'SUPPORT-88-1', 'half');
  assert v_id is not null, 'оплата подтверждает бронь';
  -- Повторная доставка той же оплаты.
  v_again := public.apply_session_payment('support@example.com', 'SUPPORT-88-1', 'half');
  assert v_again = v_id, 'повтор оплаты возвращает ту же бронь';
end $$;

select pg_temp.as_super();
do $$
declare v_count int; begin
  select count(*) into v_count from public.admin_outbox
   where topic = 'sessions' and kind = 'session_booked'
     and params ->> 'email' = 'support@example.com';
  assert v_count = 1, 'оплаченная бронь — ровно одно сообщение о брони, а не ' || v_count;
  -- 0056: оплата, подтвердившая бронь, не пишет своего «Оплачено» (session_paid) отдельно —
  -- её ещё не отправленная строка снимается, а сумму несёт сообщение о брони. Одно на оплату.
  -- Кроме него — ничего: ни второго сообщения на повтор, ни «не нашли бронь».
  select count(*) into v_count from public.admin_outbox
   where topic = 'sessions' and kind = 'session_paid'
     and params ->> 'email' = 'support@example.com';
  assert v_count = 0, 'оплата брони не дублирует «Оплачено», а не ' || v_count;
  assert exists (select 1 from public.admin_outbox
                  where topic = 'sessions' and kind = 'session_booked'
                    and params ->> 'email' = 'support@example.com'
                    and params ->> 'amount' <> ''),
    'сообщение о брони несёт сумму оплаты';
  select count(*) into v_count from public.admin_outbox
   where topic = 'sessions' and kind not in ('session_booked', 'session_paid')
     and params ->> 'email' = 'support@example.com';
  assert v_count = 0, 'повтор оплаты не пишет в канал ничего нового, а не ' || v_count;
end $$;

-- --- уборка ---------------------------------------------------------------------
do $$
begin
  delete from public.coach_bookings where email = 'support@example.com';
  delete from public.telegram_outbox where email = 'support@example.com';
  delete from public.admin_outbox where topic = 'sessions' and params ->> 'email' = 'support@example.com';
  delete from public.payments where provider_ref = 'SUPPORT-88-1';
  delete from public.coach_availability_exceptions where note = '88_support';
  delete from public.order_throttle where bucket = 'hold:00000000-0000-0000-0000-0000000088e1';
end $$;

select 'ok 88_support';
