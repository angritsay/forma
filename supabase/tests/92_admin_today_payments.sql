-- =============================================================================
-- «Сегодня» и «Платежи» (миграция 0044).
--
-- Запуск: psql -v ON_ERROR_STOP=1 -d <db> -f supabase/tests/92_admin_today_payments.sql
-- на базе, где применены 00_shim.sql и все миграции. Всё в одной транзакции, в конце rollback.
--
-- Проверяется:
--   * не-админ не получает ни сводки, ни журнала, ни кнопок;
--   * `admin_today` считает непривязанные платежи и занятия отдельно, обращения — без 0045;
--   * `admin_payments`: фильтры и одна строка по id;
--   * `admin_bind_payment`: подписка открывается тому, кого выбрали, адрес кассы закрепляется,
--     платёж помечен; курс без заказа — `no_order` и ничего не записано; с курсом — открыт;
--     повторная привязка — отказ; занятие не привязывается;
--   * `claim_payment` не забирает привязанный или разобранный платёж;
--   * `admin_dismiss_payment` убирает из очереди без выдачи;
--   * `admin_end_subscription`: доступ закрыт сразу, возврат — свой статус, канал узнал;
--   * id платежа и клуба в параметрах канала.
--
-- Числа «Сегодня» проверяются разницей до и после: на базе могут лежать чужие строки.
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

create or replace function pg_temp.as_super() returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{}', true);
end $$;

select pg_temp.as_super();

insert into public.admins (email) values ('today-admin@example.com') on conflict do nothing;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000044a0', 'today-admin@example.com', now()),
  ('00000000-0000-0000-0000-0000000044a1', 'today-anna@example.com',  now()),
  ('00000000-0000-0000-0000-0000000044a2', 'today-boris@example.com', now())
on conflict (id) do nothing;

-- Снимок «до», теми же выражениями, что и функция.
create temp table t44_before as
select
  (select count(*) from public.payments y
    where not y.applied and y.resolution is null and y.intent <> 'session') as unclaimed,
  (select count(*) from public.payments y where y.paid_at > now() - interval '24 hours') as paid;
grant select on t44_before to public;

-- Три платежа, записанные «вебхуком»: подписка и курс не привязались, занятие — как в 0043.
select public.record_payment('anna.checkout@example.com', 1990, 'T44-SUB', now(), 'monthly', false, 'lava', 'USD');
select public.record_payment('someone@example.com',       3990, 'T44-COURSE', now(), 'course', false, 'prodamus');
select public.record_payment('someone@example.com',       2990, 'T44-DISMISS', now(), 'course', false, 'prodamus');
select public.record_payment('client@example.com',        3500, 'T44-SESSION', now(), 'session', true, 'prodamus');

-- Платежи читает только база: блоки ниже работают от имени людей и берут id отсюда.
create temp table t44_ids as select provider_ref as ref, id from public.payments where provider_ref like 'T44-%';
grant select on t44_ids to public;

-- ---------------------------------------------------------------------------
-- 1. Не-админ.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000044a2', 'today-boris@example.com');
do $$
begin
  begin
    perform public.admin_today();
    assert false, 'admin_today: не-админ получил сводку';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.admin_payments('all', 10, 0);
    assert false, 'admin_payments: не-админ получил журнал';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_bind_payment(
      (select id from t44_ids limit 1), 'today-boris@example.com');
    assert false, 'admin_bind_payment: не-админ привязал';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_end_subscription('today-boris@example.com', true);
    assert false, 'admin_end_subscription: не-админ закрыл';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 2. «Сегодня» и журнал.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000044a0', 'today-admin@example.com');
do $$
declare
  v    jsonb := public.admin_today();
  b    record;
  v_id uuid;
  n    int;
