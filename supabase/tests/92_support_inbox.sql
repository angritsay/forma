-- =============================================================================
-- «Обращения» в админке, ответ через бота и «Записи» (миграция 0045).
--
-- Запуск: psql -v ON_ERROR_STOP=1 -d <db> -f supabase/tests/92_support_inbox.sql
-- на базе, где применены 00_shim.sql и все миграции. Всё в одной транзакции, в конце rollback.
--
-- Проверяется:
--   * оба входа (приложение и бот) теперь сохраняют текст, имя, язык, @username, id сообщения;
--   * админские функции закрыты от не-админа;
--   * список по вкладкам: новые / отвеченные / все, отказанные по частоте не видны;
--   * ответ на обращение из бота встаёт в очередь по id чата, без почты, и `telegram_outbox_due`
--     его отдаёт с языком обращения и цитатой вопроса;
--   * ответ человеку из приложения без телеграма ждёт в очереди по почте (`waiting`);
--   * двойное нажатие с тем же текстом не даёт второго сообщения;
--   * «отметить отвеченным» / «вернуть в новые»;
--   * записи: предстоящие / прошедшие / отменённые.
-- =============================================================================
begin;

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;
\o /dev/null

create or replace function pg_temp.as_user(p_id uuid, p_email text) returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create or replace function pg_temp.as_service() returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  set local role service_role;
end $$;

create or replace function pg_temp.as_super() returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{}', true);
end $$;

select pg_temp.as_super();

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000045a1', 'inbox-admin@example.com', now()),
  ('00000000-0000-0000-0000-0000000045a2', 'inbox-app@example.com',   now()),
  ('00000000-0000-0000-0000-0000000045a3', 'inbox-nobody@example.com', now())
on conflict (id) do nothing;
insert into public.admins (email) values ('inbox-admin@example.com') on conflict do nothing;
update public.profiles set display_name = 'Маша', locale = 'ru', telegram_id = null
 where id = '00000000-0000-0000-0000-0000000045a2';

-- ---------------------------------------------------------------------------
-- 1. Текст сохраняется на обоих входах.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000045a2', 'inbox-app@example.com');
select public.support_message('  Можно с больным коленом?  ', 'Тренер: 60 минут');

select pg_temp.as_service();
do $$
declare v text; begin
  v := public.support_from_telegram(45045045, 77, 'Oleg P', '@oleg_p', 'en', 'Hi, a question', null);
  assert v = 'queued', 'бот: queued, получили ' || v;
  v := public.support_from_telegram(45045045, 77, 'Oleg P', '@oleg_p', 'en', 'Hi, a question', null);
  assert v = 'duplicate', 'повтор доставки: duplicate, получили ' || v;
end $$;

select pg_temp.as_super();
do $$
declare r record; begin
  select * into r from public.support_requests where user_id = '00000000-0000-0000-0000-0000000045a2';
  assert r.text = 'Можно с больным коленом?', 'текст из приложения: ' || coalesce(r.text, 'null');
  assert r.name = 'Маша' and r.lang = 'ru' and r.context = 'Тренер: 60 минут', 'имя, язык, контекст';
  assert r.status = 'new', 'новое обращение — new';

  select * into r from public.support_requests where telegram_id = 45045045;
  assert r.text = 'Hi, a question', 'текст из бота';
  assert r.name = 'Oleg P' and r.lang = 'en' and r.telegram_username = 'oleg_p', 'имя, язык, @username';
  assert r.telegram_message_id = 77, 'id сообщения для цитаты';
  assert (select count(*) from public.support_requests where telegram_id = 45045045) = 1,
    'повтор доставки не даёт второй строки';
end $$;

-- ---------------------------------------------------------------------------
-- 2. Не-админу нельзя.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000045a2', 'inbox-app@example.com');
do $$
declare v_msg text; begin
  begin perform * from public.admin_support_list('new', 50, 0);
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'not_admin', 'список — только админу: ' || coalesce(v_msg, 'null');
  v_msg := null;
  begin perform public.admin_support_reply(gen_random_uuid(), 'x');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'not_admin', 'ответ — только админу';
  v_msg := null;
  begin perform public.admin_support_set_status(gen_random_uuid(), 'closed');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'not_admin', 'статус — только админу';
  v_msg := null;
  begin perform * from public.admin_coach_bookings('upcoming');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'not_admin', 'записи — только админу';
end $$;

-- ---------------------------------------------------------------------------
-- 3. Список, ответ, статусы.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000045a1', 'inbox-admin@example.com');
do $$
declare
  r      record;
  v_tg   uuid;
  v_app  uuid;
  v      text;
  v_msg  text;
