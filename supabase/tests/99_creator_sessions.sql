-- =============================================================================
-- Creator sessions and plan history (0067): a 1:1 hour with a creator's coach in the creator's
-- statement at the sessions share, and every month billed by its own plan.
-- Run on a database with every migration applied (0067 included); it can follow the other suites.
--
-- What this can get wrong:
--   * a session with Forma's own coach, a dismissed session payment, or one bound to no booking
--     lands in a creator's statement;
--   * sessions are counted at the course share instead of the sessions share (Start 10%, Pro 5%),
--     or the direction of the money is wrong;
--   * a plan change rewrites the months before it, Pro's fee is charged in a Start month, or a
--     change back loses the Pro months in between;
--   * an invoice drops the sessions, or a month with sessions only is not closed;
--   * a non-admin assigns a coach, a coach goes to the house row, or a plan is dated in the future.
--
-- Money is in `XTS` (the ISO test currency) so no other suite's payments land in these rows; Pro's
-- fee is a rouble line of its own.
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
create or replace function pg_temp.expect_error(p_sql text, p_code text) returns void
language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected % from: %', p_code, p_sql;
exception when others then
  if sqlerrm <> p_code and sqlstate <> p_code then
    raise exception 'expected %, got % (%) from: %', p_code, sqlerrm, sqlstate, p_sql;
  end if;
end $$;
grant execute on function pg_temp.expect_error(text, text) to public;
-- Moscow month starts, n months back, as a date.
create or replace function pg_temp.mon(n int) returns date language sql as $$
  select (date_trunc('month', now() at time zone 'Europe/Moscow') - make_interval(months => n))::date
$$;
grant execute on function pg_temp.mon(int) to public;

select pg_temp.as_super();

insert into public.admins (email) values ('cs-admin@example.com') on conflict (email) do nothing;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000067000', 'cs-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000670c1', 'cs-cleo@example.com',  '{}')
on conflict (id) do nothing;
insert into public.coaches (id, name) values ('cs_cleo', 'Cleo'), ('cs_forma', 'Forma coach')
on conflict (id) do nothing;
insert into public.admin_courses (slug_id) values ('cs_course') on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 1. Cleo applies, is opened (three months back), gets a course and a coach.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000670c1', 'cs-cleo@example.com');
select public.creator_apply('cleo-fit', 'Cleo Fit');
select pg_temp.expect_error(
  $$select public.admin_assign_coach('cs_cleo', (select id from public.my_creator()))$$, 'not_admin');

select pg_temp.as_user('00000000-0000-0000-0000-000000067000', 'cs-admin@example.com');
do $$
declare v_id uuid := (select id from public.admin_creators() where slug = 'cleo-fit');
begin
  perform public.admin_set_creator(v_id, 'active');
  perform public.admin_assign_course('cs_course', v_id);
  perform public.admin_assign_coach('cs_cleo', v_id);
  perform pg_temp.expect_error(
    format($q$select public.admin_assign_coach('cs_forma', %L)$q$,
           (select id from public.admin_creators() where house)), 'not_found');
  perform pg_temp.expect_error(
    format($q$select public.admin_assign_coach('cs_nobody', %L)$q$, v_id), 'coach_not_found');
  perform pg_temp.expect_error(
    format($q$select public.admin_set_creator(%L, null, 'pro', null, %L)$q$, v_id, pg_temp.mon(-1)),
    'invalid_month');
  assert (select creator_id from public.admin_creator_coaches() where id = 'cs_cleo') = v_id,
    'Cleo''s coach is hers';
  assert (select creator_id from public.admin_creator_coaches() where id = 'cs_forma') is null,
    'Forma''s coach is Forma''s';
end $$;

-- -----------------------------------------------------------------------------
-- 2. Money.
--
--   m3: a session with Cleo's coach (1000).
--   m1: a course sale (1000); a session with Cleo's coach (2000); a session with Forma's coach
--       (3000); a dismissed session with Cleo's coach (500); a session payment bound to no
--       booking (700).
-- -----------------------------------------------------------------------------
select pg_temp.as_super();
do $$
declare
  m1 timestamptz := pg_temp.mon(1)::timestamp at time zone 'Europe/Moscow';
  m3 timestamptz := pg_temp.mon(3)::timestamp at time zone 'Europe/Moscow';
  v_pay uuid;
