-- =============================================================================
-- Creators (0064): applying, opening, a course of theirs, the monthly statement and the invoice.
-- Run on a database with every migration applied (0063 included); it can follow the other suites.
--
-- What this can get wrong:
--   * a malformed or reserved slug, or somebody else's, is accepted; an open creator rewrites
--     their live page through the application;
--   * the statement counts a sale of somebody else's course, a dismissed payment, or a month
--     before the creator was opened;
--   * Start and Pro get the direction of the money wrong: on Start Forma owes the creator their
--     share; on Pro the creator owes Forma its share plus the monthly fee;
--   * the processor's fee is not taken off before the shares;
--   * closing a month twice writes twice, or the running month can be closed;
--   * a non-admin opens a creator, reads a statement, or closes a month.
--
-- Sales are in `XTS` (the ISO test currency) so no other suite's payments land in these rows.
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

select pg_temp.as_super();

insert into public.admins (email) values ('creator-admin@example.com') on conflict (email) do nothing;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000064000', 'creator-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000640a1', 'creator-alla@example.com',  '{}'),
  ('00000000-0000-0000-0000-0000000640b2', 'creator-bob@example.com',   '{}')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 1. Applying.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000640a1', 'creator-alla@example.com');
select pg_temp.expect_error($$select public.creator_apply('A', 'Alla')$$, 'invalid_slug');
select pg_temp.expect_error($$select public.creator_apply('admin', 'Alla')$$, 'invalid_slug');
select pg_temp.expect_error($$select public.creator_apply('alla-yoga', 'A')$$, 'invalid_name');
select pg_temp.expect_error(
  $$select public.creator_apply('alla-yoga', 'Alla', null, 'http://x.example')$$, 'invalid_url');
select public.creator_apply('alla-yoga', 'Alla Yoga', 'Yoga for desk workers',
                            'https://t.me/alla_yoga', 20000);
-- Still applying: the application can be changed.
select public.creator_apply('alla-yoga', 'Alla — Yoga', 'Yoga for desk workers',
                            'https://t.me/alla_yoga', 21000);
do $$
declare r record;
begin
  select * into r from public.my_creator();
  assert r.slug = 'alla-yoga' and r.name = 'Alla — Yoga' and r.status = 'applied'
     and r.tier = 'start' and r.followers = 21000 and r.courses = 0, format('my_creator: %s', r);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000640b2', 'creator-bob@example.com');
select pg_temp.expect_error($$select public.creator_apply('alla-yoga', 'Bob')$$, 'slug_taken');
do $$
begin
  assert not exists (select 1 from public.my_creator()), 'Bob is nobody''s creator';
end $$;
select pg_temp.expect_error($$select * from public.admin_creators()$$, 'not_admin');

select pg_temp.as_user(null, null, 'anon');
select pg_temp.expect_error($$select public.creator_apply('anon-x', 'Anon')$$, '42501');

-- -----------------------------------------------------------------------------
-- 2. The owner opens Alla and gives her a course.
-- -----------------------------------------------------------------------------
select pg_temp.as_super();
insert into public.admin_courses (slug_id) values ('cr_yoga'), ('cr_other') on conflict do nothing;

select pg_temp.as_user('00000000-0000-0000-0000-000000064000', 'creator-admin@example.com');
do $$
declare v_id uuid := (select id from public.admin_creators() where slug = 'alla-yoga');
begin
  perform public.admin_set_creator(v_id, 'active');
  perform public.admin_assign_course('cr_yoga', v_id);
  assert (select status from public.admin_creators() where id = v_id) = 'active', 'opened';
  assert (select approved_at from public.admin_creators() where id = v_id) is not null, 'dated';
  assert (select courses from public.admin_creators() where id = v_id) = 1, 'one course';
  perform pg_temp.expect_error(
    format($q$select public.admin_set_creator(%L, null, 'gold')$q$, v_id), 'invalid_tier');
  perform pg_temp.expect_error(
    format($q$select public.admin_set_creator(%L)$q$,
           (select id from public.admin_creators() where house)), 'house_creator');
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000640a1', 'creator-alla@example.com');
select pg_temp.expect_error($$select public.creator_apply('alla-new', 'Alla')$$, 'already_creator');

-- -----------------------------------------------------------------------------
-- 3. Sales, dated from the creator's opening (moved back two months for the test).
--
--   m1 (last month): two sales of cr_yoga (1000 + 500), one of somebody else's course (700),
--   and a dismissed one of cr_yoga (999). m2: a sale of cr_yoga before nothing — but the creator
--   was opened in m2, so it counts in m2.
-- -----------------------------------------------------------------------------
select pg_temp.as_super();
do $$
declare
  m1 timestamptz := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '1 month') at time zone 'Europe/Moscow';
  m2 timestamptz := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '2 months') at time zone 'Europe/Moscow';
