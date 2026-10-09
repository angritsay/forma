-- =============================================================================
-- Money reports (0063): the first touch on the profile, money per month, paying members per
-- month, and money per channel. Run on a database with every migration applied; it can follow the
-- other suites.
--
-- What this can get wrong:
--   * `set_my_first_source` overwrites the first touch, accepts a label of the wrong shape, or is
--     callable without signing in;
--   * a dismissed payment counts as money, or a bound one stays with the checkout address;
--   * a payer's renewal counts as a new payer;
--   * a member covered by a payment is missed at a month's end, an annual payment adds its whole
--     price to MRR instead of a twelfth, or a member who stopped is not counted as lost;
--   * a referred person is reported under the page they landed on;
--   * a non-admin reads any of it.
--
-- Every money row here is in `XTS` — the ISO code reserved for tests — so no other suite's
-- payments can land in the same rows, and the channel labels are this file's own. Dates are
-- offsets from the current Moscow month, so the file never ages out of the window.
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

insert into public.admins (email) values ('money-admin@example.com') on conflict (email) do nothing;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000063000', 'money-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000630a1', 'money-anna@example.com',  '{}'),
  ('00000000-0000-0000-0000-0000000630b2', 'money-boris@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000630c3', 'money-cleo@example.com',  '{}')
on conflict (id) do nothing;

-- Boris came through a friend's link.
insert into public.referral_codes (code, owner_email) values ('money063', 'money-admin@example.com')
on conflict do nothing;
insert into public.referrals (referred_email, code) values ('money-boris@example.com', 'money063')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 1. The first touch is written once, by its owner, in its shape.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000630a1', 'money-anna@example.com');
do $$
begin
  assert public.set_my_first_source('Bad Label') = false, 'a label of the wrong shape is refused';
  assert public.set_my_first_source('test-money-a') = true, 'the first label is written';
  assert public.set_my_first_source('test-money-later') = false, 'a second label changes nothing';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000630b2', 'money-boris@example.com');
select public.set_my_first_source('test-money-a');

select pg_temp.as_super();
do $$
begin
  assert (select first_source from public.profiles where email = 'money-anna@example.com')
         = 'test-money-a', 'the first touch stays the first';
end $$;

select pg_temp.as_user(null, null, 'anon');
do $$
begin
  perform public.set_my_first_source('test-money-anon');
  raise exception 'anon must not call set_my_first_source';
exception when insufficient_privilege then null;
end $$;

-- -----------------------------------------------------------------------------
-- 2. The ledger.
--
--   m2 = two months ago, m1 = last month (Moscow).
--   Anna:  monthly 100 in m2, monthly 100 in m1, a course 50 in m1 paid from another address and
--          bound to her.
--   Cleo:  monthly 100 in m2, then nothing — she is lost at the end of m1.
--   Boris: annual 1200 in m1.
--   A dismissed payment of 999 in m1 — not money.
-- -----------------------------------------------------------------------------
select pg_temp.as_super();
do $$
declare
  m0 timestamptz := date_trunc('month', now() at time zone 'Europe/Moscow') at time zone 'Europe/Moscow';
  m1 timestamptz := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '1 month') at time zone 'Europe/Moscow';
  m2 timestamptz := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '2 months') at time zone 'Europe/Moscow';
begin
  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, currency, provider, resolution, bound_email) values
    ('money-anna@example.com',  100,  'money-1', m2 + interval '1 day',  'monthly', true,  'XTS', 'test', null, null),
    ('money-anna@example.com',  100,  'money-2', m1 + interval '1 day',  'monthly', true,  'XTS', 'test', null, null),
    ('anna-work@example.com',    50,  'money-3', m1 + interval '3 days', 'course',  false, 'XTS', 'test', 'bound', 'money-anna@example.com'),
    ('money-cleo@example.com',  100,  'money-4', m2 + interval '1 day',  'monthly', true,  'XTS', 'test', null, null),
    ('money-boris@example.com', 1200, 'money-5', m1 + interval '2 days', 'annual',  true,  'XTS', 'test', null, null),
    ('money-boris@example.com', 999,  'money-6', m1 + interval '4 days', 'course',  false, 'XTS', 'test', 'dismissed', null);
  -- m0 is used only to keep the fixture readable next to the reads below.
  perform m0;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Reads, as the admin.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000063000', 'money-admin@example.com');
do $$
declare
  m1 date := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '1 month')::date;
  m2 date := (date_trunc('month', now() at time zone 'Europe/Moscow') - interval '2 months')::date;
  r  record;
begin
  -- Money per month.
  select * into r from public.admin_money_months(12) where month = m2 and currency = 'XTS' and intent = 'monthly';
  assert r.payments = 2 and r.amount = 200 and r.first_payments = 2, format('m2 monthly: %s', r);

  select * into r from public.admin_money_months(12) where month = m1 and currency = 'XTS' and intent = 'monthly';
  assert r.payments = 1 and r.amount = 100 and r.first_payments = 0, format('a renewal is not a new payer: %s', r);

  select * into r from public.admin_money_months(12) where month = m1 and currency = 'XTS' and intent = 'annual';
  assert r.payments = 1 and r.amount = 1200 and r.first_payments = 1, format('m1 annual: %s', r);

  select * into r from public.admin_money_months(12) where month = m1 and currency = 'XTS' and intent = 'course';
  assert r.payments = 1 and r.amount = 50 and r.first_payments = 0,
    format('the bound course payment is Anna''s, and the dismissed one is not money: %s', r);

  -- Paying members at each month's end.
  select * into r from public.admin_members_months(12) where month = m2 and currency = 'XTS';
  assert r.members = 2 and r.monthly = 2 and r.annual = 0 and r.mrr = 200, format('end of m2: %s', r);

  select * into r from public.admin_members_months(12) where month = m1 and currency = 'XTS';
  assert r.members = 2 and r.monthly = 1 and r.annual = 1 and r.mrr = 200 and r.lost = 1,
    format('end of m1: Anna monthly, Boris annual at a twelfth, Cleo lost: %s', r);

  -- Channels.
  select * into r from public.admin_sources(90) where source = 'test-money-a' and currency = 'XTS';
  assert r.people = 1 and r.paid = 1 and r.amount = 250, format('Anna''s channel: %s', r);

  select * into r from public.admin_sources(90) where source = 'referral' and currency = 'XTS';
  assert r.paid >= 1 and r.amount = 1200, format('Boris is a referral, not his landing page: %s', r);
end $$;

-- -----------------------------------------------------------------------------
-- 4. Nobody else reads it.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000630c3', 'money-cleo@example.com');
do $$
begin
  begin
    perform public.admin_money_months(12);
    raise exception 'a non-admin must not read admin_money_months';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_members_months(12);
    raise exception 'a non-admin must not read admin_members_months';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_sources(90);
    raise exception 'a non-admin must not read admin_sources';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.money_payments();
    raise exception 'nobody calls money_payments directly';
  exception when insufficient_privilege then null;
  end;
end $$;

select pg_temp.as_super();
delete from public.payments where provider_ref like 'money-%' and currency = 'XTS';
delete from public.referrals where code = 'money063';
delete from public.referral_codes where code = 'money063';
select 'ok 99_money_reports';