begin
  select * into b from t44_before;
  assert (v -> 'unclaimed' ->> 'count')::int = b.unclaimed + 3,
    'непривязанных +3 (занятие не считается), получили ' || (v -> 'unclaimed' ->> 'count');
  assert (v -> 'payments' ->> 'count')::int = b.paid + 4, 'оплат за сутки +4';
  assert jsonb_array_length(v -> 'unclaimed' -> 'latest') between 1 and 3, 'последние — не больше трёх';
  assert v -> 'support' ->> 'mode' in ('recent', 'unanswered'), 'обращения считаются и без 0045';
  assert v ? 'signups' and v ? 'clubJoins' and v ? 'proofs' and v ? 'bookings', 'все разделы на месте';

  select count(*) into n from public.admin_payments('unclaimed', 200, 0) p
   where p.provider_ref like 'T44-%';
  assert n = 3, 'фильтр «непривязанные»: три, получили ' || n;

  select count(*) into n from public.admin_payments('sessions', 200, 0) p
   where p.provider_ref like 'T44-%';
  assert n = 1, 'фильтр «занятия»: одно';

  select p.id into v_id from public.admin_payments('all', 200, 0) p where p.provider_ref = 'T44-SUB';
  select count(*) into n from public.admin_payments('all', 10, 0, v_id);
  assert n = 1, 'одна строка по id';
  assert (select p.currency from public.admin_payments('all', 1, 0, v_id) p) = 'USD', 'с валютой';
  assert (select p.provider from public.admin_payments('all', 1, 0, v_id) p) = 'lava', 'с кассой';

  begin
    perform * from public.admin_payments('whatever', 10, 0);
    assert false, 'неизвестный фильтр принят';
  exception when raise_exception then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Привязать подписку к Анне, курс — Борису; разобрать третий платёж.
--
-- Действия — от имени админа, проверки — от имени базы: журнал платежей через API не читает
-- никто, и тест не должен делать вид, что читает.
-- ---------------------------------------------------------------------------
do $$
declare
  v_sub     uuid := (select id from t44_ids where ref = 'T44-SUB');
  v_course  uuid := (select id from t44_ids where ref = 'T44-COURSE');
  v_dismiss uuid := (select id from t44_ids where ref = 'T44-DISMISS');
  v_res     text;
  b         record;
begin
  v_res := public.admin_bind_payment(v_sub, 'Today-Anna@example.com');
  assert v_res = 'subscription', 'ответ subscription, получили ' || v_res;

  begin
    perform public.admin_bind_payment(v_sub, 'today-boris@example.com');
    assert false, 'повторная привязка прошла';
  exception when raise_exception then
    assert sqlerrm = 'already_applied', 'ожидали already_applied, получили ' || sqlerrm;
  end;

  begin
    perform public.admin_bind_payment(
      (select id from t44_ids where ref = 'T44-SESSION'), 'today-boris@example.com');
    assert false, 'занятие привязалось';
  exception when raise_exception then
    assert sqlerrm in ('already_applied', 'session_payment'), 'занятие: ' || sqlerrm;
  end;

  -- Курс без заказа и без названия курса — no_order, и ничего не записано.
  begin
    perform public.admin_bind_payment(v_course, 'today-boris@example.com');
    assert false, 'курс без заказа привязался';
  exception when raise_exception then
    assert sqlerrm = 'no_order', 'ожидали no_order, получили ' || sqlerrm;
  end;
  assert not (select p.applied from public.admin_payments('all', 1, 0, v_course) p), 'платёж не тронут';

  v_res := public.admin_bind_payment(v_course, 'today-boris@example.com', 'start');
  assert v_res = 'course', 'ответ course';
  assert (select p.course_id from public.admin_payments('all', 1, 0, v_course) p) = 'start',
    'журнал знает курс';
  assert (select p.bound_email from public.admin_payments('all', 1, 0, v_course) p)
         = 'today-boris@example.com', 'журнал знает, кому привязан';

  perform public.admin_dismiss_payment(v_dismiss, 'дубль');
  begin
    perform public.admin_dismiss_payment(v_sub, null);
    assert false, 'привязанный платёж разобран';
  exception when raise_exception then null;
  end;

  select * into b from t44_before;
  assert (public.admin_today() -> 'unclaimed' ->> 'count')::int = b.unclaimed,
    'очередь непривязанных вернулась к исходной';
end $$;

select pg_temp.as_super();
do $$
declare
  y public.payments%rowtype;