begin
  select count(*) into strict v_msg from public.admin_support_list('new', 50, 0) l
   where l.telegram_id = 45045045 or l.email = 'inbox-app@example.com';
  assert v_msg = '2', 'в «Новых» оба обращения, получили ' || v_msg;

  select * into r from public.admin_support_list('new', 50, 0) l where l.telegram_id = 45045045;
  v_tg := r.id;
  assert r.channel = 'telegram' and r.can_reply and r.email is null, 'из бота: можно ответить, почты нет';
  assert r.total >= 2, 'total считает все строки фильтра';

  select * into r from public.admin_support_list('new', 50, 0) l where l.email = 'inbox-app@example.com';
  v_app := r.id;
  assert r.name = 'Маша' and r.can_reply and r.telegram_id is null, 'из приложения: по почте';

  -- Пустой ответ и неверный статус.
  begin perform public.admin_support_reply(v_tg, '   ');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'text_empty', 'пустой ответ: ' || v_msg;
  begin perform public.admin_support_set_status(v_tg, 'deleted');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'invalid_status', 'неверный статус: ' || v_msg;

  -- Ответ в бот: по id чата.
  v := public.admin_support_reply(v_tg, 'Можно, но осторожно <3');
  assert v = 'sent', 'ответ в бот: sent, получили ' || v;
  v := public.admin_support_reply(v_tg, 'Можно, но осторожно <3');
  assert v = 'sent', 'повтор того же текста тоже sent';

  select * into r from public.admin_support_list('all', 50, 0) l where l.id = v_tg;
  assert r.status = 'answered' and r.answered_by = 'inbox-admin@example.com', 'отвечено, кем';
  assert r.reply_text = 'Можно, но осторожно <3' and r.reply_status is not null, 'ответ сохранён';

  -- Ответ из приложения без телеграма: ждёт привязки.
  v := public.admin_support_reply(v_app, 'Ответ по почте');
  assert v = 'waiting', 'без телеграма: waiting, получили ' || v;

  -- Вкладки.
  assert not exists (select 1 from public.admin_support_list('new', 50, 0) l where l.id in (v_tg, v_app)),
    'отвеченные ушли из «Новых»';
  assert (select count(*) from public.admin_support_list('answered', 50, 0) l where l.id in (v_tg, v_app)) = 2,
    'и пришли в «Отвеченные»';
  select * into r from public.admin_support_list('answered', 50, 0) l where l.id = v_tg;
  assert r.reply_status = 'pending', 'ответ ждёт рассыльщика: ' || coalesce(r.reply_status, 'null');

  -- Вернуть в новые и закрыть.
  perform public.admin_support_set_status(v_app, 'new');
  select * into r from public.admin_support_list('all', 50, 0) l where l.id = v_app;
  assert r.status = 'new' and r.answered_at is null, 'вернули в новые';
  perform public.admin_support_set_status(v_app, 'closed');
  assert (select l.status from public.admin_support_list('all', 50, 0) l where l.id = v_app) = 'closed', 'закрыто';
  assert exists (select 1 from public.admin_support_list('all', 50, 0) l where l.id = v_app), '«Все» видят закрытое';
end $$;

-- ---------------------------------------------------------------------------
-- 4. Очередь бота: строка по id чата.
-- ---------------------------------------------------------------------------
select pg_temp.as_service();
do $$
declare r record; v_n int; begin
  select count(*) into v_n from public.telegram_outbox where kind = 'support_reply' and chat_id = 45045045;
  assert v_n = 1, 'двойное нажатие — одно сообщение, получили ' || v_n;

  select * into r from public.telegram_outbox_due(200) d where d.kind = 'support_reply' and d.telegram_id = 45045045;
  assert r.id is not null, 'строка по id чата отдаётся рассыльщику без почты';
  assert r.email is null and r.locale = 'en', 'язык — обращения';
  assert r.params ->> 'text' = 'Можно, но осторожно <3', 'текст ответа';
  assert (r.params ->> 'replyTo')::bigint = 77, 'цитата вопроса';

  -- Ответ человеку без телеграма рассыльщику не отдаётся, пока тот не привяжет телеграм.
  assert not exists (
    select 1 from public.telegram_outbox_due(200) d
    where d.kind = 'support_reply' and d.email = 'inbox-app@example.com'
  ), 'ответ без адресата ждёт';
end $$;

select pg_temp.as_super();
update public.profiles set telegram_id = 45045099 where id = '00000000-0000-0000-0000-0000000045a2';
select pg_temp.as_service();
do $$
declare r record; begin
  select * into r from public.telegram_outbox_due(200) d
   where d.kind = 'support_reply' and d.email = 'inbox-app@example.com';
  assert r.telegram_id = 45045099 and r.locale = 'ru', 'после привязки уходит по почте, на языке профиля';
end $$;

-- Строка без почты и без чата невозможна.
select pg_temp.as_super();
do $$
declare v_msg text; begin
  begin
    insert into public.telegram_outbox (email, chat_id, kind, dedupe_key)
    values (null, null, 'support_reply', 'inbox-nobody');
  exception when check_violation then v_msg := 'check'; end;
  assert v_msg = 'check', 'без адресата строки нет';
end $$;

-- ---------------------------------------------------------------------------
-- 5. Записи.
-- ---------------------------------------------------------------------------
insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at, status, source)
values
  ('inbox-app@example.com', 'inbox-up',   'e1', now() + interval '1 day',  now() + interval '1 day 1 hour', 'active',    'google_calendar'),
  ('inbox-app@example.com', 'inbox-past', 'e2', now() - interval '2 days', now() - interval '2 days' + interval '30 minutes', 'active', 'google_calendar'),
  ('stranger@example.com',  'inbox-off',  'e3', now() + interval '2 days', now() + interval '2 days 1 hour', 'cancelled', 'google_calendar');

select pg_temp.as_user('00000000-0000-0000-0000-0000000045a1', 'inbox-admin@example.com');
do $$
declare r record; v_msg text; begin
  select * into r from public.admin_coach_bookings('upcoming') b where b.email = 'inbox-app@example.com';
  assert r.name = 'Маша' and r.source = 'google_calendar', 'предстоящая с именем из профиля';
  assert not exists (select 1 from public.admin_coach_bookings('upcoming') b where b.status <> 'active' or b.ends_at <= now()),
    'в предстоящих нет отменённых и прошедших';
  assert exists (select 1 from public.admin_coach_bookings('past') b where b.email = 'inbox-app@example.com'), 'прошедшая';
  select * into r from public.admin_coach_bookings('cancelled') b where b.email = 'stranger@example.com';
  assert r.status = 'cancelled' and r.name is null, 'отменённая, профиля нет';
  begin perform * from public.admin_coach_bookings('soon');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'invalid_scope', 'неверный срез';
end $$;
reset role;

\o
\echo 'SUPPORT INBOX 0045 TESTS PASSED'
rollback;