begin
  update public.creators set approved_at = m2 + interval '2 days' where slug = 'alla-yoga';
  insert into public.purchases (email, course_id, status, provider_ref, activated_at) values
    ('buyer1@example.com', 'cr_yoga',  'active', 'cr-1', m1 + interval '1 day'),
    ('buyer2@example.com', 'cr_yoga',  'active', 'cr-2', m1 + interval '2 days'),
    ('buyer3@example.com', 'cr_other', 'active', 'cr-3', m1 + interval '3 days'),
    ('buyer4@example.com', 'cr_yoga',  'active', 'cr-4', m1 + interval '4 days'),
    ('buyer5@example.com', 'cr_yoga',  'active', 'cr-5', m2 + interval '5 days');
  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, currency, provider, resolution) values
    ('buyer1@example.com', 1000, 'cr-1', m1 + interval '1 day',  'course', true, 'XTS', 'test', null),
    ('buyer2@example.com',  500, 'cr-2', m1 + interval '2 days', 'course', true, 'XTS', 'test', null),
    ('buyer3@example.com',  700, 'cr-3', m1 + interval '3 days', 'course', true, 'XTS', 'test', null),
    ('buyer4@example.com',  999, 'cr-4', m1 + interval '4 days', 'course', true, 'XTS', 'test', 'dismissed'),
    ('buyer5@example.com',  200, 'cr-5', m2 + interval '5 days', 'course', true, 'XTS', 'test', null);
end $$;

-- Start: Forma took the money, so it owes Alla 80%.
select pg_temp.as_user('00000000-0000-0000-0000-0000000640a1', 'creator-alla@example.com');
do $$
declare
  m1 date := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '1 month')::date;
  m2 date := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '2 months')::date;
  r record;
begin
  select * into r from public.my_creator_statement(12) where month = m1 and currency = 'XTS';
  assert r.sales = 2 and r.gross = 1500 and r.forma_share = 300 and r.creator_share = 1200
     and r.monthly_fee = 0 and r.balance = -1200 and r.tier = 'start', format('Start, m1: %s', r);
  select * into r from public.my_creator_statement(12) where month = m2 and currency = 'XTS';
  assert r.sales = 1 and r.gross = 200, format('Start, m2: %s', r);
  assert not exists (select 1 from public.my_creator_statement(12) where currency = 'RUB'),
    'no fee line on Start';
  assert (select buyers from public.my_creator()) = 4, 'four buyers of her course';
end $$;

-- Pro with a 5% processor fee: the money is Alla's, she owes Forma 10% of the net plus the fee.
-- Since 0067 a plan change is dated (current month by default); this one is back-dated to her
-- opening month so that last month is billed as Pro.
select pg_temp.as_user('00000000-0000-0000-0000-000000064000', 'creator-admin@example.com');
select public.admin_set_creator((select id from public.admin_creators() where slug = 'alla-yoga'),
                                null, 'pro', 5,
                                (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '2 months')::date);
do $$
declare
  m1 date := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '1 month')::date;
  r record;
begin
  select * into r from public.admin_creator_statement(
    (select id from public.admin_creators() where slug = 'alla-yoga'), 12)
  where month = m1 and currency = 'XTS';
  assert r.forma_share = 142.50 and r.creator_share = 1282.50 and r.balance = 142.50,
    format('Pro, m1 sales: %s', r);
  select * into r from public.admin_creator_statement(
    (select id from public.admin_creators() where slug = 'alla-yoga'), 12)
  where month = m1 and currency = 'RUB';
  assert r.sales = 0 and r.monthly_fee = 4990 and r.balance = 4990, format('Pro, m1 fee: %s', r);
end $$;

-- -----------------------------------------------------------------------------
-- 4. Closing a month.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000640a1', 'creator-alla@example.com');
select pg_temp.expect_error($$select public.close_creator_month(null)$$, '42501');
select pg_temp.expect_error($$select * from public.creator_statement(null, 1)$$, '42501');
select pg_temp.expect_error($$select public.admin_close_creator_month(null)$$, 'not_admin');

select pg_temp.as_user('00000000-0000-0000-0000-000000064000', 'creator-admin@example.com');
do $$
declare
  n int;
  this_m date := date_trunc('month', now() at time zone 'Europe/Moscow')::date;
begin
  n := public.admin_close_creator_month(null);
  assert n >= 2, format('last month closes into at least the sales and the fee: %s', n);
  assert public.admin_close_creator_month(null) = 0, 'a second close writes nothing';
  perform pg_temp.expect_error(format('select public.admin_close_creator_month(%L)', this_m),
                               'month_not_over');
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000640a1', 'creator-alla@example.com');
do $$
declare
  m1 date := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '1 month')::date;
  r record;
begin
  select * into r from public.my_creator_invoices() where month = m1 and currency = 'XTS';
  assert r.number = format('F-%s-alla-yoga-XTS', to_char(m1, 'YYYYMM')) and r.balance = 142.50
     and r.settled_at is null, format('invoice: %s', r);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-000000064000', 'creator-admin@example.com');
do $$
declare v_inv uuid;
begin
  select id into v_inv from public.admin_creator_invoices(
    (select id from public.admin_creators() where slug = 'alla-yoga')) where currency = 'RUB'
  order by month desc limit 1;
  perform public.admin_settle_invoice(v_inv, true);
  assert (select settled_at from public.admin_creator_invoices(
    (select id from public.admin_creators() where slug = 'alla-yoga')) where id = v_inv) is not null,
    'settled';
end $$;

select pg_temp.as_super();
delete from public.creator_invoices where creator_id = (select id from public.creators where slug = 'alla-yoga');
delete from public.payments where provider_ref like 'cr-%' and currency = 'XTS';
delete from public.purchases where provider_ref like 'cr-%';
delete from public.admin_courses where slug_id in ('cr_yoga', 'cr_other');
delete from public.creators where slug = 'alla-yoga';
select 'ok 99_creators';