begin
  assert exists (
    select 1 from public.subscriptions s
    where s.email = 'today-anna@example.com' and s.plan = 'monthly'
      and public.subscription_live(s.status, s.expires_at) and s.source = 'lava'
  ), 'подписка у Анны, касса — lava';

  select * into y from public.payments where provider_ref = 'T44-SUB';
  assert y.applied and y.resolution = 'bound', 'платёж помечен привязанным';
  assert y.bound_email = 'today-anna@example.com', 'кому привязан';
  assert y.resolved_by = 'today-admin@example.com', 'кто привязал';
  assert y.claimed_by = '00000000-0000-0000-0000-0000000044a1', 'аккаунт Анны';
  assert (select user_id from public.payment_emails where email = 'anna.checkout@example.com')
         = '00000000-0000-0000-0000-0000000044a1', 'почта кассы закреплена за Анной';

  assert exists (
    select 1 from public.purchases
    where email = 'today-boris@example.com' and course_id = 'start' and status = 'active'
      and provider_ref = 'T44-COURSE' and source = 'prodamus'
  ), 'курс открыт Борису, касса — Prodamus';

  select * into y from public.payments where provider_ref = 'T44-DISMISS';
  assert y.resolution = 'dismissed' and not y.applied, 'разобран без выдачи';
  assert y.resolve_note = 'дубль', 'с заметкой';
  assert not exists (select 1 from public.purchases where provider_ref = 'T44-DISMISS'), 'ничего не выдано';
end $$;

-- ---------------------------------------------------------------------------
-- 4. claim_payment не забирает решённые платежи.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000044a2', 'today-boris@example.com');
do $$
begin
  assert public.claim_payment('T44-DISMISS') = 'not_found', 'разобранный платёж забран';
  assert public.claim_payment('T44-SUB') = 'not_found', 'привязанный платёж забран';
end $$;

-- ---------------------------------------------------------------------------
-- 5. Закрыть доступ и вернуть подписку.
-- ---------------------------------------------------------------------------
select pg_temp.as_super();
insert into public.subscriptions (email, plan, status, started_at, expires_at)
values ('today-boris@example.com', 'annual', 'active', now() - interval '1 day', now() + interval '300 days')
on conflict (email) do update set status = 'active', expires_at = now() + interval '300 days';

select pg_temp.as_user('00000000-0000-0000-0000-0000000044a0', 'today-admin@example.com');
do $$
begin
  perform public.admin_end_subscription('Today-Boris@example.com', false);
  perform public.admin_end_subscription('today-anna@example.com', true);
  begin
    perform public.admin_end_subscription('nobody-44@example.com', false);
    assert false, 'несуществующая подписка закрыта';
  exception when no_data_found then null;
  end;
end $$;

select pg_temp.as_super();
do $$
declare
  s     public.subscriptions%rowtype;
  v_pay uuid := (select id from t44_ids where ref = 'T44-COURSE');
begin
  select * into s from public.subscriptions where email = 'today-boris@example.com';
  assert s.status = 'cancelled' and s.expires_at <= now(), 'доступ закрыт сейчас';
  assert not public.subscription_live(s.status, s.expires_at), 'и не живой';

  select * into s from public.subscriptions where email = 'today-anna@example.com';
  assert s.status = 'refunded', 'возврат — свой статус';
  assert not public.subscription_live(s.status, s.expires_at), 'возвращённая не даёт доступа';

  -- Канал владельца.
  assert exists (
    select 1 from public.admin_outbox
    where kind = 'club_closed' and params ->> 'email' = 'today-boris@example.com'
  ), 'закрытие доступа — в канал';
  assert exists (
    select 1 from public.admin_outbox
    where kind = 'club_refunded' and params ->> 'email' = 'today-anna@example.com'
  ), 'возврат — в канал';
  assert (select params ->> 'paymentId' from public.admin_outbox
           where dedupe_key = 'payment_unclaimed:' || v_pay::text) = v_pay::text,
    'id платежа в параметрах';
end $$;

\o
\echo 'ADMIN TODAY 0044 TESTS PASSED'
rollback;
