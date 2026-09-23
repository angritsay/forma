-- =============================================================================
-- Серверные исправления (миграция 0043).
--
-- Запуск: psql -v ON_ERROR_STOP=1 -d <db> -f supabase/tests/91_fixes.sql
-- на базе, где применены 00_shim.sql и все миграции. Всё в одной транзакции, в конце rollback.
--
-- Проверяется:
--   * `club_duo_leave()` разрывает только свою пару и отвечает кодами, когда рвать нечего;
--   * «мои очки» и доска не считают выданное тренером лично, и доска вообще отвечает;
--   * тренировка по ссылке отдаёт английскую половину;
--   * `record_payment` пишет валюту, а мусор вместо неё — `null`;
--   * `claim_payment`: курс без заказа — `no_order`, платёж не сожжён, владелец узнал;
--     после оформления заказа тот же номер открывает курс;
--   * `telegram_outbox_due` отдаёт только тех, у кого есть телеграм, и не отдаёт истёкших;
--   * сервисная роль читает брони.
-- =============================================================================
begin;

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;
-- Промежуточные `select` ничего не должны печатать: вывод — только итоговая строка.
\o /dev/null

create or replace function pg_temp.as_user(p_id uuid, p_email text) returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create or replace function pg_temp.as_super() returns void
language plpgsql as $$
begin
  reset role;
  -- `{}`, а не пустая строка: триггеры сессий разбирают клеймы как JSON.
  perform set_config('request.jwt.claims', '{}', true);
end $$;

select pg_temp.as_super();

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000043a1', 'fix-one@example.com',   now()),
  ('00000000-0000-0000-0000-0000000043a2', 'fix-two@example.com',   now()),
  ('00000000-0000-0000-0000-0000000043a3', 'fix-alone@example.com', now()),
  ('00000000-0000-0000-0000-0000000043a4', 'fix-out@example.com',   now())
on conflict (id) do nothing;

insert into public.subscriptions (email, plan, status, started_at, expires_at)
select e, 'monthly', 'active', now() - interval '1 day', now() + interval '30 days'
from unnest(array['fix-one@example.com', 'fix-two@example.com', 'fix-alone@example.com']::citext[]) e
on conflict (email) do update set status = 'active', expires_at = now() + interval '30 days';

-- ---------------------------------------------------------------------------
-- 1. club_duo_leave
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000043a3', 'fix-alone@example.com');
select public.join_club();
do $$
declare v_msg text;
begin
  begin
    perform public.club_duo_leave();
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'no_pair', 'без пары рвать нечего: ' || coalesce(v_msg, 'null');
end $$;

-- Не в клубе вовсе — тот же ответ: пары нет.
select pg_temp.as_user('00000000-0000-0000-0000-0000000043a4', 'fix-out@example.com');
do $$
declare v_msg text;
begin
  begin
    perform public.club_duo_leave();
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'no_pair', 'не участник — тоже no_pair: ' || coalesce(v_msg, 'null');
end $$;

-- Сама `club_duo_break` снаружи по-прежнему закрыта: чужой id не разорвёт чужую пару.
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.club_duo_break(gen_random_uuid());
  exception when insufficient_privilege then v_denied := true; end;
  assert v_denied, 'club_duo_break не должна быть доступна вошедшему';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000043a1', 'fix-one@example.com');
select public.join_club();
select public.club_invite_create() as token \gset
select pg_temp.as_user('00000000-0000-0000-0000-0000000043a2', 'fix-two@example.com');
select public.club_invite_redeem(:'token');

select pg_temp.as_user('00000000-0000-0000-0000-0000000043a1', 'fix-one@example.com');
select public.club_duo_leave();

select pg_temp.as_super();
do $$
declare v_n int;
begin
  select count(*) into v_n
  from public.marathon_members m
  where m.marathon_id = public.club_marathon(true)
    and m.email in ('fix-one@example.com', 'fix-two@example.com')
    and m.team_id is not null;
  assert v_n = 0, 'после club_duo_leave пары нет ни у одной из двух, осталось ' || v_n;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Очки: выданное тренером лично не считается ни дома, ни на доске.
-- ---------------------------------------------------------------------------
insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, completed_at, local_date)
values
  ('00000000-0000-0000-0000-0000000043a1', 'start',  'n1',      'w_fix', 100, now(), current_date),
  ('00000000-0000-0000-0000-0000000043a1', 'custom', 'w_fix_c', 'w_fix',  50, now(), current_date);

select pg_temp.as_user('00000000-0000-0000-0000-0000000043a1', 'fix-one@example.com');
do $$
declare v_t record; v_board bigint; v_start bigint;
begin
  -- Очки сессии зажимает триггер (потолок тренировки), поэтому ждём то, что легло в строку.
  select sum(points) into v_start from public.workout_sessions
   where user_id = auth.uid() and course_id = 'start';
  select * into v_t from public.get_my_totals();
  assert v_start > 0, 'сессия курса должна принести очки';
  assert v_t.points = v_start, 'очки без выданного тренером: ждали ' || v_start || ', получили ' || v_t.points;
  assert v_t.workouts = 2, 'тренировки считаются все: ' || v_t.workouts;

  select b.points into v_board from public.get_leaderboard('all', null, 100) b where b.is_me;
  assert v_board = v_t.points, 'дома и на доске одно и то же число: ' || v_board || ' и ' || v_t.points;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Тренировка по ссылке — с английской половиной.
