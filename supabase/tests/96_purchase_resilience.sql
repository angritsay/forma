-- =============================================================================
-- Purchase resilience (migration 0057).
--
-- Run: psql -v ON_ERROR_STOP=1 -d <db> -f supabase/tests/96_purchase_resilience.sql
-- on a database with 00_shim.sql and every migration applied. One transaction, rolled back.
--
-- Checks:
--   * the amount picks the order among several pending ones, the newest on a tie;
--   * several open orders and no amount stay unopened (a person decides);
--   * a pending order older than 48 hours no longer makes a fresh one ambiguous, a lone old
--     order is still honoured, and an old order at the paid price beats a fresh one at another;
--   * `claim_payment` answers `ambiguous` (not `no_order`) with several open orders, burns
--     nothing, tells the owner which it was — and opens the right course when the amount matches;
--   * a payment without an address is recorded unapplied, alerts the owner, and its claim links
--     no empty address;
--   * `record_payment_reversal` puts a refund in the owner's channel, once, under the payment's
--     topic, and is closed to signed-in users.
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

create or replace function pg_temp.as_service() returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  set local role service_role;
end $$;

select pg_temp.as_super();

-- The prices the amount is matched against, whatever the import left in the catalogue.
update public.admin_courses set price_rub = 2990 where slug_id = 'start';
update public.admin_courses set price_rub = 3990 where slug_id in ('engine', 'dumbbells');

-- `set_updated_at` would overwrite the back-dated orders below; this transaction is rolled back.
alter table public.purchases disable trigger set_updated_at;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000057a1', 'pr-claim@example.com',  now()),
  ('00000000-0000-0000-0000-0000000057a2', 'pr-noaddr@example.com', now()),
  ('00000000-0000-0000-0000-0000000057a3', 'pr-match@example.com',  now())
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 1. The amount picks the order. The webhook's calls, so as the service role.
-- ---------------------------------------------------------------------------
select pg_temp.as_service();
insert into public.purchases (email, course_id, status, source, created_at, updated_at) values
  ('pr-two@example.com', 'start',  'pending', 'app', now() - interval '2 hours', now() - interval '2 hours'),
  ('pr-two@example.com', 'engine', 'pending', 'app', now() - interval '1 hour',  now() - interval '1 hour');

do $$
declare v_id uuid; v_course text; v_status text;
begin
  v_id := public.apply_course_payment('pr-two@example.com', 'PR-1', now(), null, 'prodamus', 2990);
  assert v_id is not null, 'the amount names one of two open orders';
  select course_id, status into v_course, v_status from public.purchases where id = v_id;
  assert v_course = 'start' and v_status = 'active', 'the one that costs 2990: ' || v_course;
  select status into v_status from public.purchases
   where email = 'pr-two@example.com' and course_id = 'engine';
  assert v_status = 'pending', 'the other order stays open';
end $$;

-- Two open orders at the same price: the newest one was the one being paid.
insert into public.purchases (email, course_id, status, created_at, updated_at) values
  ('pr-tie@example.com', 'engine',    'pending', now() - interval '3 hours', now() - interval '3 hours'),
  ('pr-tie@example.com', 'dumbbells', 'pending', now() - interval '5 minutes', now() - interval '5 minutes');

do $$
declare v_id uuid; v_course text;
begin
  v_id := public.apply_course_payment('pr-tie@example.com', 'PR-2', now(), null, 'prodamus', 3990);
  select course_id into v_course from public.purchases where id = v_id;
  assert v_course = 'dumbbells', 'the most recent order at that price: ' || coalesce(v_course, 'null');
end $$;

-- ---------------------------------------------------------------------------
-- 2. Several open orders and nothing to choose by: left to a person.
-- ---------------------------------------------------------------------------
insert into public.purchases (email, course_id, status) values
  ('pr-amb@example.com', 'start',  'pending'),
  ('pr-amb@example.com', 'engine', 'pending');

do $$
declare v_n int;
begin
  assert public.apply_course_payment('pr-amb@example.com', 'PR-3') is null,
    'no amount, two open orders: nothing is guessed';
  assert public.apply_course_payment('pr-amb@example.com', 'PR-4', now(), null, 'prodamus', 1234) is null,
    'an amount that is no open order''s price picks nothing either';
  select count(*) into v_n from public.purchases where email = 'pr-amb@example.com' and status = 'active';
  assert v_n = 0, 'and nothing is opened just in case';
end $$;

