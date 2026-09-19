-- Оплата с одной почты, аккаунт на другой (миграция 0020).
--
-- Запуск: psql -v ON_ERROR_STOP=1 -d <db> -f supabase/tests/90_payment_emails.sql
-- на базе, где уже применены 00_shim.sql и все миграции. Ничего не оставляет
-- после себя: всё в одной транзакции, в конце rollback.
--
-- Здесь проверяется не «функция возвращает строку», а четыре утверждения, на
-- которых держится доступ к оплаченному: платёж забирается один раз, забирается
-- только тем, у кого есть номер заказа, чужой привязанный адрес не отдаётся, и
-- перебор номеров упирается в лимит.
begin;

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;

insert into auth.users (id, email, email_confirmed_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'anya@example.com',  now()),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'sergey@example.com', now());

create or replace function pg_temp.as_user(p_uid text, p_email text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'email', p_email, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.as_service() returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;

-- ---------------------------------------------------------------------------
-- 1. Подписка, оплаченная с рабочего адреса, забирается по номеру заказа.
-- ---------------------------------------------------------------------------
select pg_temp.as_service();
select public.record_payment('work@example.com', 7990, 'ORDER-A', now(), 'annual', false);

select pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001', 'anya@example.com');

do $$ begin
  if exists (select 1 from public.my_subscription where is_live) then
    raise exception 'подписка не должна быть живой до того, как платёж забрали';
  end if;
  if public.claim_payment('ORDER-A') <> 'subscription' then
    raise exception 'платёж на сумму годового плана должен открывать подписку';
  end if;
  if not exists (select 1 from public.my_subscription where is_live) then
    raise exception 'после claim_payment подписка должна быть живой';
  end if;
  if not exists (select 1 from public.my_billing_emails() e where e::text = 'work@example.com') then
    raise exception 'платёжный адрес должен быть закреплён за аккаунтом';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Второй раз тот же номер не работает — ни у того же, ни у другого.
-- ---------------------------------------------------------------------------
do $$ begin
  if public.claim_payment('ORDER-A') <> 'not_found' then
    raise exception 'повторный claim того же платежа не должен проходить';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Чужой закреплённый адрес не отдаётся.
--
-- Сергей оплачивает с того же рабочего адреса (так бывает: одна карта на
-- семью). Номер заказа у него свой и настоящий — и всё равно адрес уже занят,
-- и об этом говорят словами, а не тихо открывают доступ.
-- ---------------------------------------------------------------------------
select pg_temp.as_service();
select public.record_payment('work@example.com', 7990, 'ORDER-B', now(), 'annual', false);

select pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000002', 'sergey@example.com');
do $$ begin
  if public.claim_payment('ORDER-B') <> 'email_taken' then
    raise exception 'адрес, закреплённый за другим аккаунтом, не должен привязываться';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Перебор номеров упирается в лимит.
--
-- Неудачная попытка стоит столько же, сколько удачная, — иначе перебор был бы
-- бесплатным. Десять в час на аккаунт.
-- ---------------------------------------------------------------------------
do $$
declare
  v_answer text;
  v_tries  int := 0;
begin
  for i in 1..20 loop
    v_answer := public.claim_payment('MISS-' || i::text);
    exit when v_answer = 'rate_limited';
    v_tries := v_tries + 1;
  end loop;
  if v_tries >= 20 then
    raise exception 'перебор номеров должен упираться в лимит, а он не уперся';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Расширение адресов не трогает то, что не про деньги.
--
-- `my_billing_emails()` подменяет `current_email()` только там, где ищется
-- оплата. Членство в клубе, бронь, согласия и марафон — это «кто ты», а не «чем
-- ты платил»: если бы чужой адрес проходил и туда, привязка платежа тихо
-- отдавала бы чужую историю.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001', 'anya@example.com');
do $$ begin
  if public.current_email()::text <> 'anya@example.com' then
    raise exception 'current_email() должен остаться одним адресом входа';
  end if;
end $$;

\echo 'PAYMENT EMAIL TESTS PASSED'
rollback;