-- ---------------------------------------------------------------------------
select pg_temp.as_super();
insert into public.custom_workouts (short_id, title, title_en, description, description_en, structure, points, share_token)
values ('w_fix_share', 'Утро', 'Morning', 'Коротко', 'Short', '{"blocks":[]}'::jsonb, 40,
        'fixsharetoken00000000001');

select pg_temp.as_user('00000000-0000-0000-0000-0000000043a2', 'fix-two@example.com');
do $$
declare v_r record;
begin
  select * into v_r from public.get_shared_custom_workout('fixsharetoken00000000001');
  assert v_r.title_en = 'Morning', 'английское название по ссылке';
  assert v_r.description_en = 'Short', 'английское описание по ссылке';
end $$;

-- ---------------------------------------------------------------------------
-- 4. Валюта в журнале.
-- ---------------------------------------------------------------------------
select pg_temp.as_super();
do $$
declare v_id uuid; v_cur text;
begin
  v_id := public.record_payment('cur@example.com', 19, 'FIX-CUR-1', now(), 'monthly', false, 'lava', 'usd');
  select currency into v_cur from public.payments where id = v_id;
  assert v_cur = 'USD', 'валюта записана заглавными: ' || coalesce(v_cur, 'null');

  v_id := public.record_payment('cur@example.com', 19, 'FIX-CUR-2', now(), 'monthly', false, 'lava', 'dollars');
  select currency into v_cur from public.payments where id = v_id;
  assert v_cur is null, 'не код валюты — null, а не отказ';

  v_id := public.record_payment('cur@example.com', 2990, 'FIX-CUR-3', now(), 'course', false, 'prodamus');
  select currency into v_cur from public.payments where id = v_id;
  assert v_cur = 'RUB', 'без валюты — рубли: так звал функцию Prodamus до 0043';
end $$;

-- ---------------------------------------------------------------------------
-- 5. claim_payment: курс без заказа не сжигает платёж.
-- ---------------------------------------------------------------------------
select public.record_payment('fix-pay@example.com', 2990, 'FIX-C1', now(), 'course', false);

select pg_temp.as_user('00000000-0000-0000-0000-0000000043a2', 'fix-two@example.com');
do $$ begin
  assert public.claim_payment('FIX-C1') = 'no_order', 'курс без ожидающего заказа — no_order';
end $$;

select pg_temp.as_super();
do $$
declare v_p record; v_n int;
begin
  select * into v_p from public.payments where provider_ref = 'FIX-C1';
  assert v_p.claimed_by is null, 'платёж без заказа не должен считаться забранным';
  assert not v_p.applied, 'и привязанным тоже';
  select count(*) into v_n from public.admin_outbox
   where kind = 'claim_no_order' and topic = 'courses' and params ->> 'ref' = 'FIX-C1';
  assert v_n = 1, 'владелец узнаёт о платеже, который пришли забрать без заказа';
end $$;

-- Заказ оформлен — тот же номер теперь открывает курс.
insert into public.purchases (email, course_id) values ('fix-two@example.com', 'start');

select pg_temp.as_user('00000000-0000-0000-0000-0000000043a2', 'fix-two@example.com');
do $$ begin
  assert public.claim_payment('FIX-C1') = 'course', 'после заказа платёж забирается и открывает курс';
  assert public.claim_payment('FIX-C1') = 'not_found', 'а второй раз — уже нет';
end $$;

select pg_temp.as_super();
do $$
declare v_status text;
begin
  select status into v_status from public.purchases
   where email = 'fix-two@example.com' and course_id = 'start';
  assert v_status = 'active', 'заказ открыт: ' || coalesce(v_status, 'null');
end $$;

-- ---------------------------------------------------------------------------
-- 6. Очередь бота: сначала те, кому есть куда писать.
-- ---------------------------------------------------------------------------
update public.profiles set telegram_id = 43043043 where email = 'fix-one@example.com';

select public.enqueue_telegram('fix-alone@example.com', 'course_paid', 'fix-due-1', '{}'::jsonb,
                               now() - interval '1 hour');
select public.enqueue_telegram('fix-one@example.com', 'course_paid', 'fix-due-2', '{}'::jsonb,
                               now() - interval '1 minute');
select public.enqueue_telegram('fix-one@example.com', 'course_paid', 'fix-due-3', '{}'::jsonb,
                               now() - interval '5 days');
-- Истёкшая: срок считается от постановки в очередь, так что ставим его руками.
update public.telegram_outbox set expires_at = now() - interval '1 minute' where dedupe_key = 'fix-due-3';

set local role service_role;
do $$
declare v_rows int; v_tg bigint;
begin
  -- Триггеры подписок тоже кладут сюда строки; смотрим только на поставленные выше.
  select count(*), max(telegram_id) into v_rows, v_tg
  from public.telegram_outbox_due(50) d
  where d.id in (select o.id from public.telegram_outbox o where o.dedupe_key like 'fix-due-%');
  assert v_rows = 1, 'только живая строка адресата с телеграмом, получили ' || v_rows;
  assert v_tg = 43043043, 'вместе с id чата';

  -- Брони сервисной роли видны (google-calendar-sync).
  perform count(*) from public.coach_bookings;
end $$;
reset role;

\o
\echo 'FIXES 0043 TESTS PASSED'
rollback;