-- ---------------------------------------------------------------------------
-- 3. Expiry: an order older than 48 hours no longer blocks a fresh one.
-- ---------------------------------------------------------------------------
insert into public.purchases (email, course_id, status, created_at, updated_at) values
  ('pr-old@example.com', 'engine', 'pending', now() - interval '5 days', now() - interval '5 days'),
  ('pr-old@example.com', 'start',  'pending', now() - interval '10 minutes', now() - interval '10 minutes');

do $$
declare v_id uuid; v_course text;
begin
  v_id := public.apply_course_payment('pr-old@example.com', 'PR-5');
  select course_id into v_course from public.purchases where id = v_id;
  assert v_course = 'start', 'the only fresh order is the one paid: ' || coalesce(v_course, 'null');
end $$;

-- The amount outranks freshness: paid at the old order's price, the old order opens — not the
-- only fresh one, which is for another course.
insert into public.purchases (email, course_id, status, created_at, updated_at) values
  ('pr-oldpay@example.com', 'engine', 'pending', now() - interval '5 days', now() - interval '5 days'),
  ('pr-oldpay@example.com', 'start',  'pending', now() - interval '10 minutes', now() - interval '10 minutes');

do $$
declare v_id uuid; v_course text; v_status text;
begin
  v_id := public.apply_course_payment('pr-oldpay@example.com', 'PR-5B', now(), null, 'prodamus', 3990);
  select course_id into v_course from public.purchases where id = v_id;
  assert v_course = 'engine', 'the order at the paid price, however old: ' || coalesce(v_course, 'null');
  select status into v_status from public.purchases
   where email = 'pr-oldpay@example.com' and course_id = 'start';
  assert v_status = 'pending', 'the fresh order for another course stays open';
end $$;

-- A lone old order is still honoured: a late payment for the one thing ordered.
insert into public.purchases (email, course_id, status, created_at, updated_at) values
  ('pr-late@example.com', 'engine', 'pending', now() - interval '6 days', now() - interval '6 days');

do $$
declare v_id uuid;
begin
  v_id := public.apply_course_payment('pr-late@example.com', 'PR-6', now(), null, 'prodamus', 3990);
  assert v_id is not null, 'the only order there is opens, however old';
end $$;

-- Two expired orders and no amount: still ambiguous.
insert into public.purchases (email, course_id, status, created_at, updated_at) values
  ('pr-olds@example.com', 'engine', 'pending', now() - interval '6 days', now() - interval '6 days'),
  ('pr-olds@example.com', 'start',  'pending', now() - interval '7 days', now() - interval '7 days');

do $$ begin
  assert public.apply_course_payment('pr-olds@example.com', 'PR-7') is null,
    'two expired orders and no amount: a person decides';
end $$;

select pg_temp.as_super();

-- ---------------------------------------------------------------------------
-- 4. claim_payment: `ambiguous` is its own answer, and the amount still picks.
-- ---------------------------------------------------------------------------
insert into public.purchases (email, course_id, status) values
  ('pr-claim@example.com', 'start',  'pending'),
  ('pr-claim@example.com', 'engine', 'pending');
select public.record_payment('pr-other@example.com', 1234, 'PR-C1', now(), 'course', false);

select pg_temp.as_user('00000000-0000-0000-0000-0000000057a1', 'pr-claim@example.com');
do $$ begin
  assert public.claim_payment('PR-C1') = 'ambiguous', 'several open orders — ambiguous, not no_order';
end $$;

select pg_temp.as_super();
do $$
declare v_p record; v_reason text;
begin
  select * into v_p from public.payments where provider_ref = 'PR-C1';
  assert v_p.claimed_by is null and not v_p.applied, 'an ambiguous claim burns nothing';
  select params ->> 'reason' into v_reason from public.admin_outbox
   where kind = 'claim_no_order' and params ->> 'ref' = 'PR-C1';
  assert v_reason = 'ambiguous', 'the owner hears which it was: ' || coalesce(v_reason, 'null');
end $$;

-- The same two orders, but the payment's amount is a course price: that course opens.
insert into public.purchases (email, course_id, status) values
  ('pr-match@example.com', 'start',  'pending'),
  ('pr-match@example.com', 'engine', 'pending');
select public.record_payment('pr-match-pay@example.com', 3990, 'PR-C2', now(), 'course', false);

select pg_temp.as_user('00000000-0000-0000-0000-0000000057a3', 'pr-match@example.com');
do $$ begin
  assert public.claim_payment('PR-C2') = 'course', 'the amount picks the order on a claim too';