begin
  update public.creators set approved_at = m3 + interval '1 day' where slug = 'cleo-fit';

  insert into public.purchases (email, course_id, status, provider_ref, activated_at)
  values ('cs-b1@example.com', 'cs_course', 'active', 'cs-c1', m1 + interval '1 day');
  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, currency, provider)
  values ('cs-b1@example.com', 1000, 'cs-c1', m1 + interval '1 day', 'course', true, 'XTS', 'test');

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, currency, provider)
  values ('cs-s1@example.com', 1000, 'cs-s1', m3 + interval '3 days', 'session', true, 'XTS', 'test')
  returning id into v_pay;
  insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at,
                                     status, source, coach_id, option_id, payment_id)
  values ('cs-s1@example.com', 'forma:cs-s1', 'forma:cs-s1', m3 + interval '4 days',
          m3 + interval '4 days 1 hour', 'active', 'forma', 'cs_cleo', 'hour', v_pay);

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, currency, provider)
  values ('cs-s2@example.com', 2000, 'cs-s2', m1 + interval '3 days', 'session', true, 'XTS', 'test')
  returning id into v_pay;
  -- Cancelled later: no refunds (0055), so it still counts.
  insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at,
                                     status, source, coach_id, option_id, payment_id)
  values ('cs-s2@example.com', 'forma:cs-s2', 'forma:cs-s2', m1 + interval '4 days',
          m1 + interval '4 days 1 hour', 'cancelled', 'forma', 'cs_cleo', 'hour', v_pay);

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, currency, provider)
  values ('cs-s3@example.com', 3000, 'cs-s3', m1 + interval '5 days', 'session', true, 'XTS', 'test')
  returning id into v_pay;
  insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at,
                                     status, source, coach_id, option_id, payment_id)
  values ('cs-s3@example.com', 'forma:cs-s3', 'forma:cs-s3', m1 + interval '6 days',
          m1 + interval '6 days 1 hour', 'active', 'forma', 'cs_forma', 'hour', v_pay);

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, currency, provider, resolution)
  values ('cs-s4@example.com', 500, 'cs-s4', m1 + interval '7 days', 'session', true, 'XTS', 'test', 'dismissed')
  returning id into v_pay;
  insert into public.coach_bookings (email, external_id, external_event_id, starts_at, ends_at,
                                     status, source, coach_id, option_id, payment_id)
  values ('cs-s4@example.com', 'forma:cs-s4', 'forma:cs-s4', m1 + interval '8 days',
          m1 + interval '8 days 30 minutes', 'active', 'forma', 'cs_cleo', 'half', v_pay);

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, currency, provider)
  values ('cs-s5@example.com', 700, 'cs-s5', m1 + interval '9 days', 'session', false, 'XTS', 'test');
end $$;

-- Start throughout: courses at 20%, sessions at 10%; Forma owes Cleo her part.
select pg_temp.as_user('00000000-0000-0000-0000-0000000670c1', 'cs-cleo@example.com');
do $$
declare r record;
begin
  select * into r from public.my_creator_statement(12) where month = pg_temp.mon(1) and currency = 'XTS';
  assert r.tier = 'start' and r.sales = 1 and r.gross = 1000
     and r.session_sales = 1 and r.session_gross = 2000
     and r.forma_share = 400 and r.creator_share = 2600 and r.monthly_fee = 0
     and r.balance = -2600, format('Start, m1: %s', r);
  select * into r from public.my_creator_statement(12) where month = pg_temp.mon(3) and currency = 'XTS';
  assert r.tier = 'start' and r.sales = 0 and r.gross = 0
     and r.session_sales = 1 and r.session_gross = 1000
     and r.forma_share = 100 and r.creator_share = 900 and r.balance = -900, format('Start, m3: %s', r);
  assert not exists (select 1 from public.my_creator_statement(12) where month = pg_temp.mon(2)),
    'nothing sold in m2 and no fee on Start';
end $$;

-- -----------------------------------------------------------------------------
-- 3. Pro from m2 on: m3 stays Start, m2 and m1 are Pro (sessions at 5%, the fee in roubles).
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000067000', 'cs-admin@example.com');
select public.admin_set_creator((select id from public.admin_creators() where slug = 'cleo-fit'),
                                null, 'pro', null, pg_temp.mon(2));
do $$
declare
  v_id uuid := (select id from public.admin_creators() where slug = 'cleo-fit');
  r record;
begin
  select * into r from public.admin_creator_statement(v_id, 12) where month = pg_temp.mon(3) and currency = 'XTS';
  assert r.tier = 'start' and r.forma_share = 100 and r.balance = -900, format('m3 stays Start: %s', r);
  assert not exists (
    select 1 from public.admin_creator_statement(v_id, 12) where month = pg_temp.mon(3) and currency = 'RUB'
  ), 'no Pro fee in a Start month';

  select * into r from public.admin_creator_statement(v_id, 12) where month = pg_temp.mon(1) and currency = 'XTS';
  assert r.tier = 'pro' and r.session_sales = 1 and r.session_gross = 2000
     and r.forma_share = 200 and r.creator_share = 2800 and r.monthly_fee = 0
     and r.balance = 200, format('Pro, m1: %s', r);
  select * into r from public.admin_creator_statement(v_id, 12) where month = pg_temp.mon(2) and currency = 'RUB';
  assert r.tier = 'pro' and r.monthly_fee = 4990 and r.balance = 4990, format('Pro fee, m2: %s', r);
end $$;

-- Back to Start from this month: the Pro months before it stay Pro.
select public.admin_set_creator((select id from public.admin_creators() where slug = 'cleo-fit'),
                                null, 'start');
do $$
declare v_id uuid := (select id from public.admin_creators() where slug = 'cleo-fit');
begin
  assert (select tier from public.admin_creator_statement(v_id, 12)
          where month = pg_temp.mon(1) and currency = 'XTS') = 'pro', 'm1 is still Pro';
  assert (select monthly_fee from public.admin_creator_statement(v_id, 12)
          where month = pg_temp.mon(1) and currency = 'RUB') = 4990, 'm1 still pays the fee';
  assert not exists (
    select 1 from public.admin_creator_statement(v_id, 12) where month = pg_temp.mon(0)
  ), 'this month is Start: no fee line';
end $$;

-- -----------------------------------------------------------------------------
-- 4. Invoices carry the sessions; a month with sessions only closes too.
-- -----------------------------------------------------------------------------
do $$
begin
  perform public.admin_close_creator_month(pg_temp.mon(3));
  perform public.admin_close_creator_month(pg_temp.mon(1));
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000670c1', 'cs-cleo@example.com');
do $$
declare r record;
begin
  select * into r from public.my_creator_invoices() where month = pg_temp.mon(3) and currency = 'XTS';
  assert r.tier = 'start' and r.sales = 0 and r.session_sales = 1 and r.session_gross = 1000
     and r.balance = -900, format('m3 invoice: %s', r);
  select * into r from public.my_creator_invoices() where month = pg_temp.mon(1) and currency = 'XTS';
  assert r.tier = 'pro' and r.sales = 1 and r.gross = 1000 and r.session_sales = 1
     and r.session_gross = 2000 and r.forma_share = 200 and r.balance = 200,
     format('m1 invoice: %s', r);
  select * into r from public.my_creator_invoices() where month = pg_temp.mon(1) and currency = 'RUB';
  assert r.tier = 'pro' and r.session_sales = 0 and r.monthly_fee = 4990, format('m1 fee invoice: %s', r);
end $$;

select pg_temp.as_super();
delete from public.creator_invoices where creator_id = (select id from public.creators where slug = 'cleo-fit');
delete from public.coach_bookings where external_id like 'forma:cs-s%';
delete from public.payments where provider_ref like 'cs-%' and currency = 'XTS';
delete from public.purchases where provider_ref like 'cs-%';
delete from public.coaches where id in ('cs_cleo', 'cs_forma');
delete from public.admin_courses where slug_id = 'cs_course';
delete from public.creators where slug = 'cleo-fit';
select 'ok 99_creator_sessions';