end $$;

select pg_temp.as_super();
do $$
declare v_status text;
begin
  select status into v_status from public.purchases
   where email = 'pr-match@example.com' and course_id = 'engine';
  assert v_status = 'active', 'the 3990 course, engine: ' || coalesce(v_status, 'null');
  select status into v_status from public.purchases
   where email = 'pr-match@example.com' and course_id = 'start';
  assert v_status = 'pending', 'the other stays open';
end $$;

-- No order at all stays `no_order`.
select public.record_payment('pr-none-pay@example.com', 2990, 'PR-C3', now(), 'course', false);
select pg_temp.as_user('00000000-0000-0000-0000-0000000057a2', 'pr-noaddr@example.com');
do $$ begin
  assert public.claim_payment('PR-C3') = 'no_order', 'no order at all — no_order';
end $$;
select pg_temp.as_super();

-- ---------------------------------------------------------------------------
-- 5. A payment without an address is recorded, alerts the owner, and links nothing empty.
-- ---------------------------------------------------------------------------
select pg_temp.as_service();
do $$
declare v_id uuid;
begin
  v_id := public.record_payment('', 1990, 'PR-NOADDR', now(), 'monthly', true);
  assert v_id is not null, 'a payment with no address is written down';
  assert public.record_payment('', 1990, null, now(), 'monthly', false) is null,
    'with neither address nor number there is nothing to find it by';
end $$;
select pg_temp.as_super();

do $$
declare v_p record; v_n int;
begin
  select * into v_p from public.payments where provider_ref = 'PR-NOADDR';
  assert v_p.email = '' and not v_p.applied, 'empty address, never applied';
  select count(*) into v_n from public.admin_outbox
   where kind = 'payment_unclaimed' and params ->> 'ref' = 'PR-NOADDR';
  assert v_n = 1, 'the owner hears about it';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000057a2', 'pr-noaddr@example.com');
do $$ begin
  assert public.claim_payment('PR-NOADDR') = 'subscription', 'the order number still claims it';
end $$;
select pg_temp.as_super();
do $$
declare v_n int;
begin
  select count(*) into v_n from public.payment_emails where email = '';
  assert v_n = 0, 'no empty address is linked to the account';
end $$;

-- ---------------------------------------------------------------------------
-- 6. Refunds reach the owner, once, under the payment's topic.
-- ---------------------------------------------------------------------------
select public.record_payment('pr-refund@example.com', 7990, 'PR-R1', now(), 'annual', true);

select pg_temp.as_service();
select public.record_payment_reversal('prodamus', 'order_canceled', 'PR-R1');
select public.record_payment_reversal('prodamus', 'order_canceled', 'PR-R1');
select public.record_payment_reversal('lava', 'payment.refunded', 'LAVA-UNKNOWN', 'x@example.com', 19, 'usd');
select pg_temp.as_super();

do $$
declare v_n int; v_topic text; v_email text; v_cur text;
begin
  select count(*), max(topic), max(params ->> 'email') into v_n, v_topic, v_email
  from public.admin_outbox where kind = 'payment_reversed' and params ->> 'ref' = 'PR-R1';
  assert v_n = 1, 'one message per refund, however often it is delivered: ' || v_n;
  assert v_topic = 'club', 'a subscription refund goes to the club topic: ' || v_topic;
  assert v_email = 'pr-refund@example.com', 'with the payer from the ledger';

  select topic, params ->> 'currency' into v_topic, v_cur
  from public.admin_outbox where kind = 'payment_reversed' and params ->> 'ref' = 'LAVA-UNKNOWN';
  assert v_topic = 'courses' and v_cur = 'USD', 'an unknown payment still reaches the owner';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000057a1', 'pr-claim@example.com');
do $$
declare v_msg text;
begin
  begin
    perform public.record_payment_reversal('prodamus', 'x', 'PR-R1');
  exception when insufficient_privilege then v_msg := 'denied'; end;
  assert v_msg = 'denied', 'a signed-in user cannot write to the owner''s channel';
  begin
    perform public.apply_course_payment('pr-claim@example.com', 'PR-HACK', now(), 'start');
    v_msg := 'ran';
  exception when insufficient_privilege then v_msg := 'denied'; end;
  assert v_msg = 'denied', 'nor open a course for themselves';
end $$;
select pg_temp.as_super();

alter table public.purchases enable trigger set_updated_at;

\o
\echo 'PURCHASE RESILIENCE 0057 TESTS PASSED'
rollback;
